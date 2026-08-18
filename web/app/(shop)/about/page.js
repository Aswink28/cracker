import Link from 'next/link';
import { ShieldAlert, MessageCircle, Tag, Boxes } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import WhatsAppButton from '@/components/WhatsAppButton';
import { store, has } from '@/lib/config';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About Us',
  description:
    `Learn how ordering works at ${store.name} - browse the crackers catalogue, ` +
    'build your list, and send it to us on WhatsApp. Includes our fireworks safety guidance.',
  path: '/about',
});

const TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
];

const STEPS = [
  {
    icon: Boxes,
    title: 'Browse the catalogue',
    body: 'Every product lists its price, any current offer and what the pack contains. Filter by category or price to narrow things down.',
  },
  {
    icon: Tag,
    title: 'Build your list',
    body: 'Add items to your cart and adjust the quantities. Your cart is saved on your own device, so you can come back to it later.',
  },
  {
    icon: MessageCircle,
    title: 'Send it on WhatsApp',
    body: 'Enter your name, mobile number and whether you want pickup or delivery. One tap opens WhatsApp with the whole order written out.',
  },
  {
    icon: ShieldAlert,
    title: 'We confirm with you',
    body: 'We check availability, confirm the final amount and agree how you would like to collect or receive it. Payment is handled directly with us.',
  },
];

export default function AboutPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <JsonLd data={breadcrumbJsonLd(TRAIL)} />
      <Breadcrumbs trail={TRAIL} className="mb-3" />

      <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">About {store.name}</h1>

      <div className="mt-4 max-w-3xl">
        <p className="text-base leading-relaxed text-ink-700">
          {store.name} is a crackers and fireworks catalogue built around a simple idea:
          show you the full range and the real prices, then let you place the order the
          way most people already prefer - over WhatsApp.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink-700">
          There is no online payment, no account to create and no checkout to work
          through. You browse, you build a list, and you send it to us. We reply
          personally to confirm what is in stock and what the final amount comes to.
        </p>
      </div>

      {/* How ordering works */}
      <section className="mt-10" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-xl font-bold text-ink-950">
          How ordering works
        </h2>

        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-card border border-ink-200 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <step.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-950">
                  {index + 1}. {step.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-600">
                  {step.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* What we stock */}
      <section className="mt-10 max-w-3xl" aria-labelledby="range-heading">
        <h2 id="range-heading" className="text-xl font-bold text-ink-950">
          What we stock
        </h2>
        <p className="mt-3 leading-relaxed text-ink-700">
          Our range covers the categories most families look for during the festive
          season: hand-held sparklers in several lengths, ground chakkars, flower pots
          and anars, bottle and whistling rockets, fancy fountains and multi-shot display
          items, ready-assembled gift boxes, a low-noise kids collection, and larger
          combo packs that bundle several categories together.
        </p>
        <p className="mt-3 leading-relaxed text-ink-700">
          Prices shown on the site are indicative. Availability moves quickly during the
          season, which is exactly why we confirm every order personally before it is
          packed.
        </p>
        <Link href="/products" className="btn-primary mt-5">
          Browse the full range
        </Link>
      </section>

      {/* Safety - linked to from the footer */}
      <section id="safety" className="mt-12 max-w-3xl scroll-mt-24" aria-labelledby="safety-heading">
        <div className="rounded-card border border-warning-500/30 bg-warning-50 p-5 sm:p-6">
          <h2
            id="safety-heading"
            className="flex items-center gap-2 text-xl font-bold text-ink-950"
          >
            <ShieldAlert className="h-6 w-6 text-warning-700" strokeWidth={2} aria-hidden="true" />
            Safety first
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            Fireworks carry inherent risk and must be treated with respect. Please read
            and follow this guidance every time.
          </p>

          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-ink-700">
            <li>Follow all applicable local laws and regulations covering fireworks.</li>
            <li>Purchase and use fireworks only where it is legally permitted.</li>
            <li>Follow the manufacturer&apos;s safety instructions printed on every pack.</li>
            <li>Keep fireworks away from children unless a responsible adult is supervising.</li>
            <li>
              Use fireworks only in a suitable open area, well clear of buildings, vehicles,
              dry vegetation and overhead cables.
            </li>
            <li>Keep a bucket of water or sand within reach before lighting anything.</li>
            <li>Light one item at a time and move well back immediately.</li>
            <li>Never lean over a firework, and never relight one that has failed to ignite.</li>
            <li>Wear closely fitted cotton clothing rather than loose or synthetic fabric.</li>
            <li>Store fireworks in a cool, dry place away from heat and direct sunlight.</li>
            <li>Soak used fireworks in water before disposing of them.</li>
          </ul>

          <p className="mt-4 text-sm leading-relaxed font-medium text-ink-800">
            No firework can be described as completely safe. Please take these precautions
            seriously and celebrate responsibly.
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mt-10 max-w-3xl">
        <div className="rounded-card border border-ink-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink-950">Questions before you order?</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
            Ask us anything about the range, quantities for a group, or what is currently
            in stock.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {has.whatsapp && <WhatsAppButton />}
            <Link href="/contact" className="btn-secondary">
              Contact details
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
