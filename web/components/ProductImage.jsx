import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/format';

/**
 * Product image with a branded fallback.
 *
 * Products seeded before the owner uploads photography have no image, and a
 * broken-image icon on a commercial catalogue looks abandoned. The fallback is
 * pure CSS so it costs no request and cannot itself fail to load.
 *
 * `priority` must be set for the single largest above-the-fold image on a page
 * and left off everywhere else - it disables lazy loading and adds a preload
 * hint, so using it broadly would slow the page down rather than speed it up.
 */
export default function ProductImage({
  image,
  alt,
  sizes,
  priority = false,
  className,
  fill = true,
  width,
  height,
}) {
  if (!image?.url) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-1',
          'bg-gradient-to-br from-brand-50 to-gold-50 text-brand-300',
          className,
        )}
        aria-hidden="true"
      >
        <Sparkles className="h-8 w-8" strokeWidth={1.5} />
      </div>
    );
  }

  const common = {
    src: image.url,
    alt: alt || image.alt || '',
    priority,
    // Explicitly opt out of lazy loading only for the priority image.
    loading: priority ? 'eager' : 'lazy',
    className: cn('object-cover', className),
  };

  if (!fill) {
    return (
      <Image
        {...common}
        width={width ?? image.width ?? 800}
        height={height ?? image.height ?? 800}
        sizes={sizes}
      />
    );
  }

  return <Image {...common} fill sizes={sizes} />;
}
