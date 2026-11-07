// Campaigns v2: offers inside a campaign, their artwork, artwork comments and links.
import { allocateSerials } from '../utils/allocateSerials.js';
import { offerCode, ARTWORK_TYPES, MAX_ARTWORK_MB } from '../constants/campaignV2Workflow.js';
import {
  HttpError, sendError, loadCampaign, assertCanEditOffers, assertZmmOfZone, unapproveStates,
  findOffer, validateOffer, isUrl, sameId, MM_ADMIN,
} from '../utils/campaignV2Access.js';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');
const offerJson = (campaign, offer) => ({ ...offer.toJSON({ flattenMaps: true }), campaignStatus: campaign.status });

// POST /api/campaigns-v2/:id/offers  body: { state, languages, items }
export const addOffer = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    assertCanEditOffers(campaign, req.user);
    const fields = await validateOffer(req.body, campaign);

    const serial = await allocateSerials(1);
    campaign.offers.push({ ...fields, serial, code: offerCode(campaign.zone, campaign.month, serial) });
    unapproveStates(campaign, fields.state);
    await campaign.save();
    res.status(201).json(offerJson(campaign, campaign.offers[campaign.offers.length - 1]));
  } catch (error) {
    sendError(res, error, 'Failed to add offer');
  }
};

// PUT /api/campaigns-v2/:id/offers/:offerId  body: { state, languages, items }  (serial and code stay)
export const updateOffer = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    assertCanEditOffers(campaign, req.user);
    const offer = findOffer(campaign, req.params.offerId);
    const fields = await validateOffer(req.body, campaign);

    const oldState = offer.state;
    offer.set(fields);
    unapproveStates(campaign, oldState, fields.state); // a changed offer needs its state approved again
    await campaign.save();
    res.status(200).json(offerJson(campaign, offer));
  } catch (error) {
    sendError(res, error, 'Failed to update offer');
  }
};

// DELETE /api/campaigns-v2/:id/offers/:offerId
export const removeOffer = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    assertCanEditOffers(campaign, req.user);
    const offer = findOffer(campaign, req.params.offerId);
    const { state } = offer;
    offer.deleteOne();
    unapproveStates(campaign, state);
    // a state with no offers left has nothing to approve
    if (!campaign.offers.some((o) => o.state === state)) campaign.approvals.delete(state);
    await campaign.save();
    res.status(200).json({ message: 'Offer removed', _id: req.params.offerId });
  } catch (error) {
    sendError(res, error, 'Failed to remove offer');
  }
};

// PUT /api/campaigns-v2/:id/offers/:offerId/artwork  body: { url, fileName, type, size }  or { artwork: null } to clear.
// The file itself is uploaded by the client through /api/files/signed-url/upload first.
// Allowed for the assigned agency while preparing artwork, until that state's artwork is approved.
export const setArtwork = async (req, res) => {
  try {
    const { user } = req;
    const campaign = await loadCampaign(req.params.id, user);
    if (!sameId(campaign.agency, user.userId)) throw new HttpError(403, 'Only the assigned agency can upload artwork');
    if (!['in_progress', 'content_rejected'].includes(campaign.status)) {
      throw new HttpError(409, 'Artwork can be uploaded after the agency changes the status, or after a rejection');
    }
    const offer = findOffer(campaign, req.params.offerId);
    if (campaign.contentApprovals.get(offer.state)?.status === 'approved') {
      throw new HttpError(409, `The artwork for ${offer.state} is already approved and locked`);
    }

    if (req.body?.artwork === null) {
      offer.artwork = null;
    } else {
      const url = clean(req.body?.url);
      const type = clean(req.body?.type);
      const size = Number(req.body?.size);
      if (!isUrl(url)) throw new HttpError(400, 'A valid artwork URL is required');
      if (!ARTWORK_TYPES.includes(type)) throw new HttpError(400, 'Artwork must be a PNG or JPG image');
      if (!Number.isFinite(size) || size <= 0 || size > MAX_ARTWORK_MB * 1024 * 1024) {
        throw new HttpError(400, `Artwork must be at most ${MAX_ARTWORK_MB} MB`);
      }
      offer.artwork = { url, fileName: clean(req.body?.fileName), type, size, uploadedAt: new Date(), uploadedBy: user.userId };
    }
    await campaign.save();
    res.status(200).json(offerJson(campaign, offer));
  } catch (error) {
    sendError(res, error, 'Failed to save artwork');
  }
};

// POST /api/campaigns-v2/:id/offers/:offerId/comments  body: { text }
// The zone's ZMM comments on artwork while that state's artwork awaits their approval.
export const addArtworkComment = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    assertZmmOfZone(campaign, req.user);
    const offer = findOffer(campaign, req.params.offerId);
    if (campaign.status !== 'content_uploaded' || campaign.contentApprovals.get(offer.state)?.status !== 'pending') {
      throw new HttpError(409, `Comments can be added while the artwork for ${offer.state} awaits approval`);
    }
    const text = clean(req.body?.text);
    if (!text) throw new HttpError(400, 'Comment text is required');
    offer.artworkComments.push({ text, by: req.user.userId, at: new Date(), fileName: offer.artwork?.fileName || '' });
    await campaign.save();
    res.status(201).json(offerJson(campaign, offer));
  } catch (error) {
    sendError(res, error, 'Failed to add comment');
  }
};

// PUT /api/campaigns-v2/:id/offers/:offerId/links  body: { creativeLink } or { landingPage }
// creativeLink: the assigned agency, after every state's artwork is approved.
// landingPage: Marketing Manager / Admin, after the creative links are shared.
export const setOfferLinks = async (req, res) => {
  try {
    const { user } = req;
    const campaign = await loadCampaign(req.params.id, user);
    const offer = findOffer(campaign, req.params.offerId);
    const { creativeLink, landingPage } = req.body || {};
    if (creativeLink === undefined && landingPage === undefined) throw new HttpError(400, 'Send creativeLink or landingPage');

    if (creativeLink !== undefined) {
      if (!sameId(campaign.agency, user.userId)) throw new HttpError(403, 'Only the assigned agency can set the creative link');
      if (campaign.status !== 'artwork_approved') throw new HttpError(409, 'Creative links are shared after every state\'s artwork is approved');
      const v = clean(creativeLink);
      if (v && !isUrl(v)) throw new HttpError(400, 'Creative link must be an http(s) URL');
      offer.creativeLink = v;
    }
    if (landingPage !== undefined) {
      if (!MM_ADMIN.includes(user.role)) throw new HttpError(403, 'Only the Marketing Manager or Admin can set the landing page');
      if (campaign.status !== 'links_submitted') throw new HttpError(409, 'Landing pages are added after the creative links are shared');
      const v = clean(landingPage);
      if (v && !isUrl(v)) throw new HttpError(400, 'Landing page must be an http(s) URL');
      offer.landingPage = v;
    }
    await campaign.save();
    res.status(200).json(offerJson(campaign, offer));
  } catch (error) {
    sendError(res, error, 'Failed to save link');
  }
};

