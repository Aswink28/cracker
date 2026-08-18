import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/format';

/**
 * Visible breadcrumb trail. The matching BreadcrumbList structured data is
 * emitted separately by each page via `breadcrumbJsonLd`, so the two never
 * drift: both are built from the same trail array.
 */
export default function Breadcrumbs({ trail = [], className }) {
  if (trail.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-500 sm:text-sm">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;

          return (
            <li key={crumb.path} className="flex min-w-0 items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />
              )}

              {isLast ? (
                <span className="truncate font-medium text-ink-700" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                // min-h-6 meets the 24px WCAG 2.5.8 minimum without making the
                // trail visually heavy.
                <Link
                  href={crumb.path}
                  className="inline-flex min-h-6 shrink-0 items-center hover:text-brand-700"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
