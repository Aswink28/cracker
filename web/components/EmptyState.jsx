import Link from 'next/link';
import { PackageSearch } from 'lucide-react';

/** Shown when a filter or search returns nothing, with a way back to the full range. */
export default function EmptyState({
  title = 'No products found',
  body = 'Try a different search term, or clear the filters to see the full range.',
  actionHref = '/products',
  actionLabel = 'View all products',
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-ink-300 bg-white px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <PackageSearch className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-lg font-bold text-ink-950">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-600">{body}</p>

      {actionHref && (
        <Link href={actionHref} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
