import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-5xl font-bold text-brand-700">404</p>
      <h1 className="mt-3 text-2xl font-bold text-ink-950">We could not find that page</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600">
        The page may have moved, or the product may no longer be available. Try browsing
        the catalogue instead.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          <Home className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          Go to homepage
        </Link>
        <Link href="/products" className="btn-secondary">
          <Search className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          Browse products
        </Link>
      </div>
    </div>
  );
}
