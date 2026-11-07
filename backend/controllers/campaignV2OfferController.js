// Campaigns v2: offers inside a campaign, their artwork, artwork comments and links.
import { allocateSerials } from '../utils/allocateSerials.js';
import { offerCode } from '../constants/campaignV2Workflow.js';
import {
  HttpError, sendError, loadCampaign, assertCanEditOffers, assertZmmOfZone, unapproveStates,
  findOffer, validateOffer,
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

