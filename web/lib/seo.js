import { store, has, currency } from './config.js';
import { effectivePrice } from './format.js';

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = '/') {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${store.siteUrl}${suffix}`;
}

/** Trim to a length search engines will actually display, without cutting mid-word. */
export function truncate(text, max = 158) {
  const clean = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : max).trimEnd()}...`;
}

/**
 * Build a page's Metadata object.
 *
 * Every public page routes through this so no page can ship without a
 * canonical URL, and so the title/description/OG/Twitter set always agree
 * with each other.
 */
export function buildMetadata({
  title,
  description,
  path = '/',
  image,
  noIndex = false,
  type = 'website',
}) {
  const url = absoluteUrl(path);
  const desc = truncate(description);

  const images = image
    ? [{ url: image.url, width: image.width ?? 1200, height: image.height ?? 630, alt: image.alt || title }]
    : undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: store.name,
      locale: 'en_IN',
      type,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description: desc,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

/**
 * LocalBusiness structured data.
 *
 * Only fields the owner has actually configured are emitted. An invented
 * address or opening hours would be both a rich-result violation and a lie to
 * customers, so absent values are omitted rather than filled with placeholders.
 */
export function localBusinessJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${store.siteUrl}/#store`,
    name: store.name,
    url: store.siteUrl,
  };

  if (store.tagline) data.description = store.tagline;
  if (has.phone) data.telephone = store.phone;
  if (has.email) data.email = store.email;
  if (has.maps) data.hasMap = store.mapsUrl;

  if (has.address) {
    data.address = {
      '@type': 'PostalAddress',
      // The address is a single configured free-text string. Emitting it as
      // streetAddress is honest; splitting it into locality/region/postcode
      // would mean guessing at parts we were never given.
      streetAddress: store.address,
      addressCountry: 'IN',
    };
  }

  if (has.hours) data.openingHours = store.hours;

  return data;
}

/** Website-level structured data, including the search action. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${store.siteUrl}/#website`,
    name: store.name,
    url: store.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${store.siteUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Product structured data.
 *
 * Deliberately omits aggregateRating and review: the shop has no review data,
 * and fabricating it is both dishonest and a manual-action risk. Availability
 * reflects the real inStock flag.
 */
export function productJsonLd(product) {
  const price = effectivePrice(product);
  const url = absoluteUrl(`/products/${product.slug}`);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: truncate(product.description || product.shortDescription, 300),
    url,
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency.code,
      price: String(price),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      // Orders are placed over WhatsApp and fulfilled by the shop directly.
      seller: { '@id': `${store.siteUrl}/#store` },
    },
  };

  if (product.image?.url) {
    data.image = [product.image.url];
  }

  if (product.sku) data.sku = product.sku;

  return data;
}

/** BreadcrumbList from an ordered [{ name, path }] trail. */
export function breadcrumbJsonLd(trail = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** ItemList for a category or listing page, helping Google understand the grid. */
export function itemListJsonLd(products = [], listName) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/products/${product.slug}`),
      name: product.name,
    })),
  };
}
