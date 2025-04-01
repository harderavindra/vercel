import express from 'express';
import {  generateUploadSignedUrl } from '../controllers/signedUrlController.js';

const router = express.Router();

router.post('/signed-url/upload', generateUploadSignedUrl);
// router.get('/signed-url/download', generateDownloadSignedUrl);

export default router;
