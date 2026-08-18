import Link from 'next/link';
import { BookOpen, Download, ArrowRight, FileText } from 'lucide-react';
import WhatsAppButton from './WhatsAppButton';
import { store, has } from '@/lib/config';

/**
 * Digital catalogue block.
 *
 * The download only appears when NEXT_PUBLIC_CATALOGUE_URL actually points at a
 * file. Rendering a dead "Download" button when no catalogue has been uploaded
 * would be worse than not offering one, so the WhatsApp request path is shown
 * instead until the shop provides the PDF.
 */
export default function CatalogueSection() {
  const catalogueUrl = process.env.NEXT_PUBLIC_CATALOGUE_URL?.trim() || '';
  const hasCatalogue = Boolean(catalogueUrl);

  return (
    <section className="container-page py-10" aria-labelledby="catalogue-heading">
      <div className="overflow-hidden rounded-card border border-ink-200 bg-white">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-800">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              Digital catalogue
            </span>

            <h2 id="catalogue-heading" className="mt-3 text-xl font-bold text-ink-950 sm:text-2xl">
              Explore our new collection
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600 sm:text-base">
              The full range in one document - sparklers, flower pots, ground chakkars,
              rockets, fancy items, gift boxes and combo packs, with pack sizes and
              current prices. Handy for planning a large order or sharing with family
              before you decide.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {hasCatalogue ? (
                <a
                  href={catalogueUrl}
                  // Opened in a new tab rather than relying on `download`, which
                  // browsers ignore for cross-origin files such as a Cloudinary PDF.
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <Download className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                  Download catalogue
                </a>
              ) : (
                has.whatsapp && <WhatsAppButton label="Request the catalogue" />
              )}

              <Link href="/products" className="btn-secondary">
                Browse online
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>

            {!hasCatalogue && (
              <p className="mt-3 text-xs text-ink-500">
                Message us and we will send the latest {store.name} price list straight to
                your WhatsApp.
              </p>
            )}
          </div>

          {/* Decorative document stack - CSS only, so it costs no image request. */}
          <div aria-hidden="true" className="hidden shrink-0 lg:block">
            <div className="relative h-40 w-32">
              <div className="absolute inset-0 rotate-6 rounded-lg border border-ink-200 bg-ink-100" />
              <div className="absolute inset-0 -rotate-3 rounded-lg border border-ink-200 bg-white" />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-700">
                <FileText className="h-12 w-12" strokeWidth={1.4} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
