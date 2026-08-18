import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Tag, MessageCircle } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';
import CategoryRail, { SectionHeading } from '@/components/CategoryRail';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getHomepageData } from '@/lib/api';
import { store, has } from '@/lib/config';
import OffersMarquee from '@/components/OffersMarquee';
import CatalogueSection from '@/components/CatalogueSection';
import FaqSection from '@/components/FaqSection';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: `${store.name} | Quality Crackers at Best Prices`,
  description:
    'Explore quality crackers, sparklers, flower pots, ground chakkars, rockets and ' +
    'festive gift boxes. Browse the catalogue, add what you need and send your order ' +
    'to us on WhatsApp for confirmation.',
  path: '/',
});

/**
 * Hero.
 *
 * Type and a CSS gradient only - no background image or video. That makes the
 * LCP element a heading the browser can paint from the first HTML chunk, which
 * is the single biggest thing this page can do for a 4G mobile visitor.
 */
function Hero() {
  return (
    <section className="border-b border-ink-200 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900">
      <div className="container-page py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold-200 ring-1 ring-inset ring-white/20">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-300" aria-hidden="true" />
            Festive season collection
          </p>

          <h1 className="mt-4 text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-5xl">
            Celebrate Bright.
            <br />
            Celebrate Together.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
            Premium quality crackers at attractive prices. Browse the full range, build
            your list, and send it to us on WhatsApp - we will confirm availability and
            the final amount.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/products" className="btn bg-white px-6 text-brand-800 hover:bg-gold-50">
              Shop Now
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            </Link>

            {has.whatsapp && (
              <WhatsAppButton
                label="WhatsApp Us"
                className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const TRUST_POINTS = [
  {
    icon: Tag,
    title: 'Clear pricing',
    body: 'Every item lists its price and any offer up front. No hidden charges added later.',
  },
  {
    icon: MessageCircle,
    title: 'Order on WhatsApp',
    body: 'Build your list here and send it in one tap. No account, no online payment.',
  },
  {
    icon: Truck,
    title: 'Pickup or delivery',
    body: 'Choose what suits you. We confirm the details with you before dispatch.',
  },
  {
    icon: ShieldCheck,
    title: 'Handled with care',
    body: 'Products are packed for transport and supplied with the manufacturer instructions.',
  },
];

export default async function HomePage() {
  const { featured, categories, degraded } = await getHomepageData();

  return (
    <>
      <Hero />

      <OffersMarquee products={featured} />

      {degraded && (
        <div className="container-page pt-4">
          <p className="rounded-card border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-ink-700">
            We are having trouble loading the catalogue right now. Please refresh in a
            moment, or contact us directly and we will help you place your order.
          </p>
        </div>
      )}

      {categories.length > 0 && (
        <section className="container-page py-8 sm:py-10" aria-labelledby="categories-heading">
          <SectionHeading
            id="categories-heading"
            title="Shop by category"
            subtitle="Find exactly what you need for the celebration"
            href="/products"
            linkLabel="All products"
          />
          <CategoryRail categories={categories} />
        </section>
      )}

      {featured.length > 0 && (
        <section className="container-page py-8 sm:py-10" aria-labelledby="featured-heading">
          <SectionHeading
            id="featured-heading"
            title="Featured this season"
            subtitle="Popular picks from across the range"
            href="/products?sort=popular"
          />
          {/*
            Only the first four cards are marked priority - they are the ones
            visible above the fold in a two-column mobile grid.
          */}
          <ProductGrid products={featured} priorityCount={4} />
        </section>
      )}

      {/* Trust signals */}
      <section className="border-y border-ink-200 bg-white py-10" aria-labelledby="why-heading">
        <div className="container-page">
          <h2 id="why-heading" className="text-xl font-bold text-ink-950 sm:text-2xl">
            Why order from {store.name}
          </h2>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3 rounded-card border border-ink-200 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <point.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink-950">{point.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-600">
                    {point.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CatalogueSection />

      <FaqSection />

      {/* Closing call to action */}
      <section className="container-page py-12">
        <div className="rounded-card border border-ink-200 bg-white p-6 text-center sm:p-10">
          <h2 className="text-xl font-bold text-ink-950 sm:text-2xl">
            Ready to place your order?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-600 sm:text-base">
            Add what you need to your cart and send the list to us on WhatsApp. We will
            confirm availability, the final amount and how you would like to collect it.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/products" className="btn-primary">
              Browse Products
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            </Link>
            {has.whatsapp && <WhatsAppButton variant="outline" />}
            {has.phone && (
              <a href={`tel:${store.phone}`} className="btn-secondary">
                Call Now
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
