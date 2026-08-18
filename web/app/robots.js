import { store } from '@/lib/config';

/**
 * robots.txt.
 *
 * Public catalogue pages are open to crawlers. The admin panel, the cart and
 * the Next API routes are disallowed - none of them are content, and the cart
 * in particular would produce thin, per-visitor pages in the index.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/cart', '/api/'],
      },
    ],
    sitemap: `${store.siteUrl}/sitemap.xml`,
    host: store.siteUrl,
  };
}
