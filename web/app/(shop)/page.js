import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  MessageCircle,
  Sparkles,
  Trophy,
  Heart,
  Star,
  Zap,
} from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';
import CategoryRail, { SectionHeading } from '@/components/CategoryRail';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getHomepageData } from '@/lib/api';
import { store, has, media } from '@/lib/config';
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
 * The gradient is the default and paints from the first HTML chunk, which keeps
 * the LCP element a heading rather than a download - the single biggest thing
 * this page can do for a 4G mobile visitor. Festive artwork is layered on top
 * only when one is configured, as a CSS background so a missing or slow file
 * degrades to the gradient instead of a broken image or a blank hero.
 */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-200 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900">
      {media.heroBackground && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ backgroundImage: `url(${media.heroBackground})` }}
        />
      )}

      {/* Keeps body text legible whatever the artwork behind it. */}
      {media.heroBackground && (
        <div
          aria-hidden="true"
          // Shades only the side the copy sits on. A full-width scrim would
          // mute the artwork it is there to sit on top of.
          className="absolute inset-0 bg-gradient-to-r from-brand-950/75 from-10% via-brand-950/20 via-45% to-transparent to-70%"
        />
      )}

      <div className="relative container-page py-12 sm:py-16 lg:py-20">
        {/* Only split into two columns when there is artwork to fill the
            second one, otherwise the hero reads as a half-empty band. */}
        <div
          className={`grid items-center gap-10 ${media.heroArtwork ? 'lg:grid-cols-2' : ''}`}
        >
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold-200 ring-1 ring-inset ring-white/20">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              Festive season collection
            </p>

            <h1 className="mt-4 text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-5xl">
              Light Up
              <br />
              Happiness Together
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
              Premium quality crackers at attractive prices. Browse the full range, build
              your list, and send it to us on WhatsApp - we will confirm availability and
              the final amount.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="btn bg-gold-300 px-6 font-semibold text-brand-950 hover:bg-gold-200"
              >
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

          {media.heroArtwork && (
            <div className="hidden lg:block">
              {/* Decorative: the heading already carries the message, so alt is
                  empty rather than repeating it to a screen reader. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.heroArtwork}
                alt=""
                width={640}
                height={480}
                className="ml-auto w-full max-w-xl drop-shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const HERO_ASSURANCES = [
  { icon: Trophy, label: 'Best Quality' },
  { icon: Tag, label: 'Fair Prices' },
  { icon: MessageCircle, label: 'WhatsApp Orders' },
  { icon: ShieldCheck, label: 'Safe & Secure' },
];

/** Narrow reassurance bar directly under the hero. */
function AssuranceBar() {
  return (
    <div className="border-b border-white/10 bg-brand-950">
      <ul className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-3 sm:gap-x-12">
        {HERO_ASSURANCES.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2 text-sm font-medium text-brand-50">
            <Icon className="h-4 w-4 shrink-0 text-gold-300" strokeWidth={2} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
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

const MOMENTS = [
  { icon: Zap, label: 'Fast & Easy Orders' },
  { icon: ShieldCheck, label: 'Quality Assured' },
  { icon: Heart, label: 'Trusted by Families' },
  { icon: Star, label: 'Wide Range' },
];

/**
 * Closing band. Deliberately claim-free: every line restates how ordering here
 * works rather than promising anything the shop has not committed to.
 */
function MomentsSection() {
  return (
    <section className="relative isolate bg-brand-50/60 py-12" aria-labelledby="moments-heading">
      {/* Stretched to fit rather than tiled: this band is close to the
          artwork's own proportions, so the ornaments stay in the corners where
          they were drawn, framing the four items. Portrait and landscape crops
          swap at `lg` so each device downloads only the one it shows. */}
      {media.momentsBackgroundMobile && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[length:100%_100%] bg-no-repeat lg:hidden"
          style={{ backgroundImage: `url(${media.momentsBackgroundMobile})` }}
        />
      )}
      {media.momentsBackground && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 bg-[length:100%_100%] bg-no-repeat ${
            media.momentsBackgroundMobile ? 'hidden lg:block' : ''
          }`}
          style={{ backgroundImage: `url(${media.momentsBackground})` }}
        />
      )}

      <div className="container-page text-center">
        <h2 id="moments-heading" className="text-2xl font-bold text-ink-950 sm:text-3xl">
          Celebrate Every Moment
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-600">
          From sparklers to sky-high rockets, find what you need for the celebration at{' '}
          {store.name}.
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {MOMENTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-2.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-700 ring-1 ring-brand-200">
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-ink-900">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const { featured, categories, announcements, stripSettings, degraded } =
    await getHomepageData();

  return (
    <>
      <Hero />
      <AssuranceBar />

      <OffersMarquee
        products={featured}
        announcements={announcements}
        settings={stripSettings}
      />

      {degraded && (
        <div className="container-page pt-4">
          <p className="rounded-card border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-ink-700">
            We are having trouble loading the catalogue right now. Please refresh in a
            moment, or contact us directly and we will help you place your order.
          </p>
        </div>
      )}

      {/* Warm band behind the browsing sections, as in the reference design.
          The tint stays underneath the artwork so the band keeps its colour if
          the image is swapped out or fails to load. */}
      {(categories.length > 0 || featured.length > 0) && (
        <div className="relative isolate bg-brand-50/50">
          {/*
            Tiled down the band at full width and natural height.
            Stretching one copy over the whole section puts its ornaments in the
            four corners only, leaving the middle - where most of the products
            actually sit - bare. Repeating instead brings the decoration back
            every tile, so the pattern continues however far the grid grows, and
            the artwork's own light top and bottom edges keep the joins soft.
          */}
          {media.browseBackground && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[length:100%_auto] bg-top bg-repeat-y"
              style={{ backgroundImage: `url(${media.browseBackground})` }}
            />
          )}
          {categories.length > 0 && (
            <section
              className="container-page py-8 sm:py-10"
              aria-labelledby="categories-heading"
            >
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
            <section
              className="container-page py-8 sm:py-10"
              aria-labelledby="featured-heading"
            >
              <SectionHeading
                id="featured-heading"
                title="Featured this season"
                subtitle="Popular picks from across the range"
                href="/products?sort=popular"
              />
              {/*
                One row only - "View all" carries anyone who wants the rest.
                Only the first four cards are marked priority; they are the ones
                visible above the fold in a two-column mobile grid.
              */}
              <ProductGrid products={featured} priorityCount={4} singleRow />
            </section>
          )}
        </div>
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

      <MomentsSection />

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
