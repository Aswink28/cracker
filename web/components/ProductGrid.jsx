import ProductCard from './ProductCard';
import { cn } from '@/lib/format';

/**
 * Responsive product grid.
 *
 * Two columns on the smallest phones is deliberate: a single column makes
 * customers scroll twice as far through a 30-item catalogue, and the cards
 * still hold a readable price and a full-width button at 320px.
 */
export default function ProductGrid({ products = [], priorityCount = 0, className }) {
  if (products.length === 0) return null;

  return (
    <ul
      className={cn(
        'grid list-none grid-cols-2 gap-3 sm:gap-4',
        'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id} className="flex">
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
