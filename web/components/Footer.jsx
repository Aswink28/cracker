import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Sparkles, MessageCircle } from 'lucide-react';
import { store, has, social, media } from '@/lib/config';
import WhatsAppButton from './WhatsAppButton';

/**
 * Brand marks are inline SVG because lucide-react dropped its social icons;
 * importing them would fail the build. Each link renders only when its URL is
 * configured, so the row is simply absent rather than linking nowhere.
 */
const SOCIALS = [
  {
    key: 'facebook',
    label: 'Facebook',
    path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.4A6.4 6.4 0 1 0 18.4 12 6.4 6.4 0 0 0 12 5.6zm0 10.6A4.2 4.2 0 1 1 16.2 12 4.2 4.2 0 0 1 12 16.2zm6.6-10.9a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5z',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    path: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.2V8.8l5.2 3.2z',
  },
];

function SocialLinks() {
  const links = SOCIALS.filter((item) => social[item.key]);
  if (links.length === 0) return null;

  return (
    <ul className="mt-4 flex items-center gap-2">
      {links.map((item) => (
        <li key={item.key}>
          <a
            href={social[item.key]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white transition-colors hover:bg-brand-800"
            aria-label={`${store.name} on ${item.label}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d={item.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Footer. Server component - it renders only configured contact details, so a
 * shop that has not set an address simply does not get an address block rather
 * than an empty or invented one.
 */
export default function Footer({ categories = [] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-12 overflow-hidden bg-brand-950 text-brand-100">
      {/*
        Portrait and landscape crops of the same scene, swapped by breakpoint so
        each device downloads only the one it shows. On a phone the footer is a
        tall stack of columns, which the wide banner would have to crop to a
        narrow slice; the portrait version keeps its mandalas and lamp intact.
      */}
      {media.footerBackgroundMobile && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-top lg:hidden"
          style={{ backgroundImage: `url(${media.footerBackgroundMobile})` }}
        />
      )}
      {media.footerBackground && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-cover bg-center ${
            media.footerBackgroundMobile ? 'hidden lg:block' : ''
          }`}
          style={{ backgroundImage: `url(${media.footerBackground})` }}
        />
      )}
      {/* The artwork is busiest at its edges, where the link columns sit, so the
          scrim is flat rather than directional. */}
      {(media.footerBackground || media.footerBackgroundMobile) && (
        <div aria-hidden="true" className="absolute inset-0 bg-brand-950/75" />
      )}

      <div className="relative container-page py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Identity */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              {media.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={media.logo}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 object-contain"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">
                  <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
              )}
              <span>
                <span className="block text-lg font-bold text-white">{store.name}</span>
                <span className="block text-xs text-brand-200">{store.tagline}</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand-200">
              A catalogue of sparklers, flower pots, ground chakkars, rockets and gift
              boxes. Browse the range, build your list and send it to us on WhatsApp -
              we will confirm availability and the final amount.
            </p>

            <SocialLinks />
          </div>

          {/* Quick links */}
          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="text-sm font-semibold text-white">
              Quick Links
            </h2>
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'Products' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
                { href: '/cart', label: 'Your Cart' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-9 items-center text-brand-200 hover:text-gold-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/*
            Customer support.
            Every entry points at something that actually exists on this site.
            A "Returns & Refunds" link is deliberately absent: the shop has no
            published returns policy, and linking to one would promise the
            customer a commitment nobody has made.
          */}
          <nav aria-labelledby="footer-support">
            <h2 id="footer-support" className="text-sm font-semibold text-white">
              Customer Support
            </h2>
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {[
                { href: '/#faq-heading', label: 'FAQs' },
                { href: '/about#how-heading', label: 'How ordering works' },
                { href: '/about#safety', label: 'Safety guidance' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-9 items-center text-brand-200 hover:text-gold-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {has.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${store.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-9 items-center text-brand-200 hover:text-gold-200"
                  >
                    Order on WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold text-white">Contact Us</h2>
            <ul className="mt-3 flex flex-col gap-3 text-sm text-brand-200">
              {/*
                Centred rather than top-aligned: these rows pair a 16px icon
                with a 36px touch target, so aligning to the top leaves the icon
                floating above the text it labels.
              */}
              {has.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  <a
                    href={`tel:${store.phone}`}
                    className="inline-flex min-h-9 items-center hover:text-gold-200"
                  >
                    {store.phone}
                  </a>
                </li>
              )}
              {has.whatsapp && (
                <li className="flex items-center gap-2">
                  <MessageCircle
                    className="h-4 w-4 shrink-0 text-gold-300"
                    aria-hidden="true"
                  />
                  <a
                    href={`https://wa.me/${store.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center hover:text-gold-200"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
              )}
              {has.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  <a
                    href={`mailto:${store.email}`}
                    className="inline-flex min-h-9 items-center break-all hover:text-gold-200"
                  >
                    {store.email}
                  </a>
                </li>
              )}
              {has.address && (
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  <address className="not-italic">{store.address}</address>
                </li>
              )}
              {has.hours && (
                <li className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  <span>{store.hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/*
          Required safety framing. Deliberately worded as "follow the law and
          the instructions" - never as a claim that fireworks are safe.
        */}
        <div className="mt-10 rounded-card border border-gold-300/25 bg-brand-950/50 p-4">
          <h2 className="text-sm font-semibold text-white">Safety first</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-200">
            Fireworks carry inherent risk. Purchase and use them only where local law
            permits, follow the manufacturer&apos;s instructions on every pack, keep them
            away from children unless an adult is supervising, use them only in a suitable
            open area, and keep water or sand within reach.{' '}
            <Link href="/about#safety" className="font-medium text-gold-200 underline">
              Read the full safety guidance
            </Link>
            .
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {store.name}. All rights reserved.
          </p>
          <p>
            Prices are indicative and confirmed over WhatsApp. This site does not process
            online payments.
          </p>
        </div>
      </div>
    </footer>
  );
}
