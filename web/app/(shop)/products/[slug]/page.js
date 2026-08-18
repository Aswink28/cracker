import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Tag, ShieldAlert } from 'lucide-react';
import ProductImage from '@/components/ProductImage';
import ProductPurchasePanel from '@/components/ProductPurchasePanel';
import ProductGrid from '@/components/ProductGrid';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { SectionHeading } from '@/components/CategoryRail';
import { getProductBySlug, getProductSlugs } from '@/lib/api';
import { formatPrice, effectivePrice, discountPercent } from '@/lib/format';
import { store } from '@/lib/config';
import { buildMetadata, productJsonLd, breadcrumbJsonLd, truncate } from '@/lib/seo';

/**
 * Pre-render every product at build time, and render anything new on first
 * request. This is what gives each product page fully-formed HTML for crawlers
 * and social previews without rebuilding the site for every catalogue edit -
 * the Express API invalidates the relevant tag when a product changes.
 */
export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs();
    return slugs.map(({ slug }) => ({ slug }));
  } catch (error) {
    // A build must not fail because the API was briefly unreachable; pages
    // will simply be generated on demand instead.
    console.warn('generateStaticParams: product slugs unavailable -', error.message);
    return [];
  }
}

export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);

  // Signalling the miss here as well as in the page body is what makes the
  // response a real 404 rather than a soft 404 - a 200 carrying "not found"
  // content is treated by Google as a quality problem and can hold back
  // indexing for the whole catalogue.
  if (!data) notFound();

  const { product } = data;
  const price = effectivePrice(product);

  // Every product gets its own description built from its own copy - never a
  // shared template string, which would give the whole catalogue one
  // duplicate meta description.
  const description =
    product.shortDescription ||
    truncate(product.description, 150) ||
    `${product.name} from our ${product.category?.name ?? 'crackers'} range.`;

  return buildMetadata({
    title: product.name,
    description: `${description} Priced at ${formatPrice(price)}. Order on WhatsApp from ${store.name}.`,
    path: `/products/${product.slug}`,
    type: 'website',
    image: product.image?.url
      ? {
          url: product.image.url,
          width: product.image.width,
          height: product.image.height,
          alt: `${product.name} crackers`,
        }
      : undefined,
  });
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);

  // A removed product must return a real 404, not a soft error page.
  if (!data) notFound();

  const { product, related } = data;
  const price = effectivePrice(product);
  const discount = discountPercent(product);
  const hasOffer = discount > 0;

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    ...(product.category
      ? [{ name: product.category.name, path: `/categories/${product.category.slug}` }]
      : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <div className="container-page py-6 sm:py-8">
      <JsonLd data={[productJsonLd(product), breadcrumbJsonLd(trail)]} />

      <Breadcrumbs trail={trail} className="mb-4" />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-card border border-ink-200 bg-white">
          <ProductImage
            image={product.image}
            alt={`${product.name} crackers`}
            // The LCP element on this page - eagerly loaded and preloaded.
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {hasOffer && (
            <span className="absolute left-3 top-3 rounded-md bg-brand-700 px-2 py-1 text-xs font-bold text-white">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <Link
              href={`/categories/${product.category.slug}`}
              className="inline-flex min-h-9 items-center text-sm font-medium text-brand-700 hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-1 text-2xl font-bold text-ink-950 sm:text-3xl">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="mt-2 text-base leading-relaxed text-ink-600">
              {product.shortDescription}
            </p>
          )}

          {/* Price */}
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold text-ink-950">{formatPrice(price)}</span>
            {hasOffer && (
              <>
                <span className="text-lg text-ink-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-2 py-0.5 text-sm font-semibold text-success-700">
                  <Tag className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
                  Save {formatPrice(product.price - price)}
                </span>
              </>
            )}
          </div>

          {product.unit && <p className="mt-1 text-sm text-ink-600">{product.unit}</p>}

          {/* Availability */}
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
            {product.inStock ? (
              <>
                <Check className="h-4 w-4 text-success-500" strokeWidth={2.6} aria-hidden="true" />
                <span className="text-success-700">In stock</span>
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-error-500" strokeWidth={2.6} aria-hidden="true" />
                <span className="text-error-700">Out of stock</span>
              </>
            )}
          </p>

          <ProductPurchasePanel product={product} />

          <p className="mt-4 text-xs leading-relaxed text-ink-500">
            Prices are indicative. We confirm availability and the final amount over
            WhatsApp before dispatch. This site does not take online payments.
          </p>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <section className="mt-10 max-w-3xl" aria-labelledby="description-heading">
          <h2 id="description-heading" className="text-lg font-bold text-ink-950">
            Product details
          </h2>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-700">
            {product.description}
          </p>
        </section>
      )}

      {/* Safety */}
      <section className="mt-8 max-w-3xl" aria-labelledby="safety-heading">
        <div className="rounded-card border border-warning-500/30 bg-warning-50 p-4 sm:p-5">
          <h2
            id="safety-heading"
            className="flex items-center gap-2 text-base font-bold text-ink-950"
          >
            <ShieldAlert className="h-5 w-5 text-warning-700" strokeWidth={2} aria-hidden="true" />
            Safety information
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-ink-700">
            <li>Follow all applicable local laws and regulations on fireworks.</li>
            <li>Purchase and use fireworks only where it is legally permitted.</li>
            <li>Follow the manufacturer&apos;s instructions printed on the pack.</li>
            <li>Keep fireworks away from children unless an adult is supervising.</li>
            <li>Use only in a suitable open area, well away from buildings and vehicles.</li>
            <li>Keep water or sand within reach before lighting anything.</li>
            <li>Never relight a firework that has failed to ignite.</li>
          </ul>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-heading">
          <SectionHeading
            id="related-heading"
            title="You may also like"
            subtitle={
              product.category ? `More from ${product.category.name}` : 'More from our range'
            }
            href={product.category ? `/categories/${product.category.slug}` : '/products'}
          />
          <ProductGrid products={related.slice(0, 5)} />
        </section>
      )}
    </div>
  );
}
