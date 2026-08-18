import { store, currency } from './config.js';
import { effectivePrice } from './format.js';

const DIVIDER = '----------------------------';

/**
 * Format a rupee amount for the message body.
 *
 * Intl's en-IN output contains a non-breaking space after the symbol, which
 * survives URL encoding and shows up as a stray character in some WhatsApp
 * clients. Grouping the digits by hand keeps the message clean.
 */
function money(value) {
  const amount = Math.round(Number(value) || 0);
  const [whole] = String(amount).split('.');
  // Indian digit grouping: last three digits, then pairs.
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest
    ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`
    : lastThree;
  return `${currency.symbol}${grouped}`;
}

/**
 * Build the order message sent to the shop over WhatsApp.
 *
 * This is the whole point of the site, so the format is deliberately plain
 * text: it must stay readable in the WhatsApp app, be easy for the owner to
 * copy into a bill book, and survive being forwarded.
 */
export function generateWhatsAppMessage({
  items = [],
  customer = {},
  storeName = store.name,
} = {}) {
  const {
    name = '',
    mobile = '',
    orderType = 'pickup',
    address = '',
    message = '',
  } = customer;

  const lines = [];

  lines.push(`Hello ${storeName},`, '', 'I would like to place an order.', '');

  lines.push(`Customer Name: ${name}`);
  lines.push(`Mobile: ${mobile}`);
  lines.push(`Order Type: ${orderType === 'delivery' ? 'Delivery' : 'Pickup'}`);

  // Address is only meaningful for delivery orders, so it is omitted entirely
  // for pickup rather than sent as an empty field.
  if (orderType === 'delivery' && address.trim()) {
    lines.push(`Delivery Address: ${address.trim()}`);
  }

  lines.push('', 'Products:', '');

  let totalQuantity = 0;
  let totalAmount = 0;

  items.forEach((item, index) => {
    const unitPrice = effectivePrice(item);
    const lineTotal = unitPrice * item.quantity;

    totalQuantity += item.quantity;
    totalAmount += lineTotal;

    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`Quantity: ${item.quantity}`);
    lines.push(`Price: ${money(unitPrice)}`);
    lines.push(`Total: ${money(lineTotal)}`);
    lines.push('');
  });

  lines.push(DIVIDER, '');
  lines.push(`Total Quantity: ${totalQuantity}`);
  lines.push(`Total Amount: ${money(totalAmount)}`);

  if (message.trim()) {
    lines.push('', `Note: ${message.trim()}`);
  }

  lines.push('', 'Please confirm the availability and order details.', '', 'Thank you.');

  return lines.join('\n');
}

/**
 * Build a click-to-chat URL.
 *
 * `wa.me` is the universal link and resolves correctly everywhere, but on a
 * desktop browser it shows an interstitial before offering WhatsApp Web.
 * Sending desktop users straight to web.whatsapp.com removes that extra click.
 */
export function buildWhatsAppUrl(message, phoneNumber = store.whatsapp) {
  const number = String(phoneNumber ?? '').replace(/\D/g, '');
  const text = encodeURIComponent(message ?? '');

  if (!number) {
    // Without a configured number, fall back to a chat-less share link rather
    // than producing a broken wa.me/ URL.
    return `https://wa.me/?text=${text}`;
  }

  if (isDesktop()) {
    return `https://web.whatsapp.com/send?phone=${number}&text=${text}`;
  }

  return `https://wa.me/${number}?text=${text}`;
}

/** Coarse pointer + no touch is a good enough desktop signal for link choice. */
function isDesktop() {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(min-width: 1024px) and (hover: hover)').matches;
}

/** A plain enquiry link for a single product, used on product detail pages. */
export function productEnquiryUrl(product) {
  const price = effectivePrice(product);
  const message = [
    `Hello ${store.name},`,
    '',
    `I would like to know more about this product:`,
    '',
    product.name,
    `Price: ${money(price)}`,
    `${store.siteUrl}/products/${product.slug}`,
    '',
    'Please share the availability details.',
    '',
    'Thank you.',
  ].join('\n');

  return buildWhatsAppUrl(message);
}

/** A general "contact us" link with no order attached. */
export function generalEnquiryUrl() {
  const message = `Hello ${store.name}, I would like to know more about your crackers collection.`;
  return buildWhatsAppUrl(message);
}

export { money as formatWhatsAppMoney };
