import { Router } from 'express';
import * as controller from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, attachAdmin } from '../middleware/auth.js';
import {
  productListQuery,
  slugParam,
  idParam,
  createProductBody,
  updateProductBody,
} from '../validators/schemas.js';

const router = Router();

// Public reads.
// `/slugs` and `/slug/:slug` are declared before `/:id` so those literal
// segments are not swallowed by the id parameter.
router.get('/', attachAdmin, validate({ query: productListQuery }), controller.getProducts);
router.get('/slugs', controller.getProductSlugs);
// Also ahead of `/:id`, for the same reason.
router.get('/export/pdf', requireAdmin, controller.exportProductsPdf);
router.get('/slug/:slug', validate({ params: slugParam }), controller.getProductBySlug);
router.get('/:id', validate({ params: idParam }), controller.getProductById);

// Admin writes.
router.post('/', requireAdmin, validate({ body: createProductBody }), controller.createProduct);
router.put(
  '/:id',
  requireAdmin,
  validate({ params: idParam, body: updateProductBody }),
  controller.updateProduct,
);
router.delete('/:id', requireAdmin, validate({ params: idParam }), controller.deleteProduct);

export default router;
