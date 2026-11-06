import express from 'express';
import { authenticate } from '../controllers/userController.js';
import { requireRole, ADMIN_ROLES } from '../middleware/requireRole.js';
import { getSettings, updateSetting } from '../controllers/settingsController.js';
import { getLanguages, addLanguage, deleteLanguage, loadDefaultLanguages } from '../controllers/languageController.js';

const router = express.Router();

// All /api/masters routes require a logged-in user
router.use(authenticate);

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Settings lists (hpSegments, offerTypes, agencyStatuses)
router.get('/settings', getSettings);
router.put('/settings/:key', requireRole(...ADMIN_ROLES), updateSetting);

// Languages
router.get('/languages', getLanguages);
router.post('/languages', requireRole(...ADMIN_ROLES), addLanguage);
router.post('/languages/defaults', requireRole(...ADMIN_ROLES), loadDefaultLanguages);
router.delete('/languages/:id', requireRole(...ADMIN_ROLES), deleteLanguage);

export default router;
