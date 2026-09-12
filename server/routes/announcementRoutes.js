import { Router } from 'express';
import * as controller from '../controllers/announcementController.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, attachAdmin } from '../middleware/auth.js';
import {
  idParam,
  createAnnouncementBody,
  updateAnnouncementBody,
  stripSettingsBody,
} from '../validators/schemas.js';

const router = Router();

// Public read returns only active messages; an authenticated admin also sees
// disabled ones so the panel can list everything.
router.get('/', attachAdmin, controller.getAnnouncements);

// `/settings` is declared before `/:id` so the literal segment is not
// swallowed by the id parameter.
router.get('/settings', attachAdmin, controller.getStripSettings);
router.put(
  '/settings',
  requireAdmin,
  validate({ body: stripSettingsBody }),
  controller.updateStripSettings,
);

router.get('/:id', validate({ params: idParam }), controller.getAnnouncementById);

router.post(
  '/',
  requireAdmin,
  validate({ body: createAnnouncementBody }),
  controller.createAnnouncement,
);
router.put(
  '/:id',
  requireAdmin,
  validate({ params: idParam, body: updateAnnouncementBody }),
  controller.updateAnnouncement,
);
router.delete('/:id', requireAdmin, validate({ params: idParam }), controller.deleteAnnouncement);

export default router;
