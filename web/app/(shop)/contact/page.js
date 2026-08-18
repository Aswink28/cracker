import { Phone, Mail, MapPin, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import WhatsAppButton from '@/components/WhatsAppButton';
import { store, has } from '@/lib/config';
import { buildMetadata, breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact Us',
  description:
    `Get in touch with ${store.name}. Message us on WhatsApp or call to ask about ` +
    'availability, pricing and pickup or delivery for your crackers order.',
  path: '/contact',
});

const TRAIL = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
];

export default function ContactPage() {
  // Every contact channel is optional. A shop that has not configured an
  // address gets no address card rather than an invented one.
  const channels = [
    has.whatsapp && {
      key: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      value: 'Send us your order or a question',
      node: <WhatsAppButton label="Open WhatsApp" className="mt-3 w-full sm:w-auto" />,
    },
    has.phone && {
      key: 'phone',
      icon: Phone,
      label: 'Phone',
      value: store.phone,
      node: (
        <a href={`tel:${store.phone}`} className="btn-secondary mt-3 w-full sm:w-auto">
          Call Now
        </a>
      ),
    },
    has.email && {
      key: 'email',
      icon: Mail,
      label: 'Email',
      value: store.email,
      node: (
        <a href={`mailto:${store.email}`} className="btn-secondary mt-3 w-full sm:w-auto">
          Send Email
        </a>
      ),
    },
    has.address && {
      key: 'address',
      icon: MapPin,
      label: 'Address',
      value: store.address,
      node: has.maps ? (
        <a
          href={store.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-3 w-full sm:w-auto"
        >
          Open in Maps
          <ExternalLink className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </a>
      ) : null,
    },
    has.hours && {
      key: 'hours',
      icon: Clock,
      label: 'Business hours',
      value: store.hours,
      node: null,
    },
  ].filter(Boolean);

  return (
    <div className="container-page py-6 sm:py-8">
      <JsonLd data={[breadcrumbJsonLd(TRAIL), localBusinessJsonLd()]} />
      <Breadcrumbs trail={TRAIL} className="mb-3" />

      <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">Contact {store.name}</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-700">
        The quickest way to reach us is WhatsApp - send your list or your question and we
        will reply with availability and the final amount. You are welcome to call as well.
      </p>

      {channels.length === 0 ? (
        <p className="mt-8 rounded-card border border-warning-500/30 bg-warning-50 p-4 text-sm text-ink-700">
          Contact details have not been configured for this store yet.
        </p>
      ) : (
        <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          {channels.map((channel) => (
            <div
              key={channel.key}
              className="flex flex-col rounded-card border border-ink-200 bg-white p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <channel.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-ink-950">{channel.label}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed break-words text-ink-600">
                {channel.value}
              </p>
              {channel.node}
            </div>
          ))}
        </div>
      )}

      <section className="mt-10 max-w-3xl" aria-labelledby="ordering-heading">
        <h2 id="ordering-heading" className="text-xl font-bold text-ink-950">
          How to place an order
        </h2>
        <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-ink-700">
          <li>Browse the catalogue and add the items you want to your cart.</li>
          <li>Open your cart and enter your name, mobile number and pickup or delivery.</li>
          <li>Tap &quot;Order via WhatsApp&quot; - your full order is written out for you.</li>
          <li>Send the message. We confirm availability and the final amount.</li>
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-ink-600">
          This website does not process online payments. Nothing is charged here, and no
          card or UPI details are ever collected.
        </p>
      </section>
    </div>
  );
}
