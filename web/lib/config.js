/**
 * Single source of truth for store identity and contact details.
 *
 * Nothing here is hardcoded in a component. Every value comes from the
 * environment so the same build can be pointed at a different shop, and so a
 * phone number is never accidentally committed into JSX.
 */

function required(value, name, fallback) {
  if (value && value.trim()) return value.trim();
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[config] ${name} is not set - falling back to a placeholder.`);
  }
  return fallback;
}

/** Digits only, in international format, as the WhatsApp click-to-chat API expects. */
function normaliseWhatsApp(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits;
}

const siteUrl = required(
  process.env.NEXT_PUBLIC_SITE_URL,
  'NEXT_PUBLIC_SITE_URL',
  'http://localhost:3000',
).replace(/\/$/, '');

export const store = {
  name: required(process.env.NEXT_PUBLIC_STORE_NAME, 'NEXT_PUBLIC_STORE_NAME', 'Crackers Store'),
  tagline: process.env.NEXT_PUBLIC_STORE_TAGLINE?.trim() || 'Quality crackers at fair prices',
  phone: required(process.env.NEXT_PUBLIC_STORE_PHONE, 'NEXT_PUBLIC_STORE_PHONE', ''),
  whatsapp: normaliseWhatsApp(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  email: process.env.NEXT_PUBLIC_STORE_EMAIL?.trim() || '',
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS?.trim() || '',
  // Free-text, e.g. "Mon-Sat 9:00 - 20:00". Rendered verbatim.
  hours: process.env.NEXT_PUBLIC_STORE_HOURS?.trim() || '',
  mapsUrl: process.env.NEXT_PUBLIC_STORE_MAPS_URL?.trim() || '',
  siteUrl,
};

/**
 * Structured data must describe reality. These flags let the SEO helpers omit
 * LocalBusiness fields the owner has not actually provided, rather than
 * emitting invented addresses or opening hours.
 */
export const has = {
  phone: Boolean(store.phone),
  whatsapp: Boolean(store.whatsapp),
  email: Boolean(store.email),
  address: Boolean(store.address),
  hours: Boolean(store.hours),
  maps: Boolean(store.mapsUrl),
};

/**
 * Decorative artwork, served from /public.
 *
 * The two backdrops default to the vector artwork shipped in web/public, which
 * is a few kilobytes each and scales to any width without a second request per
 * breakpoint. Point a variable at your own file to replace one, or set it to
 * "off" to fall back to the plain CSS gradient.
 *
 * The photographic slots stay empty by default: every layout that uses one is
 * built to look finished without it, so a missing file is never a broken image.
 */
function artwork(value, fallback = '') {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.toLowerCase() === 'off' ? '' : trimmed;
}

export const media = {
  // Brand mark. Empty falls back to the generic sparkle icon, so the header
  // never renders a broken image if the file is missing.
  logo: artwork(process.env.NEXT_PUBLIC_LOGO, '/logo.webp'),
  heroBackground: artwork(process.env.NEXT_PUBLIC_HERO_BACKGROUND, '/hero-banner.webp'),
  heroArtwork: artwork(process.env.NEXT_PUBLIC_HERO_ARTWORK),
  catalogueCover: artwork(process.env.NEXT_PUBLIC_CATALOGUE_COVER),
  catalogueBackground: artwork(
    process.env.NEXT_PUBLIC_CATALOGUE_BACKGROUND,
    '/catalogue-banner.webp',
  ),
  // Portrait crop of the same scene. Art direction rather than a resize: the
  // wide version's subject sits far right and would be cropped out on a phone.
  catalogueBackgroundMobile: artwork(
    process.env.NEXT_PUBLIC_CATALOGUE_BACKGROUND_MOBILE,
    '/catalogue-banner-mobile.webp',
  ),
  footerBackground: artwork(process.env.NEXT_PUBLIC_FOOTER_BACKGROUND, '/footer-banner.webp'),
  footerBackgroundMobile: artwork(
    process.env.NEXT_PUBLIC_FOOTER_BACKGROUND_MOBILE,
    '/footer-banner-mobile.webp',
  ),
  browseBackground: artwork(process.env.NEXT_PUBLIC_BROWSE_BACKGROUND, '/browse-banner.webp'),
  momentsBackground: artwork(process.env.NEXT_PUBLIC_MOMENTS_BACKGROUND, '/moments-banner.webp'),
  momentsBackgroundMobile: artwork(
    process.env.NEXT_PUBLIC_MOMENTS_BACKGROUND_MOBILE,
    '/moments-banner-mobile.webp',
  ),
};

/** Social profiles. Each link is rendered only when its URL is set. */
export const social = {
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK?.trim() || '',
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() || '',
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim() || '',
};

/** Public API base, used by client components. */
export const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');

export const currency = {
  code: 'INR',
  symbol: '₹',
};

export default store;
