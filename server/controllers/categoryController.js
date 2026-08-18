import * as categoryService from '../services/categoryService.js';
import { destroyImage } from '../services/cloudinaryService.js';
import { revalidateStorefront } from '../services/revalidateService.js';

function publicCache(res, seconds = 600) {
  res.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`,
  );
}

/** GET /api/categories */
export async function getCategories(req, res) {
  const isAdmin = Boolean(req.admin);
  const categories = await categoryService.listCategories({
    includeInactive: isAdmin,
  });

  if (!isAdmin) publicCache(res);

  res.json({ success: true, categories });
}

/** GET /api/categories/slug/:slug */
export async function getCategoryBySlug(req, res) {
  const category = await categoryService.getCategoryBySlug(req.params.slug, {
    includeInactive: Boolean(req.admin),
  });
  if (!req.admin) publicCache(res);
  res.json({ success: true, category });
}

/** GET /api/categories/:id */
export async function getCategoryById(req, res) {
  const category = await categoryService.getCategoryById(req.params.id);
  res.json({ success: true, category });
}

/** POST /api/categories */
export async function createCategory(req, res) {
  const category = await categoryService.createCategory(req.body);
  await revalidateStorefront(['categories', 'products']);
  res.status(201).json({ success: true, category });
}

/** PUT /api/categories/:id */
export async function updateCategory(req, res) {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  await revalidateStorefront(['categories', 'products', `category:${category.slug}`]);
  res.json({ success: true, category });
}

/** DELETE /api/categories/:id */
export async function deleteCategory(req, res) {
  const { imagePublicId } = await categoryService.deleteCategory(req.params.id);
  await destroyImage(imagePublicId);
  await revalidateStorefront(['categories', 'products']);
  res.json({ success: true, message: 'Category deleted' });
}
