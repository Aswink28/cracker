import Link from 'next/link';
import ProductImage from './ProductImage';
import AddToCartControl from './AddToCartControl';
import { formatPrice, effectivePrice, discountPercent, cn } from '@/lib/format';

/**
 * The catalogue's core reusable card. Server component - only the add-to-cart
 * control below it is client-side, which keeps the grid out of the JS bundle.
 *
 * `priority` should be true only for the first row of the first grid on a page,
 * where the image is a genuine LCP candidate.
 */
export default function ProductCard({ product, priority = false, className }) {
  const price = effectivePrice(product);
  const discount = discountPercent(product);
  const hasOffer = discount > 0;
  const href = `/products/${product.slug}`;

  return (
    // `relative` anchors the stretched title link below.
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card border border-ink-200 bg-white',
        'transition-shadow md:hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-ink-100">
        <ProductImage
          image={product.image}
          alt={`${product.name} crackers`}
          priority={priority}
          // Two across on phones, up to five on a wide desktop grid.
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 240px"
          className="transition-transform duration-300 md:group-hover:scale-105"
        />

        {/* Both badges restate information the text below already conveys, so
            they are hidden from screen readers to avoid duplicate announcements. */}
        {hasOffer && (
          <span
            aria-hidden="true"
            className="absolute left-2 top-2 rounded-md bg-brand-700 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm"
          >
            {discount}% OFF
          </span>
        )}

        {!product.inStock && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 bg-ink-950/75 py-1 text-center text-xs font-semibold text-white"
          >
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex-1">
          <h3 className="text-sm leading-snug font-semibold text-ink-950 sm:text-base">
            {/*
              Stretched link: the ::after overlay makes the entire card the tap
              target, rather than a 19px-tall line of text. That is the whole
              card on a phone instead of a target below the 24px WCAG minimum,
              and it leaves exactly one link per card for screen readers.
            */}
            <Link
              href={href}
              className="hover:text-brand-700 after:absolute after:inset-0 after:content-['']"
            >
              {product.name}
            </Link>
          </h3>

          {product.category?.name && (
            <p className="mt-0.5 text-xs text-ink-500">{product.category.name}</p>
          )}
        </div>

        {/*
          The image overlay is aria-hidden to avoid a duplicate link, so the
          discount is restated here for screen readers instead of being lost.
        */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold text-ink-950 sm:text-lg">
            {formatPrice(price)}
          </span>
          {hasOffer && (
            <>
              <span className="text-sm text-ink-400 line-through" aria-hidden="true">
                {formatPrice(product.price)}
              </span>
              <span className="sr-only">
                reduced from {formatPrice(product.price)}, {discount} percent off
              </span>
            </>
          )}
        </div>

        {product.unit && <p className="-mt-1 text-xs text-ink-500">{product.unit}</p>}

        {/* z-10 lifts the button above the stretched link's overlay, so tapping
            "Add to Cart" adds to the cart instead of navigating. */}
        <div className="relative z-10 mt-1">
          <AddToCartControl product={product} size="sm" />
        </div>
      </div>
    </article>
  );
}
