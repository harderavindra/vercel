// Campaigns v2: list, read, create, edit, delete and duplicate campaigns.
// Offers are in campaignV2OfferController.js, workflow actions in campaignV2ActionController.js.
import CampaignV2 from '../models/CampaignV2.js';
import Zone from '../models/Zone.js';
import { allocateSerials } from '../utils/allocateSerials.js';
import {
  ROLE, STATUS, STATUS_KEYS, ACTION_KEYS, MONTH_PATTERN, canDo, offerCode, campaignStates,
} from '../constants/campaignV2Workflow.js';
import {
  HttpError, sendError, visibilityFilter, loadCampaign, assertZmmOfZone, addHistory, sameId, MM_ADMIN,
} from '../utils/campaignV2Access.js';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const USER_FIELDS = 'firstName lastName email role zone';

/** What the current user may do on this campaign right now (the frontend uses it to show buttons). */
export const permissionsFor = (campaign, user) => {
  const zmmOfZone = user.role === ROLE.ZMM && !!user.zone && user.zone === campaign.zone;
  const actions = ACTION_KEYS.filter((a) => {
    if (!canDo(a, campaign, user)) return false;
    // ZMM actions are limited to their own zone
    return !['submit', 'approveContent', 'rejectContent'].includes(a) || zmmOfZone;
  });
  const isAgency = sameId(campaign.agency, user.userId);
  return {
    actions,
    editCampaign: zmmOfZone && ['draft', 'offers_rejected'].includes(campaign.status),
    editOffers: zmmOfZone && ['draft', 'offers_rejected'].includes(campaign.status),
    deleteCampaign: zmmOfZone && campaign.status === 'draft',
    duplicate: user.role === ROLE.ZMM && !!user.zone,
    uploadArtwork: isAgency && ['in_progress', 'content_rejected'].includes(campaign.status),
    comment: zmmOfZone && campaign.status === 'content_uploaded',
    editCreativeLinks: isAgency && campaign.status === 'artwork_approved',
    editLandingPages: MM_ADMIN.includes(user.role) && campaign.status === 'links_submitted',
  };
};

const validMonth = (month) => {
  if (!MONTH_PATTERN.test(month)) throw new HttpError(400, 'Month must be YYYY-MM');
  return month;
};

// GET /api/campaigns-v2?zone=&status=&month=&q=
export const listCampaigns = async (req, res) => {
  try {
    const { zone, status, month, q } = req.query;
    const filter = { ...visibilityFilter(req.user) };
    const and = [];
    if (zone) and.push({ zone: String(zone) });
    if (status && STATUS_KEYS.includes(status)) and.push({ status });
    if (month) and.push({ month: String(month) });
    if (q && String(q).trim()) {
      const rx = { $regex: escapeRegex(String(q).trim()), $options: 'i' };
      and.push({ $or: [{ title: rx }, { description: rx }, { 'offers.code': rx }, { zone: rx }] });
    }
    if (and.length) filter.$and = and;

    const campaigns = await CampaignV2.find(filter, '-history -offers.artworkComments')
      .sort({ updatedAt: -1 })
      .populate('createdBy agency', USER_FIELDS)
      .lean({ flattenMaps: true });

    res.status(200).json(
      campaigns.map((c) => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        zone: c.zone,
        month: c.month,
        status: c.status,
        statusLabel: STATUS[c.status]?.label,
        createdBy: c.createdBy,
        agency: c.agency,
        offerCount: c.offers.length,
        states: campaignStates(c),
        offerCodes: c.offers.map((o) => o.code),
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
      }))
    );
  } catch (error) {
    sendError(res, error, 'Failed to fetch campaigns');
  }
};

// GET /api/campaigns-v2/:id  → full campaign + permissions for the current user
export const getCampaign = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    await campaign.populate([
      { path: 'createdBy agency handedTo history.by offers.artworkComments.by offers.artwork.uploadedBy', select: USER_FIELDS },
      { path: 'approvals.$*.by contentApprovals.$*.by', select: USER_FIELDS },
      { path: 'offers.items.features', select: 'text order' },
    ]);
    const json = campaign.toJSON({ flattenMaps: true });
    res.status(200).json({ ...json, statusLabel: STATUS[json.status]?.label, permissions: permissionsFor(campaign, req.user) });
  } catch (error) {
    sendError(res, error, 'Failed to fetch campaign');
  }
};

// POST /api/campaigns-v2  body: { title, description?, month }  (ZMM; zone = the ZMM's own zone)
export const createCampaign = async (req, res) => {
  try {
    const { user } = req;
    if (user.role !== ROLE.ZMM) throw new HttpError(403, 'Only a Zonal Marketing Manager can create campaigns');
    if (!user.zone) throw new HttpError(400, 'Your user has no zone. Ask an admin to set your zone first.');
    const title = clean(req.body?.title);
    if (!title) throw new HttpError(400, 'Title is required');
    const month = validMonth(clean(req.body?.month));
    if (req.body?.zone && req.body.zone !== user.zone) throw new HttpError(403, `You can only create campaigns for ${user.zone}`);
    if (!(await Zone.exists({ name: user.zone }))) throw new HttpError(400, `Zone "${user.zone}" is not in the Zones & States master`);

    const campaign = new CampaignV2({
      title, description: clean(req.body?.description), zone: user.zone, month, status: 'draft', createdBy: user.userId,
    });
    addHistory(campaign, user, 'Campaign draft started');
    await campaign.save();
    res.status(201).json(campaign.toJSON({ flattenMaps: true }));
  } catch (error) {
    sendError(res, error, 'Failed to create campaign');
  }
};

// PUT /api/campaigns-v2/:id  body: { title?, description?, month? }  (zone's ZMM, draft or offers_rejected;
// month only while there are no offers, because offer codes contain the month)
export const updateCampaign = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    assertZmmOfZone(campaign, req.user);
    if (!['draft', 'offers_rejected'].includes(campaign.status)) {
      throw new HttpError(409, 'The campaign can only be edited while it is a draft or its offers were rejected');
    }
    const { title, description, month } = req.body || {};
    if (title !== undefined) {
      if (!clean(title)) throw new HttpError(400, 'Title cannot be empty');
      campaign.title = clean(title);
    }
    if (description !== undefined) campaign.description = clean(description);
    if (month !== undefined && month !== campaign.month) {
      if (campaign.offers.length) throw new HttpError(409, 'The month cannot change once offers exist (offer codes contain it)');
      campaign.month = validMonth(clean(month));
    }
    addHistory(campaign, req.user, 'Campaign details edited');
    await campaign.save();
    res.status(200).json(campaign.toJSON({ flattenMaps: true }));
  } catch (error) {
    sendError(res, error, 'Failed to update campaign');
  }
};

// DELETE /api/campaigns-v2/:id  (zone's ZMM, only drafts that were never submitted)
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    assertZmmOfZone(campaign, req.user);
    if (campaign.status !== 'draft') throw new HttpError(409, 'Only draft campaigns can be deleted');
    await CampaignV2.deleteOne({ _id: campaign._id });
    res.status(200).json({ message: 'Campaign deleted', _id: campaign._id });
  } catch (error) {
    sendError(res, error, 'Failed to delete campaign');
  }
};

// POST /api/campaigns-v2/:id/duplicate  body: { title, description?, month }
// New draft in the ZMM's zone with copies of the offers (new serials/codes; no artwork, links or comments).
export const duplicateCampaign = async (req, res) => {
  try {
    const { user } = req;
    const source = await loadCampaign(req.params.id, user);
    if (user.role !== ROLE.ZMM || !user.zone) throw new HttpError(403, 'Only a Zonal Marketing Manager with a zone can duplicate campaigns');
    const title = clean(req.body?.title) || `Copy of ${source.title}`;
    const month = validMonth(clean(req.body?.month) || source.month);

    let next = source.offers.length ? await allocateSerials(source.offers.length) : 0;
    const offers = source.offers.map((o) => {
      const serial = next++;
      const copy = o.toObject();
      delete copy._id;
      return {
        ...copy, serial, code: offerCode(user.zone, month, serial),
        artwork: null, artworkComments: [], creativeLink: '', landingPage: '',
      };
    });

    const campaign = new CampaignV2({
      title, description: req.body?.description !== undefined ? clean(req.body.description) : source.description,
      zone: user.zone, month, status: 'draft', createdBy: user.userId, offers,
    });
    addHistory(campaign, user, `Campaign duplicated from ${source.title}`);
    await campaign.save();
    res.status(201).json(campaign.toJSON({ flattenMaps: true }));
  } catch (error) {
    sendError(res, error, 'Failed to duplicate campaign');
  }
};
