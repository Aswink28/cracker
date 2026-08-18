'use client';

import { useEffect, useState } from 'react';
import { useCartStore, selectTotals } from '@/store/cart';

/**
 * True once zustand's persist middleware has rehydrated from localStorage.
 *
 * The server renders an empty cart because it cannot see localStorage. If a
 * component rendered the restored cart on the very first client pass, React
 * would report a hydration mismatch and the badge would visibly flicker. Every
 * cart-aware component waits for this flag instead.
 */
export function useCartHydrated() {
  // Must start false on BOTH server and client. localStorage is synchronous,
  // so by the first client render the store already holds the restored cart -
  // seeding this from hasHydrated() would make that first render disagree with
  // the server HTML and trigger a hydration error.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const api = useCartStore.persist;

    if (!api) {
      // No persist API means nothing to wait for.
      setHydrated(true);
      return undefined;
    }

    if (api.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }

    // Covers a storage backend that rehydrates asynchronously.
    return api.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

/** Cart items and totals, safe to render. Empty until hydration completes. */
export function useCart() {
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);

  const safeItems = hydrated ? items : [];

  return {
    hydrated,
    items: safeItems,
    ...selectTotals(safeItems),
  };
}

/** The quantity of one product in the cart, or 0 before hydration. */
export function useItemQuantity(productId) {
  const hydrated = useCartHydrated();
  const quantity = useCartStore(
    (state) => state.items.find((item) => item.id === productId)?.quantity ?? 0,
  );
  return hydrated ? quantity : 0;
}
