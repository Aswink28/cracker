import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import ProductImage from './ProductImage';
import { cn } from '@/lib/format';

/**
 * Category browser.
 *
 * On phones this is a single horizontally scrolling row rather than a stacked
 * grid: eight stacked category cards would push the featured products far below
 * the fold on a 375px screen. `snap-x` makes the swipe feel deliberate instead
 * of loose, and the row keeps its own overflow so the page never scrolls
 * sideways.
 */
export default function CategoryRail({ categories = [], className }) {
  if (categories.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      <ul
        className={cn(
          'no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2',
          // Bleed to the screen edge on mobile so the row reads as scrollable,
          // then return to the normal grid at tablet width and above.
          '-mx-4 px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0',
          'lg:grid-cols-4 xl:grid-cols-8',
        )}
      >
        {categories.map((category) => (
          <li key={category.id} className="w-32 shrink-0 snap-start sm:w-auto">
            <Link
              href={`/categories/${category.slug}`}
              className="group flex h-full flex-col items-center gap-2 rounded-card border border-ink-200 bg-white p-3 text-center transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-600">
                {category.image?.url ? (
                  <ProductImage
                    image={category.image}
                    alt={`${category.name} crackers`}
                    sizes="56px"
                    className="rounded-full"
                  />
                ) : (
                  <Sparkles className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                )}
              </span>

              <span className="text-xs leading-tight font-semibold text-ink-900 sm:text-sm">
                {category.name}
              </span>

              {category.productCount > 0 && (
                <span className="text-[11px] text-ink-500">
                  {category.productCount} item{category.productCount === 1 ? '' : 's'}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Section heading with a "view all" affordance, reused across the homepage.
 * Takes an `id` so the surrounding <section> can point aria-labelledby at the
 * real <h2> rather than at a wrapper element.
 */
export function SectionHeading({ id, title, subtitle, href, linkLabel = 'View all' }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="text-xl font-bold text-ink-950 sm:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-ink-600">{subtitle}</p>}
      </div>

      {href && (
        // -mr-2 keeps the padded tap area from pushing the label off the
        // optical right edge of the section.
        <Link
          href={href}
          className="-mr-2 flex min-h-11 shrink-0 items-center gap-0.5 px-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {linkLabel}
          <ChevronRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
