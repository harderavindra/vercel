import express from 'express';
import { generateSignedUrl } from '../controllers/signedUrlController.js';

const router = express.Router();

router.post('/signed-url', generateSignedUrl);

export default router;
