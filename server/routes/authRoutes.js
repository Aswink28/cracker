import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiters.js';
import { loginBody } from '../validators/schemas.js';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginBody }), controller.login);
router.get('/me', requireAdmin, controller.me);

export default router;
