// Campaigns v2: offers inside a campaign, their artwork, artwork comments and links.
import { allocateSerials } from '../utils/allocateSerials.js';
import { offerCode, statusAfter } from '../constants/campaignV2Workflow.js';
import {
  HttpError, sendError, loadCampaign, assertCanEditOffers, assertZmmOfZone, unapproveStates,
  findOffer, validateOffer, isUnderReview, addHistory,
} from '../utils/campaignV2Access.js';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');
const offerJson = (campaign, offer) => ({ ...offer.toJSON({ flattenMaps: true }), campaignStatus: campaign.status });

// POST /api/campaigns-v2/:id/offers  body: { state, languages, items }
export const addOffer = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    assertCanEditOffers(campaign, req.user, { adding: true });
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
    const offer = findOffer(campaign, req.params.offerId);
    const oldState = offer.state;
    assertCanEditOffers(campaign, req.user, { offerState: oldState });
    const fields = await validateOffer(req.body, campaign);
    assertCanEditOffers(campaign, req.user, { offerState: oldState, newState: fields.state });

    offer.set(fields);
    if (isUnderReview(campaign)) {
      // The state stays with the Brand Manager; the edit is in the history for them to see
      addHistory(campaign, req.user, 'Offer edited during review', { note: `${offer.code} · ${fields.state}` });
    } else {
      unapproveStates(campaign, oldState, fields.state); // a changed offer needs its state approved again
    }
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
    const offer = findOffer(campaign, req.params.offerId);
    const { state, code } = offer;
    assertCanEditOffers(campaign, req.user, { offerState: state });
    const reviewing = isUnderReview(campaign);
    if (reviewing && campaign.offers.length === 1) {
      throw new HttpError(409, 'A submitted campaign needs at least one offer. Edit this offer instead.');
    }
    offer.deleteOne();
    if (!reviewing) unapproveStates(campaign, state);
    // a state with no offers left has nothing to approve
    if (!campaign.offers.some((o) => o.state === state)) campaign.approvals.delete(state);
    if (reviewing) {
      addHistory(campaign, req.user, 'Offer removed during review', { note: `${code} · ${state}` });
      // Removing the last waiting state's offers can finish the review (every remaining state decided)
      campaign.status = statusAfter('offers', campaign, campaign.approvals);
    }
    await campaign.save();
    res.status(200).json({ message: 'Offer removed', _id: req.params.offerId, campaignStatus: campaign.status });
  } catch (error) {
    sendError(res, error, 'Failed to remove offer');
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

