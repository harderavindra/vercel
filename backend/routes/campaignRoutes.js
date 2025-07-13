import express from 'express';
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaignStatus,
  assignCampaign,
  deleteCampaign
} from '../controllers/campaignController.js';

import { authenticate } from '../controllers/userController.js';

const router = express.Router();

// All routes are protected by auth middleware
router.post('/', authenticate, createCampaign);
router.get('/', authenticate, getAllCampaigns);
router.get('/:id', authenticate, getCampaignById);
router.put('/:id/status', authenticate, updateCampaignStatus);
router.put('/:campaignId/assign', authenticate, assignCampaign);
router.delete('/:id', authenticate, deleteCampaign);
router.post("/:id/update-status", authenticate, updateCampaignStatus);


export default router;
