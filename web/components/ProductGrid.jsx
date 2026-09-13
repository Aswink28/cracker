import ProductCard from './ProductCard';
import { cn } from '@/lib/format';

/**
 * Responsive product grid.
 *
 * Two columns on the smallest phones is deliberate: a single column makes
 * customers scroll twice as far through a 30-item catalogue, and the cards
 * still hold a readable price and a full-width button at 320px.
 */
/**
 * Which cards survive in `singleRow` mode, by position.
 *
 * From `md` up this is a grid of 3/4/5 columns as the viewport grows, so "one
 * row" is a different number of cards at each width, and each card past the
 * third appears only once its own column exists - which keeps the row full and
 * never ragged.
 *
 * Below `md` none of these apply, because the row becomes a horizontal
 * scroller and every card is reachable by swiping. The switch is at `md`
 * rather than `sm` because a two-column grid of five products shows two and
 * hides three with no way to reach them - the worst of both arrangements.
 */
const SINGLE_ROW = ['', '', '', 'md:hidden lg:flex', 'md:hidden xl:flex'];

export default function ProductGrid({
  products = [],
  priorityCount = 0,
  singleRow = false,
  className,
}) {
  if (products.length === 0) return null;

  const items = singleRow ? products.slice(0, SINGLE_ROW.length) : products;

  return (
    <ul
      className={cn(
        'list-none gap-3 sm:gap-4',
        singleRow
          ? // Swipeable rail on phones and small tablets, grid from `md`. The
            // negative margin and matching padding let cards bleed to the
            // screen edge while their content stays aligned with the page.
            [
              'no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-2',
              'md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0',
            ]
          : 'grid grid-cols-2',
        'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className,
      )}
    >
      {items.map((product, index) => (
        <li
          key={product.id}
          className={cn(
            'flex',
            // Cards need an explicit width while they are flex children in the
            // rail; the grid sizes them from `sm` up.
            singleRow && 'w-40 shrink-0 snap-start sm:w-48 md:w-auto',
            singleRow && SINGLE_ROW[index],
          )}
        >
          <ProductCard
            product={product}
            // Only the first row is eagerly loaded; everything below the fold
            // stays lazy.
            priority={index < priorityCount}
            className="w-full"
          />
        </li>
      ))}
    </ul>
  );
}
