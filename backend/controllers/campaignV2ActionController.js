// Campaigns v2 workflow actions: POST /api/campaigns-v2/:id/actions/:action
// Every action is checked here (status + role via canDo, zone, per-state rules); the frontend only hides buttons.
import Setting from '../models/Setting.js';
import { WORKFLOW, ACTION_KEYS, canDo, statusAfter, campaignStates } from '../constants/campaignV2Workflow.js';
import {
  HttpError, sendError, loadCampaign, assertZmmOfZone, addHistory, loadAgencyUsers,
} from '../utils/campaignV2Access.js';
import { permissionsFor } from './campaignV2Controller.js';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

// Send states that are not approved (back) for approval; approved states stay approved.
const resubmit = (campaign, mapKey) => {
  const current = campaign[mapKey];
  const sent = [];
  for (const state of campaignStates(campaign)) {
    if (current.get(state)?.status !== 'approved') {
      current.set(state, { status: 'pending' });
      sent.push(state);
    }
  }
  // drop decisions for states that no longer have offers
  for (const key of [...current.keys()]) {
    if (!campaignStates(campaign).includes(key)) current.delete(key);
  }
  return sent;
};

// One state's decision (offers by the Brand Manager, content by the Zonal Manager)
const decideState = (campaign, user, mapKey, body, decision) => {
  const state = clean(body?.state);
  const remark = clean(body?.remark);
  if (!campaignStates(campaign).includes(state)) throw new HttpError(400, `"${state}" has no offers in this campaign`);
  if (campaign[mapKey].get(state)?.status !== 'pending') throw new HttpError(409, `${state} is not awaiting a decision`);
  if (decision === 'rejected' && !remark) throw new HttpError(400, `A remark is required to reject ${state}`);
  campaign[mapKey].set(state, { status: decision, remark, by: user.userId, at: new Date() });
  return { state, remark };
};

// action → handler(campaign, user, body) returning { note, remark, to } (to defaults to WORKFLOW[action].to)
const HANDLERS = {
  submit(campaign, user) {
    assertZmmOfZone(campaign, user);
    if (!campaign.offers.length) throw new HttpError(400, 'Add at least one offer first');
    const sent = resubmit(campaign, 'approvals');
    return { note: sent.join(', '), to: statusAfter('offers', campaign, campaign.approvals) };
  },

  approveOffers(campaign, user, body) {
    const { state, remark } = decideState(campaign, user, 'approvals', body, 'approved');
    return { note: state, remark, to: statusAfter('offers', campaign, campaign.approvals) };
  },

  rejectOffers(campaign, user, body) {
    const { state, remark } = decideState(campaign, user, 'approvals', body, 'rejected');
    return { note: state, remark, to: statusAfter('offers', campaign, campaign.approvals) };
  },

  async assign(campaign, user, body) {
    const [agencyId] = await loadAgencyUsers([body?.agency].filter(Boolean));
    campaign.agency = agencyId;
    return {};
  },

  async changeStatus(campaign, user, body) {
    const agencyStatus = clean(body?.agencyStatus);
    if (!agencyStatus) throw new HttpError(400, 'Choose a status');
    const allowed = (await Setting.findOne({ key: 'agencyStatuses' }).lean())?.values || [];
    if (allowed.length && !allowed.includes(agencyStatus)) throw new HttpError(400, `"${agencyStatus}" is not in Settings → Agency Statuses`);
    campaign.agencyStatus = agencyStatus;
    return { note: agencyStatus };
  },

  uploadContent(campaign) {
    const done = campaign.contentApprovals;
    const missing = campaign.offers.filter((o) => done.get(o.state)?.status !== 'approved' && !o.artwork?.url);
    if (missing.length) {
      throw new HttpError(400, `Upload the artwork for every offer first (missing: ${missing.map((o) => o.code).join(', ')})`);
    }
    const sent = resubmit(campaign, 'contentApprovals');
    return { note: sent.join(', '), to: statusAfter('content', campaign, campaign.contentApprovals) };
  },

  approveContent(campaign, user, body) {
    assertZmmOfZone(campaign, user);
    const { state, remark } = decideState(campaign, user, 'contentApprovals', body, 'approved');
    return { note: state, remark, to: statusAfter('content', campaign, campaign.contentApprovals) };
  },

  rejectContent(campaign, user, body) {
    assertZmmOfZone(campaign, user);
    const { state, remark } = decideState(campaign, user, 'contentApprovals', body, 'rejected');
    return { note: state, remark, to: statusAfter('content', campaign, campaign.contentApprovals) };
  },

  submitLinks(campaign) {
    const missing = campaign.offers.filter((o) => !o.creativeLink);
    if (missing.length) throw new HttpError(400, `Enter the Creative Link for every offer first (missing: ${missing.map((o) => o.code).join(', ')})`);
    return {};
  },

  async assignSecond(campaign, user, body) {
    const missing = campaign.offers.filter((o) => !o.landingPage);
    if (missing.length) throw new HttpError(400, `Enter the Landing Page for every offer first (missing: ${missing.map((o) => o.code).join(', ')})`);
    campaign.handedTo = await loadAgencyUsers(body?.handedTo || []);
    return { note: `${campaign.handedTo.length} agency user(s)` };
  },
};

// POST /api/campaigns-v2/:id/actions/:action  body depends on the action:
//   submit, uploadContent, submitLinks: {}
//   approveOffers / rejectOffers / approveContent / rejectContent: { state, remark }  (remark required to reject)
//   assign: { agency: userId }   changeStatus: { agencyStatus }   assignSecond: { handedTo: [userId] }
export const performAction = async (req, res) => {
  try {
    const { action } = req.params;
    if (!ACTION_KEYS.includes(action)) throw new HttpError(400, `Unknown action: ${action}`);
    const campaign = await loadCampaign(req.params.id, req.user);
    const row = WORKFLOW[action];

    if (!canDo(action, campaign, req.user)) {
      const reason = row.from.includes(campaign.status)
        ? 'You are not allowed to do this'
        : `This cannot be done while the campaign is "${campaign.status}"`;
      throw new HttpError(campaign.status && row.from.includes(campaign.status) ? 403 : 409, reason);
    }

    const result = (await HANDLERS[action](campaign, req.user, req.body || {})) || {};
    campaign.status = result.to || row.to;
    addHistory(campaign, req.user, row.event, { note: result.note || '', remark: result.remark || '' });
    await campaign.save();

    res.status(200).json({
      message: row.event,
      status: campaign.status,
      permissions: permissionsFor(campaign, req.user),
      campaign: campaign.toJSON({ flattenMaps: true }),
    });
  } catch (error) {
    sendError(res, error, 'Failed to perform action');
  }
};
