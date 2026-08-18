// Explicit .js extensions on intra-lib imports so these pure modules can be
// exercised with plain `node` as well as through the bundler.
import { currency } from './config.js';

/**
 * A single Intl instance rather than one per call. Constructing
 * Intl.NumberFormat is comparatively expensive, and a product grid formats
 * dozens of prices per render.
 */
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: currency.code,
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Format a rupee amount, e.g. 1250 -> "₹1,250". */
export function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  return inrFormatter.format(amount);
}

/** Plain grouped number without a currency symbol, e.g. 1250 -> "1,250". */
export function formatNumber(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  return new Intl.NumberFormat('en-IN').format(amount);
}

/** The price a customer actually pays for a product. */
export function effectivePrice(product) {
  if (!product) return 0;
  const { price, offerPrice } = product;
  return offerPrice != null && offerPrice < price ? offerPrice : price;
}

/** Whole-number discount percentage, or 0 when there is no offer. */
export function discountPercent(product) {
  if (!product) return 0;
  if (typeof product.discountPercentage === 'number' && product.discountPercentage > 0) {
    return product.discountPercentage;
  }
  const { price, offerPrice } = product;
  if (offerPrice == null || !price || offerPrice >= price) return 0;
  return Math.round(((price - offerPrice) / price) * 100);
}

/** Join class names, dropping falsy values. Replaces a clsx dependency. */
export function cn(...values) {
  return values.filter(Boolean).join(' ');
}
