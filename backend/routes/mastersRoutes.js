import express from 'express';
import { authenticate } from '../controllers/userController.js';

const router = express.Router();

// All /api/masters routes require a logged-in user
router.use(authenticate);

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

export default router;
