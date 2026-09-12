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
 * The grid is 2/3/4/5 columns as the viewport grows, so "one row" is a
 * different number of cards at each breakpoint. Each card past the second
 * appears only once its own column exists, which keeps the row full and never
 * ragged. Hidden with CSS rather than by slicing the array, so the same markup
 * serves every width - the alternative is picking a count on the server and
 * getting it wrong for everyone else.
 */
const SINGLE_ROW = ['', '', 'hidden md:flex', 'hidden lg:flex', 'hidden xl:flex'];

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
        'grid list-none grid-cols-2 gap-3 sm:gap-4',
        'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className,
      )}
    >
      {items.map((product, index) => (
        <li key={product.id} className={cn('flex', singleRow && SINGLE_ROW[index])}>
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
