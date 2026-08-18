import { Router } from 'express';
import { z } from 'zod';
import * as controller from '../controllers/orderEnquiryController.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { enquiryLimiter } from '../middleware/rateLimiters.js';
import { orderEnquiryBody, idParam } from '../validators/schemas.js';

const router = Router();

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['new', 'contacted', 'confirmed', 'cancelled']).optional(),
});

const statusBody = z
  .object({ status: z.enum(['new', 'contacted', 'confirmed', 'cancelled']) })
  .strict();

// Public - the storefront logs an enquiry alongside opening WhatsApp.
router.post('/', enquiryLimiter, validate({ body: orderEnquiryBody }), controller.createEnquiry);

// Admin.
router.get('/', requireAdmin, validate({ query: listQuery }), controller.listEnquiries);
router.patch(
  '/:id/status',
  requireAdmin,
  validate({ params: idParam, body: statusBody }),
  controller.updateEnquiryStatus,
);

export default router;
