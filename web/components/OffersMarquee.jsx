import { Tag, Sparkles, Truck, Gift } from 'lucide-react';
import { formatPrice, discountPercent, effectivePrice } from '@/lib/format';
import { iconFor } from '@/lib/announcementIcons';

const STATIC_NOTES = [
  { Icon: Truck, text: 'Pickup or delivery - your choice' },
  { Icon: Gift, text: 'Gift boxes and combo packs available' },
  { Icon: Sparkles, text: 'Order on WhatsApp, no online payment' },
];

/**
 * Continuously scrolling offers strip.
 *
 * Scrolls on its own, with no visible control. Two ways to stop it remain:
 * `prefers-reduced-motion: reduce` pauses it from the stylesheet, with no
 * flash of movement first because the initial state is decided in CSS rather
 * than in an effect, and hovering the strip pauses it so a passing offer can
 * be read.
 *
 * Worth knowing: WCAG 2.2.2 (Pause, Stop, Hide) asks for a control that stops
 * motion lasting more than five seconds. Hover is not one - it is unavailable
 * on touch and to keyboard users - so this is a deliberate accepted gap, not
 * an oversight. Restoring it means putting the toggle back.
 *
 * Content is admin-authored messages first, then whatever products actually
 * carry a real discount, falling back to factual service notes if there is
 * neither. Nothing here invents a promotion: every discount shown is computed
 * from a product's own price, and every message was written in the panel.
 */
export default function OffersMarquee({
  products = [],
  announcements = [],
  settings = { enabled: true, showProductOffers: true },
}) {
  const offers = (settings.showProductOffers === false ? [] : products)
    .filter((p) => discountPercent(p) > 0)
    .slice(0, 10)
    .map((p) => ({
      key: p.id,
      discount: discountPercent(p),
      name: p.name,
      price: formatPrice(effectivePrice(p)),
      was: formatPrice(p.price),
    }));

  // Admin messages reuse the same shape as the static notes, so they render
  // through the existing icon-and-text branch without special-casing.
  const promos = announcements.slice(0, 10).map((a) => ({
    key: `promo-${a.id}`,
    note: { Icon: iconFor(a.icon), text: a.text },
  }));

  const items =
    promos.length + offers.length > 0
      ? [...promos, ...offers]
      : STATIC_NOTES.map((n, i) => ({ key: `note-${i}`, note: n }));

  // Switched off in the admin panel: no bar, and no service-note fallback
  // either. This sits below the hooks so their order never changes between
  // renders. Turning the strip off is the only way to remove it entirely -
  // with it on, an empty strip falls back to the notes rather than rendering
  // a bare coloured bar.
  if (settings.enabled === false) return null;

  return (
    <div className="relative border-y border-brand-800/30 bg-brand-800">
      <div className="group flex overflow-hidden py-2.5" aria-label="Current offers">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            // The second copy is a visual duplicate that makes the loop seamless;
            // announcing it would read every offer twice.
            aria-hidden={copy === 1}
            data-motion="marquee"
            className="flex shrink-0 animate-marquee items-center gap-8 pr-8 group-hover:[animation-play-state:paused]"
          >
            {items.map((item) => (
              <li
                key={`${copy}-${item.key}`}
                className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-brand-50"
              >
                {item.note ? (
                  <>
                    <item.note.Icon
                      className="h-4 w-4 shrink-0 text-gold-300"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>{item.note.text}</span>
                  </>
                ) : (
                  <>
                    <Tag
                      className="h-4 w-4 shrink-0 text-gold-300"
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-gold-200">{item.discount}% OFF</span>
                    <span>{item.name}</span>
                    <span className="font-semibold">{item.price}</span>
                    <span className="text-brand-200 line-through">{item.was}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>

    </div>
  );
}
