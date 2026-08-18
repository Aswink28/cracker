import { Router } from 'express';
import * as controller from '../controllers/categoryController.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, attachAdmin } from '../middleware/auth.js';
import {
  slugParam,
  idParam,
  createCategoryBody,
  updateCategoryBody,
} from '../validators/schemas.js';

const router = Router();

router.get('/', attachAdmin, controller.getCategories);
router.get('/slug/:slug', validate({ params: slugParam }), controller.getCategoryBySlug);
router.get('/:id', validate({ params: idParam }), controller.getCategoryById);

router.post('/', requireAdmin, validate({ body: createCategoryBody }), controller.createCategory);
router.put(
  '/:id',
  requireAdmin,
  validate({ params: idParam, body: updateCategoryBody }),
  controller.updateCategory,
);
router.delete('/:id', requireAdmin, validate({ params: idParam }), controller.deleteCategory);

export default router;
