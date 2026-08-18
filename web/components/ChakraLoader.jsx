'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Spinning ground-chakkar used as the navigation loader.
 *
 * Deliberately NOT implemented as a Next `loading.js`: that wraps routes in a
 * Suspense boundary, which makes the response stream and commits a 200 header
 * before notFound() can run - reintroducing soft 404s across the catalogue.
 *
 * Instead this listens for clicks on internal links and clears itself when the
 * pathname changes. It is an overlay on top of the current page, so it never
 * delays or blocks the real navigation.
 */
export function ChakraSpinner({ size = 64 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="motion-safe:animate-[spin_1.1s_linear_infinite]"
      role="img"
      aria-label="Loading"
    >
      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" />
      {/* Eight spark arms, evenly spaced, fading around the wheel. */}
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 32 32)`}>
          <path
            d="M32 6 L35.5 17 L32 14.5 L28.5 17 Z"
            fill="currentColor"
            opacity={0.25 + (i / 8) * 0.75}
          />
        </g>
      ))}
      <circle cx="32" cy="32" r="6" fill="currentColor" />
    </svg>
  );
}

export default function ChakraLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Any completed navigation clears the overlay.
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event) {
      const link = event.target.closest?.('a');
      if (!link) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page or a pure hash jump needs no loader.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setLoading(true);
    }

    // Safety valve: never leave the overlay stuck if a navigation is cancelled.
    const clear = () => setLoading(false);

    /*
      Capture phase, deliberately. Next's <Link> calls preventDefault() from
      React's root-level handler to take over the navigation; a bubble-phase
      listener on document therefore runs afterwards and sees an already
      -defaultPrevented event, so it can never tell a real navigation from a
      cancelled one. Capturing puts this ahead of React entirely.
    */
    document.addEventListener('click', onClick, true);
    window.addEventListener('pageshow', clear);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('pageshow', clear);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-ink-50/70 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
    >
      <span className="flex flex-col items-center gap-3 text-brand-700">
        <ChakraSpinner />
        <span className="text-sm font-medium text-ink-700">Loading...</span>
      </span>
    </div>
  );
}
