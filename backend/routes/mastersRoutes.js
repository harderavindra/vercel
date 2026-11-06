import express from 'express';
import { authenticate } from '../controllers/userController.js';
import { requireRole, ADMIN_ROLES } from '../middleware/requireRole.js';
import { getSettings, updateSetting } from '../controllers/settingsController.js';
import { getLanguages, addLanguage, updateLanguage, loadDefaultLanguages } from '../controllers/languageController.js';
import {
  getZones, createZone, updateZone, deleteZone,
  addState, updateState, deleteState, loadDefaultZones,
} from '../controllers/zoneController.js';
import {
  getCatalog, createBrand, renameBrand, deleteBrand,
  createModel, renameModel, deleteModel,
} from '../controllers/catalogController.js';

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
router.put('/languages/:id', requireRole(...ADMIN_ROLES), updateLanguage);

// Zones & States
router.get('/zones', getZones);
router.post('/zones', requireRole(...ADMIN_ROLES), createZone);
router.post('/zones/defaults', requireRole(...ADMIN_ROLES), loadDefaultZones);
router.put('/zones/:id', requireRole(...ADMIN_ROLES), updateZone);
router.delete('/zones/:id', requireRole(...ADMIN_ROLES), deleteZone);
router.post('/zones/:id/states', requireRole(...ADMIN_ROLES), addState);
router.put('/zones/:id/states/:stateName', requireRole(...ADMIN_ROLES), updateState);
router.delete('/zones/:id/states/:stateName', requireRole(...ADMIN_ROLES), deleteState);

// Brand & Model (existing ProductCategory / BrandCategory / ModelCategory collections)
router.get('/catalog', getCatalog);
router.post('/brands', requireRole(...ADMIN_ROLES), createBrand);
router.put('/brands/:id', requireRole(...ADMIN_ROLES), renameBrand);
router.delete('/brands/:id', requireRole(...ADMIN_ROLES), deleteBrand);
router.post('/models', requireRole(...ADMIN_ROLES), createModel);
router.put('/models/:id', requireRole(...ADMIN_ROLES), renameModel);
router.delete('/models/:id', requireRole(...ADMIN_ROLES), deleteModel);

export default router;
