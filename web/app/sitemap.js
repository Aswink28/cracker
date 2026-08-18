import { getProductSlugs, getCategories } from '@/lib/api';
import { store } from '@/lib/config';

/**
 * Dynamic XML sitemap, generated from live catalogue data.
 *
 * Regenerated on the same schedule as the catalogue cache, so newly added
 * products appear without a redeploy and deleted ones drop out. /cart, /admin
 * and the API are deliberately absent - they are either private or not
 * content.
 */
export const revalidate = 3600;

export default async function sitemap() {
  const base = store.siteUrl;
  const now = new Date();

  const staticRoutes = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${base}/products`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.5, lastModified: now },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  ];

  // A failure here must not take the whole sitemap down - returning the static
  // routes alone is far better than returning a 500 to a crawler.
  const [categories, productSlugs] = await Promise.all([
    getCategories().catch((error) => {
      console.error('Sitemap: categories unavailable -', error.message);
      return [];
    }),
    getProductSlugs().catch((error) => {
      console.error('Sitemap: product slugs unavailable -', error.message);
      return [];
    }),
  ]);

  const categoryRoutes = categories.map((category) => ({
    url: `${base}/categories/${category.slug}`,
    lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes = productSlugs.map((product) => ({
    url: `${base}/products/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
