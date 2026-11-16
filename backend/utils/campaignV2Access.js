// Shared rules for the Campaigns v2 API: who sees a campaign, loading it, history entries,
// error responses, and validating an offer against the masters.
import mongoose from 'mongoose';
import CampaignV2 from '../models/CampaignV2.js';
import User from '../models/User.js';
import Zone from '../models/Zone.js';
import Language from '../models/Language.js';
import Setting from '../models/Setting.js';
import CatalogBrand from '../models/CatalogBrand.js'; // Campaigns v2 brand/model list (not the old Master Data)
import CatalogModel from '../models/CatalogModel.js';
import OfferFeature from '../models/OfferFeature.js';
import { ROLE, MAX_ITEMS, MAX_FEATURES, PRICE_TYPES, validPrice } from '../constants/campaignV2Workflow.js';

export const ADMINS = [ROLE.ADMIN, ROLE.MASTER_ADMIN];
export const MM_ADMIN = [ROLE.MM, ...ADMINS];

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const isId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);
export const sameId = (a, b) => a != null && b != null && String(a._id ?? a) === String(b._id ?? b);
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/** Sends an error from a controller; VersionError = someone else saved the campaign meanwhile. */
export const sendError = (res, error, fallback) => {
  if (error instanceof HttpError) return res.status(error.status).json({ message: error.message, ...error.extra });
  if (error.name === 'VersionError') {
    return res.status(409).json({ message: 'This campaign was changed by someone else. Reload it and try again.' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join('; ') });
  }
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

/** authenticate only sets userId/role/email/name; campaigns also need the user's zone and status. */
export const loadCurrentUser = async (req, res, next) => {
  try {
    const u = await User.findById(req.user.userId).select('zone status role firstName lastName').lean();
    if (!u) return res.status(401).json({ message: 'User not found' });
    if (u.status === 'inactive') return res.status(403).json({ message: 'Your account is inactive' });
    req.user.zone = u.zone || '';
    next();
  } catch (error) {
    sendError(res, error, 'Failed to load user');
  }
};

/** Mongo filter for the campaigns a user may see. */
export const visibilityFilter = (user) => {
  if (user.role === ROLE.ZMM) {
    // A Zonal Marketing Manager sees only their zone; without a zone they see nothing
    return user.zone ? { zone: user.zone } : { _id: null };
  }
  if (user.role === ROLE.AGENCY_ROLE) {
    return { $or: [{ agency: user.userId }, { handedTo: user.userId }] };
  }
  return {}; // brand manager, marketing manager, admins, moderators: all campaigns
};

export const canSee = (campaign, user) => {
  if (user.role === ROLE.ZMM) return !!user.zone && campaign.zone === user.zone;
  if (user.role === ROLE.AGENCY_ROLE) {
    return sameId(campaign.agency, user.userId) || (campaign.handedTo || []).some((u) => sameId(u, user.userId));
  }
  return true;
};

/** Loads a campaign the user may see, or throws 400/404 (404 also when it is not visible). */
export const loadCampaign = async (id, user) => {
  if (!isId(id)) throw new HttpError(400, 'Invalid campaign id');
  const campaign = await CampaignV2.findById(id);
  if (!campaign || !canSee(campaign, user)) throw new HttpError(404, 'Campaign not found');
  return campaign;
};

/** The ZMM who edits offers/approves content must be in the campaign's zone. */
export const assertZmmOfZone = (campaign, user) => {
  if (user.role !== ROLE.ZMM) throw new HttpError(403, 'Only the Zonal Marketing Manager can do this');
  if (!user.zone || user.zone !== campaign.zone) throw new HttpError(403, `Only the Zonal Marketing Manager of ${campaign.zone} can do this`);
};

/** Offers can be added/edited/removed by the zone's ZMM while the campaign is a draft or rejected. */
// Offers are freely editable in these statuses (changing an approved state's offer un-approves it)
export const OFFER_EDIT_STATUSES = ['draft', 'offers_rejected'];
// While the Brand Manager reviews, the ZMM may still edit or remove offers of states that are not approved yet
export const isUnderReview = (campaign) => campaign.status === 'pending_offer_approval';
export const offerDecision = (campaign, state) => {
  const a = campaign.approvals;
  return (a instanceof Map ? a.get(state) : a?.[state])?.status;
};

/**
 * Who may change offers, and when.
 * opts.adding: a new offer. opts.offerState: the state of the offer being edited / removed.
 * opts.newState: the state an edited offer moves to (checked after validation).
 */
export const assertCanEditOffers = (campaign, user, { adding = false, offerState, newState } = {}) => {
  assertZmmOfZone(campaign, user);
  if (OFFER_EDIT_STATUSES.includes(campaign.status)) return;
  if (!isUnderReview(campaign)) {
    throw new HttpError(409, 'Offers can only be changed until the Brand Manager approves them');
  }
  if (adding) {
    throw new HttpError(409, "New offers can't be added while the Brand Manager is reviewing. Edit an existing offer, or add after the decision.");
  }
  if (offerState && offerDecision(campaign, offerState) === 'approved') {
    throw new HttpError(409, `${offerState} is already approved, so its offers can no longer be changed`);
  }
  if (newState && newState !== offerState && !['pending', 'rejected'].includes(offerDecision(campaign, newState))) {
    const message = `While the Brand Manager is reviewing, an offer can only move to a submitted state that is not approved yet`;
    throw new HttpError(400, message, { errors: [message], fieldErrors: { state: message } });
  }
};

export const addHistory = (campaign, user, event, { note = '', remark = '' } = {}) => {
  campaign.history.push({ at: new Date(), by: user.userId, role: user.role, event, note, remark });
};

/** A changed offer needs its state approved again (approved → removed, so it is re-sent on submit). */
export const unapproveStates = (campaign, ...states) => {
  for (const s of states) {
    if (s && campaign.approvals?.get(s)?.status === 'approved') campaign.approvals.delete(s);
  }
};

export const findOffer = (campaign, offerId) => {
  const offer = isId(offerId) ? campaign.offers.id(offerId) : null;
  if (!offer) throw new HttpError(404, 'Offer not found');
  return offer;
};

export const isUrl = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const settingValues = async (key) => (await Setting.findOne({ key }).lean())?.values || [];

/**
 * Validates an offer body against the masters and returns clean offer fields
 * { state, languages, items } with name snapshots. Throws HttpError(400) listing every problem.
 */
export const validateOffer = async (body, campaign) => {
  const errors = [];
  const fieldErrors = {}; // first message per field, e.g. { state, languages, "items.0.brand" }
  const err = (field, message) => { errors.push(message); if (!fieldErrors[field]) fieldErrors[field] = message; };
  const state = clean(body?.state);
  const languages = Array.isArray(body?.languages) ? body.languages.map((c) => clean(c).toLowerCase()).filter(Boolean) : [];
  const rawItems = Array.isArray(body?.items) ? body.items : [];

  // State must belong to the campaign's zone; languages must be set for that state and active
  const zone = await Zone.findOne({ name: campaign.zone }).lean();
  const zoneState = zone?.states.find((s) => s.name === state);
  if (!state) err("state", 'State is required');
  else if (!zoneState) err("state", `State "${state}" is not in ${campaign.zone}`);

  if (!languages.length) err("languages", 'Select at least one language');
  if (new Set(languages).size !== languages.length) err("languages", 'A language is listed twice');
  if (zoneState) {
    const active = new Set((await Language.find({ active: { $ne: false } }, 'code').lean()).map((l) => l.code));
    const bad = languages.filter((c) => !zoneState.languages.includes(c) || !active.has(c));
    if (bad.length) err("languages", `Language(s) not available for ${state}: ${bad.join(', ')}`);
  }

  if (rawItems.length < 1 || rawItems.length > MAX_ITEMS) err("items", `An offer needs 1 to ${MAX_ITEMS} brand sections`);

  const [hpSegments, offerTypes] = await Promise.all([settingValues('hpSegments'), settingValues('offerTypes')]);
  const items = [];
  const modelsUsed = new Set(); // two brand sections may share a brand, but not a model

  for (const [i, raw] of rawItems.slice(0, MAX_ITEMS).entries()) {
    const n = rawItems.length > 1 ? ` (brand section ${i + 1})` : '';
    const item = {
      hp: clean(raw?.hp),
      type: clean(raw?.type),
      details: clean(raw?.details),
    };

    const brand = isId(String(raw?.brand ?? '')) ? await CatalogBrand.findById(raw.brand).lean() : null;
    const model = brand && isId(String(raw?.model ?? '')) ? await CatalogModel.findOne({ _id: raw.model, brand: brand._id }).lean() : null;
    if (!brand) err(`items.${i}.brand`, `Brand is required${n}`);
    if (brand && !model) err(`items.${i}.model`, `Model is required and must belong to ${brand.name}${n}`);
    else if (model && modelsUsed.has(String(model._id))) err(`items.${i}.model`, `${model.name} is already in another brand section${n}`);
    else if (model) modelsUsed.add(String(model._id));
    if (brand) Object.assign(item, { brand: brand._id, brandName: brand.name });
    if (model) Object.assign(item, { model: model._id, modelName: model.name });

    if (!item.hp) err(`items.${i}.hp`, `HP is required${n}`);
    else if (hpSegments.length && !hpSegments.includes(item.hp)) err(`items.${i}.hp`, `HP "${item.hp}" is not in Settings${n}`);
    else if (model) {
      // When the model has HP segments set (Masters → Brand & Model), the HP must be one of them
      const modelHp = model.hpSegments || [];
      if (modelHp.length && !modelHp.includes(item.hp)) err(`items.${i}.hp`, `${model.name} comes in ${modelHp.join(', ')}${n}`);
    }
    if (!item.type) err(`items.${i}.type`, `Offer type is required${n}`);
    else if (offerTypes.length && !offerTypes.includes(item.type)) err(`items.${i}.type`, `Offer type "${item.type}" is not in Settings${n}`);

    // Offer price is optional, but must be 6–9 digits when entered; then its price type is required
    const price = raw?.offerPrice;
    const hasPrice = !(price === undefined || price === null || price === '');
    if (hasPrice && !validPrice(price)) err(`items.${i}.offerPrice`, `Offer price must be 6–9 digits${n}`);
    else if (hasPrice) item.offerPrice = Number(price);
    const priceType = typeof raw?.priceType === 'string' ? raw.priceType.trim() : '';
    if (priceType && !PRICE_TYPES.includes(priceType)) err(`items.${i}.priceType`, `Price type must be ${PRICE_TYPES.join(' or ')}${n}`);
    else if (hasPrice && !priceType) err(`items.${i}.priceType`, `Choose On Road or Ex-Showroom for the offer price${n}`);
    else if (priceType) item.priceType = priceType;

    const featureIds = Array.isArray(raw?.features) ? raw.features.map(String) : [];
    if (featureIds.length < 1 || featureIds.length > MAX_FEATURES) err(`items.${i}.features`, `Select 1 to ${MAX_FEATURES} features${n}`);
    else if (new Set(featureIds).size !== featureIds.length) err(`items.${i}.features`, `A feature is selected twice${n}`);
    else if (model) {
      const valid = featureIds.every(isId)
        ? await OfferFeature.countDocuments({ _id: { $in: featureIds }, model: model._id })
        : 0;
      if (valid !== featureIds.length) err(`items.${i}.features`, `Features must belong to ${model.name}${n}`);
      else item.features = featureIds;
    }

    if (!item.details) err(`items.${i}.details`, `Offer details are required${n}`);
    items.push(item);
  }

  if (errors.length) throw new HttpError(400, errors.join("; "), { errors, fieldErrors });
  return { state, languages, items };
};

/** Active users with role 'agency' among the given ids; throws if any id is not one. */
export const loadAgencyUsers = async (ids) => {
  const list = [...new Set((Array.isArray(ids) ? ids : [ids]).map(String))];
  if (!list.length || !list.every(isId)) throw new HttpError(400, 'Choose at least one agency');
  const users = await User.find({ _id: { $in: list }, role: ROLE.AGENCY_ROLE, status: { $ne: 'inactive' } }, '_id').lean();
  if (users.length !== list.length) throw new HttpError(400, 'Every chosen user must be an active agency user');
  return list;
};
