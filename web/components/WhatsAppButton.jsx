'use client';

import { MessageCircle } from 'lucide-react';
import { generalEnquiryUrl, productEnquiryUrl } from '@/lib/whatsapp';
import { store, has } from '@/lib/config';
import { cn } from '@/lib/format';

/**
 * Opens a WhatsApp chat with the shop.
 *
 * The href is built on click rather than at render time because
 * buildWhatsAppUrl inspects the viewport to choose between wa.me and
 * web.whatsapp.com - doing that during render would produce a server/client
 * mismatch.
 */
export default function WhatsAppButton({
  product = null,
  label = 'WhatsApp Us',
  className,
  variant = 'solid',
}) {
  if (!has.whatsapp) return null;

  function handleClick(event) {
    event.preventDefault();
    const url = product ? productEnquiryUrl(product) : generalEnquiryUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const base =
    variant === 'outline'
      ? 'btn border border-[#128c7e] bg-white px-5 text-[#0b5f56] hover:bg-[#f0faf8]'
      : 'btn-whatsapp';

  return (
    <a
      href={`https://wa.me/${store.whatsapp}`}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(base, className)}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
      {label}
    </a>
  );
}
