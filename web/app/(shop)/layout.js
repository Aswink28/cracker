import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StickyCartBar from '@/components/StickyCartBar';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import ChakraLoader from '@/components/ChakraLoader';
import JsonLd from '@/components/JsonLd';
import { getCategories } from '@/lib/api';
import { localBusinessJsonLd, websiteJsonLd } from '@/lib/seo';

/**
 * Storefront chrome. Everything customer-facing renders inside this; /admin
 * sits outside the group and gets its own shell.
 */
export default async function ShopLayout({ children }) {
  // Needed by both the header drawer and the footer. Fetched once here, cached
  // by tag, and shared - not refetched per component.
  let categories = [];
  try {
    categories = await getCategories();
  } catch (error) {
    // The shell must render even if the API is down, so the customer can still
    // see contact details and reach WhatsApp.
    console.error('Layout: categories unavailable -', error.message);
  }

  return (
    <>
      <JsonLd data={[websiteJsonLd(), localBusinessJsonLd()]} />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <Header categories={categories} />

      <main id="main" className="flex-1">
        {children}
      </main>

      <Footer categories={categories} />

      <StickyCartBar />
      <FloatingWhatsApp />

      {/* Reads searchParams to detect a completed navigation, so it needs a
          Suspense boundary of its own. Kept here rather than around the page,
          where it would make routes stream and break notFound() status codes. */}
      <Suspense fallback={null}>
        <ChakraLoader />
      </Suspense>
    </>
  );
}
