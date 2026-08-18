'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const STORAGE_KEY = 'crackers-cart-v1';
const MAX_QUANTITY = 999;

/**
 * Storage backend.
 *
 * On the server there is no localStorage, and zustand's persist middleware
 * silently omits its whole `persist` API when the storage getter throws -
 * which then breaks any code calling `store.persist.hasHydrated()` during
 * prerendering. Handing it an inert storage on the server keeps the API
 * present and the store shape identical in both environments.
 */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const storage = createJSONStorage(() =>
  typeof window !== 'undefined' ? window.localStorage : noopStorage,
);

function clampQuantity(value) {
  const n = Math.floor(Number(value) || 0);
  if (n < 0) return 0;
  return Math.min(n, MAX_QUANTITY);
}

/**
 * Only the fields the cart and the WhatsApp message actually need.
 *
 * Storing a trimmed snapshot keeps localStorage small and, more importantly,
 * means a stale cart cannot resurrect a full stale product record - prices are
 * re-checked by the shop when they confirm the order over WhatsApp.
 */
function toCartItem(product, quantity) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    offerPrice: product.offerPrice ?? null,
    unit: product.unit ?? '',
    image: product.image ? { url: product.image.url, alt: product.image.alt ?? '' } : null,
    categoryName: product.category?.name ?? '',
    quantity: clampQuantity(quantity),
  };
}

export const useCartStore = create()(
  persist(
    (set, get) => ({
      items: [],

      /** Add a product, or increase its quantity if already present. */
      addItem(product, quantity = 1) {
        const qty = clampQuantity(quantity);
        if (qty < 1 || !product?.id) return;

        set((state) => {
          const index = state.items.findIndex((item) => item.id === product.id);

          if (index === -1) {
            return { items: [...state.items, toCartItem(product, qty)] };
          }

          const items = [...state.items];
          items[index] = {
            ...items[index],
            quantity: clampQuantity(items[index].quantity + qty),
          };
          return { items };
        });
      },

      /** Set an exact quantity. Zero or less removes the line. */
      setQuantity(productId, quantity) {
        const qty = clampQuantity(quantity);

        set((state) => {
          if (qty < 1) {
            return { items: state.items.filter((item) => item.id !== productId) };
          }
          return {
            items: state.items.map((item) =>
              item.id === productId ? { ...item, quantity: qty } : item,
            ),
          };
        });
      },

      increment(productId) {
        const item = get().items.find((i) => i.id === productId);
        if (item) get().setQuantity(productId, item.quantity + 1);
      },

      decrement(productId) {
        const item = get().items.find((i) => i.id === productId);
        if (item) get().setQuantity(productId, item.quantity - 1);
      },

      removeItem(productId) {
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) }));
      },

      clear() {
        set({ items: [] });
      },

      getQuantity(productId) {
        return get().items.find((item) => item.id === productId)?.quantity ?? 0;
      },
    }),
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({ items: state.items }),
      version: 1,
    },
  ),
);

/**
 * Derive cart totals.
 *
 * A plain function over the items array rather than a store selector: computing
 * this inside a selector would return a fresh object every render and force
 * every subscribed component to re-render on any state change.
 */
export function selectTotals(items) {
  let totalQuantity = 0;
  let totalAmount = 0;
  let totalSavings = 0;

  for (const item of items) {
    const unit = item.offerPrice != null && item.offerPrice < item.price
      ? item.offerPrice
      : item.price;

    totalQuantity += item.quantity;
    totalAmount += unit * item.quantity;
    totalSavings += (item.price - unit) * item.quantity;
  }

  return {
    totalQuantity,
    totalAmount,
    totalSavings,
    lineCount: items.length,
  };
}
