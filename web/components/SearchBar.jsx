'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/format';

/**
 * Search input that navigates to /products with a `search` query.
 *
 * Submitting rather than searching on every keystroke is intentional: each
 * search is a server round trip, and firing one per character would hammer the
 * API and make the results flicker on a slow connection.
 */
export default function SearchBar({ className, autoFocus = false, onSubmitted }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('search') ?? '');

  // Keep the field in step when the URL changes underneath it (back button,
  // or clearing the filter from the results page).
  useEffect(() => {
    setValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  function handleSubmit(event) {
    event.preventDefault();
    const term = value.trim();
    router.push(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
    onSubmitted?.();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn('relative flex w-full items-center', className)}
    >
      <label htmlFor="site-search" className="sr-only">
        Search crackers
      </label>

      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400"
        strokeWidth={2}
        aria-hidden="true"
      />

      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search crackers, sparklers, rockets..."
        autoFocus={autoFocus}
        enterKeyHint="search"
        className="input h-11 pl-9 pr-9 text-sm"
      />

      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      )}
    </form>
  );
}
