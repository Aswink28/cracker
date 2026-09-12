import 'server-only';

/**
 * Server-side data access for the storefront.
 *
 * Every read is tagged so the Express API can invalidate it precisely after an
 * admin edit (see /api/revalidate). Responses are cached indefinitely by tag
 * with a long time-based backstop, which is what keeps catalogue pages fast
 * without ever serving genuinely stale prices.
 */

const API_URL = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api'
).replace(/\/$/, '');

// Backstop revalidation. Tag invalidation is the primary mechanism; this only
// matters if a revalidate ping is ever lost.
const DEFAULT_REVALIDATE = 3600;

class ApiRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function request(path, { tags = [], revalidate = DEFAULT_REVALIDATE, signal } = {}) {
  const url = `${API_URL}${path}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { tags, revalidate },
    signal,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // Non-JSON error body; the status-based message is good enough.
    }
    throw new ApiRequestError(response.status, message);
  }

  return response.json();
}

/**
 * Turn a params object into a stable query string.
 * Keys are sorted so two equivalent requests produce the same cache entry
 * rather than two, and empty values are dropped entirely.
 */
function toQuery(params = {}) {
  const search = new URLSearchParams();

  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getProducts(params = {}) {
  return request(`/products${toQuery(params)}`, { tags: ['products'] });
}

export async function getCategories() {
  const data = await request('/categories', { tags: ['categories'] });
  return data.categories ?? [];
}

/**
 * A product plus its related items.
 * Returns null on 404 so pages can call notFound() rather than crashing -
 * a deleted product must render a proper 404, not a 500.
 */
export async function getProductBySlug(slug) {
  try {
    const data = await request(`/products/slug/${encodeURIComponent(slug)}`, {
      tags: ['products', `product:${slug}`],
    });
    return { product: data.product, related: data.related ?? [] };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

export async function getCategoryBySlug(slug) {
  try {
    const data = await request(`/categories/slug/${encodeURIComponent(slug)}`, {
      tags: ['categories', `category:${slug}`],
    });
    return data.category;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Admin-authored messages for the homepage offers strip.
 * Tagged separately so publishing a promotion does not invalidate the whole
 * product cache.
 */
export async function getAnnouncements() {
  const data = await request('/announcements', { tags: ['announcements'] });
  return data.announcements ?? [];
}

/**
 * Whether the strip is shown at all, and whether it lists product discounts.
 * Shares the announcements tag, so any strip change invalidates it in one ping.
 */
export async function getStripSettings() {
  const data = await request('/announcements/settings', { tags: ['announcements'] });
  return data.settings ?? { enabled: true, showProductOffers: true };
}

export async function getProductSlugs() {
  const data = await request('/products/slugs', { tags: ['products'] });
  return data.slugs ?? [];
}

/**
 * Data for the homepage, fetched concurrently.
 *
 * Failures degrade to empty lists instead of taking the whole page down: a
 * homepage that renders its hero, contact details and WhatsApp button with an
 * empty product rail is far better than an error page, because the customer
 * can still reach the shop.
 */
export async function getHomepageData() {
  const [featured, categories, announcements, stripSettings] = await Promise.allSettled([
    // Stays at 8 even though the grid now shows a single row: this same list
    // feeds the offers strip, which would lose entries if it were trimmed.
    getProducts({ featured: 'true', limit: 8, sort: 'popular' }),
    getCategories(),
    getAnnouncements(),
    getStripSettings(),
  ]);

  if (featured.status === 'rejected') {
    console.error('Homepage: featured products unavailable -', featured.reason?.message);
  }
  if (categories.status === 'rejected') {
    console.error('Homepage: categories unavailable -', categories.reason?.message);
  }
  // A missing promo strip is cosmetic, so it is logged but never marks the page
  // degraded - the catalogue itself is what matters.
  if (announcements.status === 'rejected') {
    console.error('Homepage: announcements unavailable -', announcements.reason?.message);
  }

  return {
    featured: featured.status === 'fulfilled' ? (featured.value.products ?? []) : [],
    categories: categories.status === 'fulfilled' ? categories.value : [],
    announcements: announcements.status === 'fulfilled' ? announcements.value : [],
    // If the settings read fails the strip keeps its previous behaviour rather
    // than vanishing, which would look like a broken deploy.
    stripSettings:
      stripSettings.status === 'fulfilled'
        ? stripSettings.value
        : { enabled: true, showProductOffers: true },
    degraded: featured.status === 'rejected' || categories.status === 'rejected',
  };
}

export { ApiRequestError, API_URL };
