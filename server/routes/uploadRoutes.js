import { Router } from 'express';
import * as controller from '../controllers/uploadController.js';
import { requireAdmin } from '../middleware/auth.js';
import { singleImage } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/image', requireAdmin, uploadLimiter, singleImage('image'), controller.uploadSingleImage);
router.delete('/image', requireAdmin, controller.deleteUploadedImage);

export default router;
