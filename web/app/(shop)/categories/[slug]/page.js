import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import Pagination from '@/components/Pagination';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import JsonLd from '@/components/JsonLd';
import { getCategoryBySlug, getProducts, getCategories } from '@/lib/api';
import { store } from '@/lib/config';
import { buildMetadata, breadcrumbJsonLd, itemListJsonLd, truncate } from '@/lib/seo';

const PAGE_SIZE = 20;

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((category) => ({ slug: category.slug }));
  } catch (error) {
    console.warn('generateStaticParams: categories unavailable -', error.message);
    return [];
  }
}

export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return buildMetadata({
      title: 'Category not found',
      description: 'This category is no longer available.',
      path: `/categories/${slug}`,
      noIndex: true,
    });
  }

  const description =
    truncate(category.description, 150) ||
    `Browse our ${category.name.toLowerCase()} range.`;

  return buildMetadata({
    title: `${category.name} - Crackers & Fireworks`,
    description: `${description} ${category.productCount} item${
      category.productCount === 1 ? '' : 's'
    } available from ${store.name}. Order on WhatsApp.`,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, Number(query.page) || 1);

  const result = await getProducts({
    category: slug,
    page,
    limit: PAGE_SIZE,
    sort: query.sort || 'popular',
  }).catch((error) => {
    console.error(`Category ${slug}: products unavailable -`, error.message);
    return { products: [], total: 0, totalPages: 0 };
  });

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: category.name, path: `/categories/${category.slug}` },
  ];

  const buildHref = (targetPage) =>
    targetPage > 1
      ? `/categories/${category.slug}?page=${targetPage}`
      : `/categories/${category.slug}`;

  return (
    <div className="container-page py-6 sm:py-8">
      <JsonLd
        data={[
          breadcrumbJsonLd(trail),
          itemListJsonLd(result.products, `${category.name} - ${store.name}`),
        ]}
      />

      <Breadcrumbs trail={trail} className="mb-3" />

      <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">{category.name}</h1>

      {category.description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
          {category.description}
        </p>
      )}

      <p className="mt-3 text-sm text-ink-500">
        {result.total} product{result.total === 1 ? '' : 's'} in this category
      </p>

      <div className="mt-6">
        {result.products.length === 0 ? (
          <EmptyState
            title="Nothing here just yet"
            body={`We do not have any ${category.name.toLowerCase()} listed right now. Browse the rest of the range, or message us to ask what is coming in.`}
          />
        ) : (
          <>
            <ProductGrid products={result.products} priorityCount={4} />
            <Pagination
              page={page}
              totalPages={result.totalPages}
              buildHref={buildHref}
              className="mt-8"
            />
          </>
        )}
      </div>
    </div>
  );
}
