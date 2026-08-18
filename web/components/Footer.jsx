import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Sparkles } from 'lucide-react';
import { store, has } from '@/lib/config';
import WhatsAppButton from './WhatsAppButton';

/**
 * Footer. Server component - it renders only configured contact details, so a
 * shop that has not set an address simply does not get an address block rather
 * than an empty or invented one.
 */
export default function Footer({ categories = [] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-ink-200 bg-white">
      <div className="container-page py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Identity */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">
                <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="text-lg font-bold text-ink-950">{store.name}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              A catalogue of sparklers, flower pots, ground chakkars, rockets and gift
              boxes. Browse the range, build your list and send it to us on WhatsApp -
              we will confirm availability and the final amount.
            </p>

            {has.whatsapp && <WhatsAppButton className="mt-4 w-full sm:w-auto" />}
          </div>

          {/* Navigation */}
          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="text-sm font-semibold text-ink-950">
              Explore
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'All Products' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
                { href: '/cart', label: 'Your Cart' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-9 items-center text-ink-600 hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categories */}
          {categories.length > 0 && (
            <nav aria-labelledby="footer-categories">
              <h2 id="footer-categories" className="text-sm font-semibold text-ink-950">
                Categories
              </h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {categories.slice(0, 8).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="flex min-h-9 items-center text-ink-600 hover:text-brand-700"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold text-ink-950">Get in touch</h2>
            <ul className="mt-3 flex flex-col gap-3 text-sm text-ink-600">
              {has.phone && (
                <li className="flex gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <a
                    href={`tel:${store.phone}`}
                    className="inline-flex min-h-9 items-center hover:text-brand-700"
                  >
                    {store.phone}
                  </a>
                </li>
              )}
              {has.email && (
                <li className="flex gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <a
                    href={`mailto:${store.email}`}
                    className="inline-flex min-h-9 items-center break-all hover:text-brand-700"
                  >
                    {store.email}
                  </a>
                </li>
              )}
              {has.address && (
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <address className="not-italic">{store.address}</address>
                </li>
              )}
              {has.hours && (
                <li className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
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
        <div className="mt-10 rounded-card border border-warning-500/30 bg-warning-50 p-4">
          <h2 className="text-sm font-semibold text-ink-950">Safety first</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-700">
            Fireworks carry inherent risk. Purchase and use them only where local law
            permits, follow the manufacturer&apos;s instructions on every pack, keep them
            away from children unless an adult is supervising, use them only in a suitable
            open area, and keep water or sand within reach.{' '}
            <Link href="/about#safety" className="font-medium text-brand-700 underline">
              Read the full safety guidance
            </Link>
            .
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-ink-200 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
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
