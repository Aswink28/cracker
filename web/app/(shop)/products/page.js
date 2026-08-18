import { Suspense } from 'react';
import ProductGrid from '@/components/ProductGrid';
import ProductFilters from '@/components/ProductFilters';
import Pagination from '@/components/Pagination';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import JsonLd from '@/components/JsonLd';
import { getProducts, getCategories } from '@/lib/api';
import { store } from '@/lib/config';
import { buildMetadata, breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo';

const PAGE_SIZE = 20;

/**
 * Canonical is always the bare /products URL.
 *
 * Filter, sort and page parameters produce near-identical content, so pointing
 * them all at one canonical prevents the catalogue from competing with itself
 * in the index. Deep pages stay crawlable through the pagination links.
 */
export const metadata = buildMetadata({
  title: 'All Crackers & Fireworks',
  description:
    'Browse the full crackers catalogue - sparklers, flower pots, ground chakkars, ' +
    'rockets, fancy crackers, gift boxes and combo packs. Filter by category, price ' +
    'and offers, then order on WhatsApp.',
  path: '/products',
});

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Products', path: '/products' },
];

export default async function ProductsPage({ searchParams }) {
  // Next 15+ delivers searchParams asynchronously.
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const query = {
    page,
    limit: PAGE_SIZE,
    search: params.search || undefined,
    category: params.category || undefined,
    minPrice: params.minPrice || undefined,
    maxPrice: params.maxPrice || undefined,
    onOffer: params.onOffer === 'true' ? 'true' : undefined,
    sort: params.sort || 'popular',
  };

  const [result, categories] = await Promise.all([
    getProducts(query).catch((error) => {
      console.error('Products page: listing unavailable -', error.message);
      return { products: [], total: 0, totalPages: 0, page };
    }),
    getCategories().catch(() => []),
  ]);

  const { products, total, totalPages } = result;

  /** Preserve the current filters when moving between pages. */
  function buildHref(targetPage) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === 'page' || value === undefined || value === '') continue;
      next.set(key, String(value));
    }
    if (targetPage > 1) next.set('page', String(targetPage));
    const qs = next.toString();
    return qs ? `/products?${qs}` : '/products';
  }

  const activeCategory = categories.find((c) => c.slug === params.category);

  const heading = params.search
    ? `Search results for "${params.search}"`
    : activeCategory
      ? activeCategory.name
      : 'All Products';

  return (
    <div className="container-page py-6 sm:py-8">
      <JsonLd
        data={[
          breadcrumbJsonLd(BREADCRUMBS),
          itemListJsonLd(products, `${heading} - ${store.name}`),
        ]}
      />

      <Breadcrumbs trail={BREADCRUMBS} className="mb-3" />

      <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">{heading}</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
        Sparklers, flower pots, ground chakkars, rockets, gift boxes and combo packs.
        Add what you need to your cart and send the list to us on WhatsApp.
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<div className="h-11" />}>
            <ProductFilters categories={categories} total={total} />
          </Suspense>
        </aside>

        <div className="mt-6 lg:mt-0">
          {products.length === 0 ? (
            <EmptyState
              title={params.search ? 'No matches found' : 'No products here yet'}
              body={
                params.search
                  ? `We could not find anything for "${params.search}". Try a different word, or browse the full range.`
                  : 'Try clearing the filters to see everything we have available.'
              }
            />
          ) : (
            <>
              <ProductGrid products={products} priorityCount={4} />
              <Pagination
                page={page}
                totalPages={totalPages}
                buildHref={buildHref}
                className="mt-8"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
