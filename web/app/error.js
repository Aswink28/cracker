'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Home } from 'lucide-react';
import { store, has } from '@/lib/config';

/**
 * Route-level error boundary.
 *
 * Shows a recovery path rather than a stack trace, and keeps the shop's phone
 * number visible - if the site is broken, the customer should still be able to
 * reach a human.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-bold text-ink-950">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600">
        We hit a problem loading this page. Please try again in a moment.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-primary">
          <RotateCw className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          <Home className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          Go to homepage
        </Link>
      </div>

      {has.phone && (
        <p className="mt-8 text-sm text-ink-600">
          Need help right now? Call us on{' '}
          <a href={`tel:${store.phone}`} className="font-semibold text-brand-700 hover:underline">
            {store.phone}
          </a>
        </p>
      )}
    </div>
  );
}
