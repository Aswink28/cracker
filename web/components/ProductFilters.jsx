'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { cn } from '@/lib/format';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'New Arrivals' },
  { value: 'discount', label: 'Biggest Discount' },
];

const PRICE_BANDS = [
  { label: 'Under ₹100', minPrice: '', maxPrice: '100' },
  { label: '₹100 - ₹500', minPrice: '100', maxPrice: '500' },
  { label: '₹500 - ₹1,000', minPrice: '500', maxPrice: '1000' },
  { label: '₹1,000 - ₹2,500', minPrice: '1000', maxPrice: '2500' },
  { label: 'Above ₹2,500', minPrice: '2500', maxPrice: '' },
];

/**
 * Filter and sort controls for the product listing.
 *
 * All state lives in the URL rather than in component state, so a filtered view
 * is shareable, survives the back button, and is rendered on the server. The
 * page itself stays a server component; only these controls ship JS.
 */
export default function ProductFilters({ categories = [], total = 0 }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const current = {
    category: searchParams.get('category') ?? '',
    sort: searchParams.get('sort') ?? 'popular',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    onOffer: searchParams.get('onOffer') === 'true',
    search: searchParams.get('search') ?? '',
  };

  const activeCount =
    (current.category ? 1 : 0) +
    (current.minPrice || current.maxPrice ? 1 : 0) +
    (current.onOffer ? 1 : 0);

  /**
   * Apply a partial change to the query string.
   * Changing any filter resets to page 1 - staying on page 4 of a result set
   * that now has two pages would show an empty grid.
   */
  function apply(changes, { closeSheet = false } = {}) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || value === null || value === undefined || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }

    params.delete('page');

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });

    if (closeSheet) setSheetOpen(false);
  }

  function clearAll() {
    const params = new URLSearchParams();
    // A search term is the customer's own input, not a filter - clearing the
    // filters should not silently discard what they typed.
    if (current.search) params.set('search', current.search);
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
    setSheetOpen(false);
  }

  const priceIsActive = (band) =>
    current.minPrice === band.minPrice && current.maxPrice === band.maxPrice;

  const filterBody = (
    <div className="flex flex-col gap-6">
      {/* Category */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-950">Category</legend>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={current.category === ''}
            onClick={() => apply({ category: '' })}
            label="All"
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              active={current.category === category.slug}
              onClick={() => apply({ category: category.slug })}
              label={category.name}
              count={category.productCount}
            />
          ))}
        </div>
      </fieldset>

      {/* Price */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-950">Price</legend>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={!current.minPrice && !current.maxPrice}
            onClick={() => apply({ minPrice: '', maxPrice: '' })}
            label="Any"
          />
          {PRICE_BANDS.map((band) => (
            <FilterChip
              key={band.label}
              active={priceIsActive(band)}
              onClick={() =>
                apply(
                  priceIsActive(band)
                    ? { minPrice: '', maxPrice: '' }
                    : { minPrice: band.minPrice, maxPrice: band.maxPrice },
                )
              }
              label={band.label}
            />
          ))}
        </div>
      </fieldset>

      {/* Offers */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-950">Offers</legend>
        <FilterChip
          active={current.onOffer}
          onClick={() => apply({ onOffer: !current.onOffer })}
          label="On offer only"
        />
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600" aria-live="polite">
          {isPending ? 'Updating...' : `${total} product${total === 1 ? '' : 's'}`}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="btn-secondary px-3 text-sm lg:hidden"
            aria-expanded={sheetOpen}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="sr-only">
              Sort products
            </label>
            <select
              id="sort"
              value={current.sort}
              onChange={(event) => apply({ sort: event.target.value })}
              className="input h-11 w-auto py-0 pr-8 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop sidebar filters */}
      <div className="mt-6 hidden lg:block">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-950">Filters</h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="mt-4">{filterBody}</div>
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter products"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-4 animate-slide-up"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink-950">Filters</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
                aria-label="Close filters"
                autoFocus
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            {filterBody}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={clearAll} className="btn-secondary flex-1">
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="btn-primary flex-1"
              >
                Show {total} result{total === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterChip({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
        active
          ? 'border-brand-700 bg-brand-700 text-white'
          : 'border-ink-300 bg-white text-ink-700 hover:border-ink-400 hover:bg-ink-50',
      )}
    >
      {active && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
      {label}
      {count != null && (
        <span className={cn('text-xs', active ? 'text-brand-100' : 'text-ink-400')}>
          {count}
        </span>
      )}
    </button>
  );
}
