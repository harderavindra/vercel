import express from 'express';
import { authenticate } from '../controllers/userController.js';
import { loadCurrentUser } from '../utils/campaignV2Access.js';
import {
  listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, duplicateCampaign,
} from '../controllers/campaignV2Controller.js';
import {
  addOffer, updateOffer, removeOffer, setArtwork, addArtworkComment,
} from '../controllers/campaignV2OfferController.js';
import { performAction } from '../controllers/campaignV2ActionsController.js';
import { getMyNotifications, markNotificationsRead } from '../controllers/notificationV2Controller.js';

// Campaigns v2 (new module; the old /api/campaigns is untouched).
// Role/status/zone rules are checked in the controllers for every request.
const router = express.Router();

router.use(authenticate, loadCurrentUser);

// Notifications for the logged-in user (before '/:id' so "notifications" is not read as an id)
router.get('/notifications', getMyNotifications);
router.post('/notifications/read', markNotificationsRead);

// Campaigns
router.get('/', listCampaigns);
router.post('/', createCampaign);
router.get('/:id', getCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);
router.post('/:id/duplicate', duplicateCampaign);

// Offers
router.post('/:id/offers', addOffer);
router.put('/:id/offers/:offerId', updateOffer);
router.delete('/:id/offers/:offerId', removeOffer);
router.put('/:id/offers/:offerId/artwork', setArtwork);
router.post('/:id/offers/:offerId/comments', addArtworkComment);

// Workflow actions: submit, decideOffers, assign, changeStatus, submitArtwork, decideContent,
// setCreativeLinks, submitLinks, setLandingPages, handOver (see campaignV2ActionsController.js)
router.post('/:id/actions/:action', performAction);

export default router;
