import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/format';

/**
 * Server-rendered pagination.
 *
 * Real <a> links rather than buttons, so each page of the catalogue is
 * crawlable and can be opened in a new tab. `rel=prev/next` helps crawlers
 * understand the sequence.
 */
export default function Pagination({ page, totalPages, buildHref, className }) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn('flex justify-center', className)}>
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link
              href={buildHref(page - 1)}
              rel="prev"
              className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-ink-300 bg-white px-3 text-sm font-medium text-ink-700 hover:bg-ink-100"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          ) : (
            <span className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-ink-200 bg-ink-100 px-3 text-sm text-ink-400">
              <ChevronLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </span>
          )}
        </li>

        {pages.map((entry, index) =>
          entry === '...' ? (
            <li
              key={`gap-${index}`}
              className="flex h-11 w-8 items-center justify-center text-ink-400"
              aria-hidden="true"
            >
              &hellip;
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={buildHref(entry)}
                aria-current={entry === page ? 'page' : undefined}
                aria-label={`Page ${entry}`}
                className={cn(
                  'flex h-11 min-w-11 items-center justify-center rounded-lg border px-2 text-sm font-medium',
                  entry === page
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-ink-300 bg-white text-ink-700 hover:bg-ink-100',
                )}
              >
                {entry}
              </Link>
            </li>
          ),
        )}

        <li>
          {page < totalPages ? (
            <Link
              href={buildHref(page + 1)}
              rel="next"
              className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-ink-300 bg-white px-3 text-sm font-medium text-ink-700 hover:bg-ink-100"
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            </Link>
          ) : (
            <span className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-ink-200 bg-ink-100 px-3 text-sm text-ink-400">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

/**
 * Page numbers to display: always the first and last, plus a window around the
 * current page, with ellipses for the gaps. Keeps the control to one row even
 * at 320px with 40 pages.
 */
function pageWindow(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) result.push('...');
  for (let i = start; i <= end; i += 1) result.push(i);
  if (end < totalPages - 1) result.push('...');

  result.push(totalPages);
  return result;
}
