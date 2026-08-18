'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import QuantitySelector from './QuantitySelector';
import WhatsAppButton from './WhatsAppButton';
import { useCartStore } from '@/store/cart';
import { useItemQuantity } from '@/hooks/useCart';
import { store, has } from '@/lib/config';

/**
 * Quantity + add-to-cart + enquiry controls for a product detail page.
 *
 * Once the item is in the cart the primary action becomes "View Cart" rather
 * than a second "Add to Cart", so a customer cannot silently double their
 * order by tapping twice.
 */
export default function ProductPurchasePanel({ product }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const inCart = useItemQuantity(product.id);

  if (!product.inStock) {
    return (
      <div className="mt-6">
        <div className="rounded-card border border-ink-200 bg-ink-100 px-4 py-3 text-center text-sm font-semibold text-ink-600">
          Currently out of stock
        </div>
        <p className="mt-2 text-sm text-ink-600">
          Message us on WhatsApp and we will let you know when it is available again.
        </p>
        {has.whatsapp && (
          <WhatsAppButton
            product={product}
            label="Ask about availability"
            variant="outline"
            className="mt-3 w-full"
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-ink-700">Quantity</span>
        <QuantitySelector
          value={quantity}
          onIncrement={() => setQuantity((q) => Math.min(999, q + 1))}
          onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
          label={`quantity of ${product.name}`}
        />
      </div>

      {inCart > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success-700">
          <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
          {inCart} already in your cart
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => addItem(product, quantity)}
          className="btn-primary flex-1"
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          Add to Cart
        </button>

        {inCart > 0 ? (
          <Link href="/cart" className="btn-secondary flex-1">
            View Cart
          </Link>
        ) : (
          has.whatsapp && (
            <WhatsAppButton
              product={product}
              label="WhatsApp Enquiry"
              variant="outline"
              className="flex-1"
            />
          )
        )}
      </div>

      {has.phone && (
        <a
          href={`tel:${store.phone}`}
          className="mt-3 inline-flex min-h-9 items-center text-sm font-medium text-brand-700 hover:underline"
        >
          Or call us on {store.phone}
        </a>
      )}
    </div>
  );
}
