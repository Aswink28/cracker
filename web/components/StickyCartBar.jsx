'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/format';

/**
 * Fixed bottom bar shown on phones when the cart has items.
 *
 * Two details matter for not breaking the layout:
 *  - it is hidden on /cart, where it would duplicate the page's own CTA;
 *  - it renders a same-height spacer in normal flow alongside the fixed bar,
 *    so the end of the page is never hidden underneath it. Reserving that
 *    space unconditionally in the layout would instead leave a dead gap
 *    whenever the cart is empty.
 * `env(safe-area-inset-bottom)` keeps it clear of the iPhone home indicator.
 */
export default function StickyCartBar() {
  const pathname = usePathname();
  const { totalQuantity, totalAmount, hydrated } = useCart();

  if (!hydrated || totalQuantity === 0) return null;
  if (pathname === '/cart' || pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Occupies the same height as the fixed bar below. */}
      <div
        aria-hidden="true"
        className="lg:hidden"
        style={{ height: 'calc(3.75rem + env(safe-area-inset-bottom, 0px))' }}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <ShoppingCart className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-xs text-ink-600">
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
            </span>
            <span className="truncate text-base font-bold text-ink-950">
              {formatPrice(totalAmount)}
            </span>
          </span>
        </div>

        <Link href="/cart" className="btn-primary shrink-0 text-sm">
          View Cart
          <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
        </Link>
        </div>
      </div>
    </>
  );
}
