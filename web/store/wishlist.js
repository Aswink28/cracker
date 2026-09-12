'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const STORAGE_KEY = 'crackers-wishlist-v1';

/**
 * Same inert-storage trick as the cart: on the server there is no
 * localStorage, and handing persist a working stub keeps the store shape and
 * its `persist` API identical during prerendering.
 */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const storage = createJSONStorage(() =>
  typeof window !== 'undefined' ? window.localStorage : noopStorage,
);

/**
 * Saved products, by id.
 *
 * Only ids are kept, unlike the cart which stores a trimmed snapshot. A saved
 * item is always rendered next to live product data, so there is nothing to
 * gain from caching a name or price that could go stale - and a price the
 * customer saw weeks ago is exactly the thing not to resurrect.
 */
export const useWishlistStore = create()(
  persist(
    (set, get) => ({
      ids: [],

      toggle: (productId) => {
        if (!productId) return;
        const { ids } = get();
        set({
          ids: ids.includes(productId)
            ? ids.filter((id) => id !== productId)
            : [...ids, productId],
        });
      },

      clear: () => set({ ids: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 1,
    },
  ),
);

export default useWishlistStore;
