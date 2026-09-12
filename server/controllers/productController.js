import * as productService from '../services/productService.js';
import { destroyImage } from '../services/cloudinaryService.js';
import { revalidateStorefront } from '../services/revalidateService.js';
import { streamCatalogueePdf } from '../services/catalogueePdfService.js';

/** Cache headers for public catalogue reads, served through any CDN in front. */
function publicCache(res, seconds = 300) {
  res.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`,
  );
}

/** GET /api/products */
export async function getProducts(req, res) {
  const query = req.validatedQuery ?? {};
  const isAdmin = Boolean(req.admin);

  const result = await productService.listProducts(
    {
      page: query.page,
      limit: query.limit,
      search: query.search,
      categorySlug: query.category,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.sort,
      featured: query.featured,
      onOffer: query.onOffer,
      inStock: query.inStock,
      active: query.active,
    },
    // Only an authenticated admin may see disabled products.
    { includeInactive: isAdmin && query.includeInactive === true },
  );

  if (!isAdmin) publicCache(res);

  res.json({ success: true, ...result });
}

/** GET /api/products/slug/:slug */
export async function getProductBySlug(req, res) {
  const product = await productService.getProductBySlug(req.params.slug, {
    includeInactive: Boolean(req.admin),
  });
  const related = await productService.getRelatedProducts(product);

  if (!req.admin) publicCache(res);

  res.json({ success: true, product, related });
}

/** GET /api/products/:id */
export async function getProductById(req, res) {
  const product = await productService.getProductById(req.params.id, {
    includeInactive: Boolean(req.admin),
  });
  res.json({ success: true, product });
}

/** GET /api/products/slugs - drives sitemap generation. */
export async function getProductSlugs(_req, res) {
  const slugs = await productService.listProductSlugs();
  publicCache(res, 900);
  res.json({ success: true, slugs });
}

/**
 * GET /api/products/export/pdf - admin only.
 *
 * Streamed rather than buffered: the document is written straight to the
 * socket as it is laid out, so memory does not grow with the catalogue.
 */
export async function exportProductsPdf(req, res) {
  const includeInactive = req.query.includeInactive === 'true';
  const date = new Date().toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="price-list-${date}.pdf"`);
  // A price list is stale the moment an admin edits anything.
  res.setHeader('Cache-Control', 'no-store');

  await streamCatalogueePdf(res, { includeInactive });
}

/** POST /api/products */
export async function createProduct(req, res) {
  const product = await productService.createProduct(req.body);
  await revalidateStorefront(['products', 'categories', `product:${product.slug}`]);
  res.status(201).json({ success: true, product });
}

/** PUT /api/products/:id */
export async function updateProduct(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  await revalidateStorefront(['products', 'categories', `product:${product.slug}`]);
  res.json({ success: true, product });
}

/** DELETE /api/products/:id */
export async function deleteProduct(req, res) {
  const { imagePublicId } = await productService.deleteProduct(req.params.id);

  // Cleanup is best-effort and intentionally not awaited into the response
  // contract - the product is already gone as far as the client is concerned.
  await destroyImage(imagePublicId);
  await revalidateStorefront(['products', 'categories']);

  res.json({ success: true, message: 'Product deleted' });
}
