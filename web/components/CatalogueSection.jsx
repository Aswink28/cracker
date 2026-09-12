import Link from 'next/link';
import { BookOpen, Download, ArrowRight, FileText } from 'lucide-react';
import WhatsAppButton from './WhatsAppButton';
import { store, has, media } from '@/lib/config';

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
    <section
      className="relative overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900"
      aria-labelledby="catalogue-heading"
    >
      {/*
        Two crops of the same scene rather than one image scaled down. The wide
        version places its subject far right, which a phone-width viewport would
        crop away entirely; the portrait version recomposes it above the copy.
        Swapped with display classes so each viewport downloads only its own.
      */}
      {media.catalogueBackgroundMobile && (
        <div
          aria-hidden="true"
          // Anchored to the top, where the portrait crop is open sky - the
          // lamps and gift boxes sit low in the frame, under the copy.
          className="absolute inset-0 bg-cover bg-top lg:hidden"
          style={{ backgroundImage: `url(${media.catalogueBackgroundMobile})` }}
        />
      )}
      {media.catalogueBackground && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-cover bg-center ${
            media.catalogueBackgroundMobile ? 'hidden lg:block' : ''
          }`}
          style={{ backgroundImage: `url(${media.catalogueBackground})` }}
        />
      )}

      {/* Both crops are busy behind the copy, so a scrim carries the contrast:
          bottom-up on phones where text sits over the scene, left-weighted on
          desktop where the catalogue artwork occupies the right. */}
      {(media.catalogueBackground || media.catalogueBackgroundMobile) && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/55 to-brand-950/20 lg:bg-gradient-to-r lg:from-brand-950/80 lg:via-brand-950/40 lg:to-transparent"
        />
      )}

      <div className="relative container-page py-12 sm:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
          {/* Held to the left half so the copy never runs under the catalogue
              artwork sitting on the right of the banner. */}
          <div className="min-w-0 lg:max-w-[56%]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-200 ring-1 ring-inset ring-gold-300/30">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              Digital catalogue
            </span>

            <h2
              id="catalogue-heading"
              className="mt-3 text-2xl font-bold text-white sm:text-3xl"
            >
              Explore our new collection
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100 sm:text-base">
              The full range in one document - sparklers, flower pots, ground chakkars,
              rockets, fancy items, gift boxes and combo packs, with pack sizes and
              current prices. Handy for planning a large order or sharing with family
              before you decide.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {hasCatalogue ? (
                <a
                  href={catalogueUrl}
                  // Opened in a new tab rather than relying on `download`, which
                  // browsers ignore for cross-origin files such as a Cloudinary PDF.
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-gold-300 px-6 font-semibold text-brand-950 hover:bg-gold-200"
                >
                  <Download className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                  Download catalogue
                </a>
              ) : (
                has.whatsapp && (
                  <WhatsAppButton
                    label="Request the catalogue"
                    className="bg-gold-300 px-6 font-semibold text-brand-950 hover:bg-gold-200"
                  />
                )
              )}

              <Link
                href="/products"
                // px-5 matches btn-secondary: the `btn` utility itself sets no
                // horizontal padding, so a bare `btn` leaves text on the border.
                className="btn border border-white/30 bg-white/5 px-5 text-white hover:bg-white/15"
              >
                Browse online
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>

            {!hasCatalogue && (
              <p className="mt-3 text-xs text-brand-200">
                Message us and we will send the latest {store.name} price list straight to
                your WhatsApp.
              </p>
            )}
          </div>

          {/*
            A separate cover image, or a CSS-only document stack, for when the
            band has no artwork of its own. Suppressed once a background is in
            place: these banners already carry the catalogue on the right, and
            drawing another one would sit a second book beside the first.
          */}
          {(media.catalogueCover || !media.catalogueBackground) && (
            <div aria-hidden="true" className="hidden shrink-0 lg:block">
              {media.catalogueCover ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={media.catalogueCover}
                  alt=""
                  width={320}
                  height={320}
                  className="w-72 drop-shadow-2xl"
                />
              ) : (
                <div className="relative h-40 w-32">
                  <div className="absolute inset-0 rotate-6 rounded-lg border border-white/20 bg-white/10" />
                  <div className="absolute inset-0 -rotate-3 rounded-lg border border-white/20 bg-white/10" />
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-gold-300/40 bg-brand-950/40 text-gold-200">
                    <FileText className="h-12 w-12" strokeWidth={1.4} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
