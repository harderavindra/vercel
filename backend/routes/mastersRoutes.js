import express from 'express';
import { authenticate } from '../controllers/userController.js';
import { requireRole, ADMIN_ROLES } from '../middleware/requireRole.js';
import { getSettings, updateSetting } from '../controllers/settingsController.js';

const router = express.Router();

// All /api/masters routes require a logged-in user
router.use(authenticate);

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Settings lists (hpSegments, offerTypes, agencyStatuses)
router.get('/settings', getSettings);
router.put('/settings/:key', requireRole(...ADMIN_ROLES), updateSetting);

export default router;
