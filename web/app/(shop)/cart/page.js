import CartView from '@/components/CartView';
import { buildMetadata } from '@/lib/seo';

/**
 * The cart is a private working page, not catalogue content: it is excluded
 * from the sitemap and marked noindex so it never competes with product pages
 * or shows up in results with someone's order in it.
 */
export const metadata = buildMetadata({
  title: 'Your Cart',
  description: 'Review your selected crackers and send your order to us on WhatsApp.',
  path: '/cart',
  noIndex: true,
});

export default function CartPage() {
  return <CartView />;
}
