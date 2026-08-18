import { ChevronDown } from 'lucide-react';
import JsonLd from './JsonLd';
import { store, has } from '@/lib/config';

/**
 * Frequently asked questions.
 *
 * Built on native <details>/<summary>: it expands with zero JavaScript, works
 * before hydration, and is keyboard accessible for free. A hand-rolled
 * accordion would ship JS to do the job worse.
 *
 * The FAQPage structured data is generated from this same array, so the rich
 * result can never drift from what visitors actually read.
 */
const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Add the items you want to your cart, open the cart, enter your name and mobile number, choose pickup or delivery, then tap "Order via WhatsApp". Your full order is written out for you - just send the message and we will reply to confirm.',
  },
  {
    q: 'Can I pay online on this website?',
    a: 'No. This site is a catalogue and ordering tool only. No card, UPI or online payment is ever collected here. Payment is arranged directly with us once your order is confirmed.',
  },
  {
    q: 'Are the prices on the site final?',
    a: 'Prices shown are indicative. Stock and pricing move quickly during the festive season, so we confirm the final amount over WhatsApp before anything is packed or dispatched.',
  },
  {
    q: 'Do you deliver, or do I collect?',
    a: 'Both. Choose pickup or delivery in the cart. If you choose delivery we will ask for your address, then confirm the timing and any delivery charge when we reply.',
  },
  {
    q: 'Is there a minimum order?',
    a: 'There is no minimum for pickup. For delivery it depends on your location, so please message us with your area and we will tell you exactly what applies.',
  },
  {
    q: 'How do I know what is in stock?',
    a: 'Items marked out of stock on the site are unavailable. For everything else we confirm availability when we reply to your WhatsApp order, because stock changes through the day in season.',
  },
  {
    q: 'Is it legal to buy and use fireworks where I live?',
    a: 'Rules on the sale, possession and use of fireworks vary by state and city, are often restricted to certain dates and hours, and can change at short notice. Please check the rules that apply where you live and use fireworks only where it is legally permitted.',
  },
  {
    q: 'How should fireworks be stored and handled safely?',
    a: 'Store them in a cool, dry place away from heat and direct sunlight. Use them only in a suitable open area, follow the instructions printed on each pack, keep children supervised by an adult, keep water or sand within reach, and never relight one that has failed to ignite. No firework is completely safe.',
  },
];

export default function FaqSection() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <section className="container-page py-10" aria-labelledby="faq-heading">
      <JsonLd data={faqJsonLd} />

      <h2 id="faq-heading" className="text-xl font-bold text-ink-950 sm:text-2xl">
        Frequently asked questions
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        Everything customers usually ask before ordering.
      </p>

      <ul className="mt-6 grid gap-3 lg:grid-cols-2">
        {FAQS.map((item) => (
          <li key={item.q}>
            <details className="group rounded-card border border-ink-200 bg-white open:border-brand-300">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-ink-950 [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-ink-500 transition-transform group-open:rotate-180"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-ink-600">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>

      {has.whatsapp && (
        <p className="mt-5 text-sm text-ink-600">
          Still unsure about something?{' '}
          <a
            href={`https://wa.me/${store.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-700 hover:underline"
          >
            Ask us on WhatsApp
          </a>
          .
        </p>
      )}
    </section>
  );
}
