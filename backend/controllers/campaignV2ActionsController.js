// Campaigns v2 workflow actions (ported from mh-camp ActionPanel.tsx + store.tsx perform()).
//   POST /api/campaigns-v2/:id/actions/:action
// WORKFLOW (constants/campaignV2Workflow.js) is the source of truth for who may act and from which statuses.
// Every action is checked on the server (role, zone / agency ownership, status) and written with ONE
// findOneAndUpdate guarded by { status ∈ from, __v } so two people acting at once cannot both succeed.
import mongoose from 'mongoose';
import CampaignV2 from '../models/CampaignV2.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import {
  WORKFLOW, STATUS, API_ACTIONS, API_ACTION_KEYS, ZONE_SCOPED_ACTIONS, roleAllowed, statusAfter, campaignStates,
} from '../constants/campaignV2Workflow.js';
import {
  HttpError, sendError, loadCampaign, assertZmmOfZone, loadAgencyUsers, isUrl, isId,
} from '../utils/campaignV2Access.js';
import { permissionsFor } from './campaignV2Controller.js';
import { notifyCampaignV2 } from '../utils/notifyCampaignV2.js';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');
const mapToObject = (m) => Object.fromEntries([...(m?.entries?.() || [])].map(([k, v]) => [k, v?.toObject ? v.toObject() : { ...v }]));
const userLabel = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || String(u?._id || '');

// Approved states stay approved; every other campaign state becomes pending. Decisions for states
// that no longer have offers are dropped. Returns { approvals, sent }.
const resubmitStates = (campaign, current) => {
  const approvals = {};
  const sent = [];
  for (const state of campaignStates(campaign)) {
    if (current[state]?.status === 'approved') approvals[state] = current[state];
    else {
      approvals[state] = { status: 'pending' };
      sent.push(state);
    }
  }
  return { approvals, sent };
};

// One state's decision; returns { approvals, state, remark, decision }
const decideState = (campaign, user, current, body) => {
  const decision = clean(body?.decision);
  if (!['approved', 'rejected'].includes(decision)) throw new HttpError(400, 'decision must be "approved" or "rejected"');
  const state = clean(body?.state);
  const remark = clean(body?.remark);
  if (!campaignStates(campaign).includes(state)) throw new HttpError(400, `"${state}" has no offers in this campaign`);
  if (current[state]?.status !== 'pending') throw new HttpError(409, `${state} is not awaiting a decision`);
  if (decision === 'rejected' && !remark) throw new HttpError(400, `A remark is required to reject ${state}`);
  return { approvals: { ...current, [state]: { status: decision, remark, by: user.userId, at: new Date() } }, state, remark, decision };
};

// { offerId: url } → $set paths with arrayFilters; '' clears a link
const linkUpdates = (campaign, map, field) => {
  if (!map || typeof map !== 'object' || Array.isArray(map) || !Object.keys(map).length) {
    throw new HttpError(400, `Send ${field === 'creativeLink' ? 'links' : 'pages'} as { offerId: url }`);
  }
  const set = {};
  const arrayFilters = [];
  const bad = [];
  Object.entries(map).forEach(([offerId, raw], i) => {
    const offer = isId(offerId) ? campaign.offers.id(offerId) : null;
    if (!offer) throw new HttpError(400, `Offer ${offerId} is not in this campaign`);
    const url = clean(raw);
    if (url && !isUrl(url)) bad.push(offer.code);
    set[`offers.$[o${i}].${field}`] = url;
    arrayFilters.push({ [`o${i}._id`]: new mongoose.Types.ObjectId(offerId) });
  });
  if (bad.length) throw new HttpError(400, `Enter a valid http(s) URL for: ${bad.join(', ')}`);
  return { set, arrayFilters };
};

const requireAllLinks = (campaign, field, label) => {
  const missing = campaign.offers.filter((o) => !isUrl(o[field] || ''));
  if (missing.length) throw new HttpError(400, `Enter a valid ${label} for every offer first (missing: ${missing.map((o) => o.code).join(', ')})`);
};

// Each handler returns { set, arrayFilters?, workflowKey?, to?, note?, remark? }
const HANDLERS = {
  // ZMM of the zone: send every not-yet-approved state to the Brand Manager
  submit(campaign) {
    if (!campaign.offers.length) throw new HttpError(400, 'Add at least one offer first');
    const { approvals, sent } = resubmitStates(campaign, mapToObject(campaign.approvals));
    return { set: { approvals }, to: statusAfter('offers', campaign, approvals), note: sent.join(', ') };
  },

  // Brand Manager: approve or reject one state's offers
  decideOffers(campaign, user, body) {
    const r = decideState(campaign, user, mapToObject(campaign.approvals), body);
    return {
      set: { approvals: r.approvals },
      workflowKey: r.decision === 'approved' ? 'approveOffers' : 'rejectOffers',
      to: statusAfter('offers', campaign, r.approvals),
      note: r.state,
      remark: r.remark,
    };
  },

  // MM / Admin: assign an active agency user
  async assign(campaign, user, body) {
    const [agencyId] = await loadAgencyUsers([body?.agencyUserId].filter(Boolean));
    const agency = await User.findById(agencyId, 'firstName lastName email').lean();
    return { set: { agency: agencyId }, note: userLabel(agency) };
  },

  // Assigned agency: set its working status (from Settings → agencyStatuses)
  async changeStatus(campaign, user, body) {
    const agencyStatus = clean(body?.agencyStatus);
    if (!agencyStatus) throw new HttpError(400, 'Choose a status');
    const allowed = (await Setting.findOne({ key: 'agencyStatuses' }).lean())?.values || [];
    if (!allowed.includes(agencyStatus)) {
      throw new HttpError(400, allowed.length ? `"${agencyStatus}" is not in Settings → Agency Statuses` : 'No agency statuses are set up in Settings yet');
    }
    return { set: { agencyStatus }, note: agencyStatus };
  },

  // Assigned agency: send artwork of every not-yet-approved state to the ZMM
  submitArtwork(campaign) {
    const current = mapToObject(campaign.contentApprovals);
    const missing = campaign.offers.filter((o) => current[o.state]?.status !== 'approved' && !o.artwork?.fileName);
    if (missing.length) throw new HttpError(400, `Upload the artwork for every offer first (missing: ${missing.map((o) => o.code).join(', ')})`);
    const { approvals, sent } = resubmitStates(campaign, current);
    return { set: { contentApprovals: approvals }, to: statusAfter('content', campaign, approvals), note: sent.join(', ') };
  },

  // ZMM of the zone: approve or reject one state's artwork
  decideContent(campaign, user, body) {
    const r = decideState(campaign, user, mapToObject(campaign.contentApprovals), body);
    return {
      set: { contentApprovals: r.approvals },
      workflowKey: r.decision === 'approved' ? 'approveContent' : 'rejectContent',
      to: statusAfter('content', campaign, r.approvals),
      note: r.state,
      remark: r.remark,
    };
  },

  // Assigned agency: save creative links { offerId: url } (no status change)
  setCreativeLinks(campaign, user, body) {
    const { set, arrayFilters } = linkUpdates(campaign, body?.links, 'creativeLink');
    return { set, arrayFilters, note: `${arrayFilters.length} offer(s)` };
  },

  // Assigned agency: share the creative links (every offer needs one)
  submitLinks(campaign) {
    requireAllLinks(campaign, 'creativeLink', 'Creative Link');
    return { set: {} };
  },

  // MM / Admin: save landing pages { offerId: url } (no status change)
  setLandingPages(campaign, user, body) {
    const { set, arrayFilters } = linkUpdates(campaign, body?.pages, 'landingPage');
    return { set, arrayFilters, note: `${arrayFilters.length} offer(s)` };
  },

  // MM / Admin: hand the campaign to one or more agency users (every offer needs a landing page)
  async handOver(campaign, user, body) {
    requireAllLinks(campaign, 'landingPage', 'Landing Page');
    const ids = await loadAgencyUsers(body?.agencyUserIds || []);
    const users = await User.find({ _id: { $in: ids } }, 'firstName lastName email').lean();
    return { set: { handedTo: ids }, note: users.map(userLabel).join(', ') };
  },
};

const respond = (res, campaign, user, message) => {
  const json = campaign.toJSON({ flattenMaps: true });
  res.status(200).json({
    message,
    status: campaign.status,
    campaign: { ...json, statusLabel: STATUS[json.status]?.label, permissions: permissionsFor(campaign, user) },
  });
};

// POST /api/campaigns-v2/:id/actions/:action
export const performAction = async (req, res) => {
  try {
    const { action } = req.params;
    const { user } = req;
    if (!API_ACTION_KEYS.includes(action)) throw new HttpError(400, `Unknown action: ${action}`);
    const spec = API_ACTIONS[action];
    const gate = WORKFLOW[spec.gate];
    const campaign = await loadCampaign(req.params.id, user);

    // 1. role / ownership, 2. zone, 3. status
    if (!roleAllowed(spec.gate, campaign, user)) throw new HttpError(403, 'You are not allowed to do this');
    if (ZONE_SCOPED_ACTIONS.includes(action)) assertZmmOfZone(campaign, user);
    if (!gate.from.includes(campaign.status)) {
      throw new HttpError(409, `This cannot be done while the campaign is "${STATUS[campaign.status]?.label || campaign.status}"`);
    }

    const result = (await HANDLERS[action](campaign, user, req.body || {})) || {};
    const row = WORKFLOW[result.workflowKey || spec.gate];
    const changesStatus = spec.transition !== false;
    const nextStatus = changesStatus ? result.to || row.to : campaign.status;

    const update = {
      $set: { ...result.set, ...(changesStatus ? { status: nextStatus } : {}) },
      $push: {
        history: {
          at: new Date(), by: user.userId, role: user.role,
          event: spec.event || row.event, note: result.note || '', remark: result.remark || '',
        },
      },
      $inc: { __v: 1 },
    };

    // Atomic: only if the status is still allowed AND nobody else saved the campaign since we read it
    const updated = await CampaignV2.findOneAndUpdate(
      { _id: campaign._id, status: { $in: gate.from }, __v: campaign.__v },
      update,
      { new: true, arrayFilters: result.arrayFilters }
    );

    if (!updated) {
      const now = await CampaignV2.findById(campaign._id, 'status').lean();
      if (now && now.status !== campaign.status) {
        throw new HttpError(409, `The campaign status changed to "${STATUS[now.status]?.label || now.status}" meanwhile. Reload and try again.`);
      }
      throw new HttpError(409, 'This campaign was changed by someone else. Reload it and try again.');
    }

    // Tell the people WORKFLOW names for this step (off unless NOTIFY_V2_ENABLED=true; never fails the action).
    // Saving links without a status change has no WORKFLOW row, so nobody is notified for it.
    if (changesStatus) await notifyCampaignV2(updated, result.workflowKey || spec.gate, user, result.note || '', result.remark || '');

    respond(res, updated, user, spec.event || row.event);
  } catch (error) {
    sendError(res, error, 'Failed to perform action');
  }
};
