'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { generalEnquiryUrl } from '@/lib/whatsapp';
import { store, has } from '@/lib/config';
import { useCart } from '@/hooks/useCart';

/**
 * Always-visible WhatsApp button, bottom-right.
 *
 * On phones it lifts above the sticky cart bar when that bar is showing, so
 * the two never overlap. It is hidden inside /admin, where it is noise.
 */
export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const { totalQuantity, hydrated } = useCart();

  if (!has.whatsapp) return null;
  if (pathname.startsWith('/admin')) return null;

  const cartBarVisible = hydrated && totalQuantity > 0 && pathname !== '/cart';

  function handleClick(event) {
    event.preventDefault();
    window.open(generalEnquiryUrl(), '_blank', 'noopener,noreferrer');
  }

  return (
    <a
      href={`https://wa.me/${store.whatsapp}`}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${store.name} on WhatsApp`}
      className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      style={{
        // Clears the sticky cart bar on mobile, and the iPhone home indicator.
        bottom: cartBarVisible
          ? 'calc(4.75rem + env(safe-area-inset-bottom, 0px))'
          : 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <MessageCircle className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
      {/* Gentle attention pulse, disabled under prefers-reduced-motion by the
          global rule in globals.css. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25d366] opacity-20"
      />
    </a>
  );
}
