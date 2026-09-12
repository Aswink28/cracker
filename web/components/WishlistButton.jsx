'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist';
import { cn } from '@/lib/format';

/**
 * Save-for-later toggle shown on a product card.
 *
 * The filled state is only rendered after hydration. Saved items live in
 * localStorage, which the server cannot see, so painting a filled heart during
 * SSR would guarantee a hydration mismatch on every visit where the product is
 * already saved.
 */
export default function WishlistButton({ product, className }) {
  const [hydrated, setHydrated] = useState(false);
  const ids = useWishlistStore((state) => state.ids);
  const toggle = useWishlistStore((state) => state.toggle);

  useEffect(() => setHydrated(true), []);

  const saved = hydrated && ids.includes(product.id);

  return (
    <button
      type="button"
      onClick={() => toggle(product.id)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
      title={saved ? 'Remove from saved' : 'Save for later'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-colors',
        saved ? 'text-brand-700 hover:text-brand-800' : 'text-ink-500 hover:text-brand-700',
        className,
      )}
    >
      <Heart
        className="h-4 w-4"
        strokeWidth={2.2}
        fill={saved ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
    </button>
  );
}
