'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useItemQuantity } from '@/hooks/useCart';
import QuantitySelector from './QuantitySelector';
import { cn } from '@/lib/format';

/**
 * "Add to Cart" that becomes a quantity stepper once the item is in the cart.
 *
 * Both states occupy the same height so the card does not resize when the
 * control swaps - a resizing grid on tap is exactly the kind of layout shift
 * the performance brief rules out.
 */
export default function AddToCartControl({ product, size = 'md', className }) {
  const quantity = useItemQuantity(product.id);
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);

  const compact = size === 'sm';
  const heightClass = compact ? 'h-9' : 'h-11';

  if (!product.inStock) {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-center rounded-lg border border-ink-200',
          'bg-ink-100 text-sm font-semibold text-ink-500',
          heightClass,
          className,
        )}
      >
        Out of stock
      </div>
    );
  }

  if (quantity > 0) {
    return (
      <div className={cn('flex w-full items-center justify-between gap-2', className)}>
        <QuantitySelector
          value={quantity}
          onIncrement={() => increment(product.id)}
          onDecrement={() => decrement(product.id)}
          min={0}
          size={size}
          label={`quantity of ${product.name}`}
          className="flex-1 justify-between"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addItem(product, 1)}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 font-semibold text-white',
        'transition-colors hover:bg-brand-800 active:bg-brand-900',
        heightClass,
        compact ? 'text-sm' : 'text-base',
        className,
      )}
    >
      <ShoppingCart className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2.2} />
      <span>Add to Cart</span>
      <span className="sr-only">: {product.name}</span>
    </button>
  );
}
