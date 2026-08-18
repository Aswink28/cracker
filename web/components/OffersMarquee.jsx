'use client';

import { useEffect, useState } from 'react';
import { Tag, Sparkles, Truck, Gift, Pause, Play } from 'lucide-react';
import { formatPrice, discountPercent, effectivePrice } from '@/lib/format';

const STATIC_NOTES = [
  { Icon: Truck, text: 'Pickup or delivery - your choice' },
  { Icon: Gift, text: 'Gift boxes and combo packs available' },
  { Icon: Sparkles, text: 'Order on WhatsApp, no online payment' },
];

/**
 * Continuously scrolling offers strip.
 *
 * Motion is user-controllable, which an auto-scrolling marquee needs in order
 * to satisfy WCAG 2.2.2 (Pause, Stop, Hide). The default comes from the
 * operating system: `prefers-reduced-motion: reduce` pauses it via CSS, with
 * no flash of movement first, because the initial state is decided in the
 * stylesheet rather than in an effect. Pressing the button overrides that
 * default for the visit.
 *
 * Real discounts only - it renders whatever products actually carry an offer,
 * and falls back to factual service notes if none do. Nothing here invents a
 * promotion.
 */
export default function OffersMarquee({ products = [] }) {
  // null = follow the CSS/OS default. true/false = an explicit user choice.
  const [override, setOverride] = useState(null);
  const [systemPaused, setSystemPaused] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setSystemPaused(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const running = override ?? !systemPaused;

  const offers = products
    .filter((p) => discountPercent(p) > 0)
    .slice(0, 10)
    .map((p) => ({
      key: p.id,
      discount: discountPercent(p),
      name: p.name,
      price: formatPrice(effectivePrice(p)),
      was: formatPrice(p.price),
    }));

  const items =
    offers.length > 0 ? offers : STATIC_NOTES.map((n, i) => ({ key: `note-${i}`, note: n }));

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
            style={
              // Only set inline once the visitor has chosen, so the stylesheet
              // keeps control of the default.
              override === null ? undefined : { animationPlayState: running ? 'running' : 'paused' }
            }
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

      {/* Sits above the strip rather than in it, so it never scrolls away. */}
      <button
        type="button"
        onClick={() => setOverride(!running)}
        aria-pressed={!running}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand-900/70 text-brand-50 backdrop-blur-sm transition-colors hover:bg-brand-950"
        title={running ? 'Pause the offers strip' : 'Play the offers strip'}
      >
        {running ? (
          <Pause className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Play className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
        )}
        <span className="sr-only">{running ? 'Pause the offers strip' : 'Play the offers strip'}</span>
      </button>
    </div>
  );
}
