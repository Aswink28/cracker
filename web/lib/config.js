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

/** Public API base, used by client components. */
export const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');

export const currency = {
  code: 'INR',
  symbol: '₹',
};

export default store;
