import './globals.css';
import { store } from '@/lib/config';

export const metadata = {
  metadataBase: new URL(store.siteUrl),
  title: {
    default: `${store.name} | Quality Crackers at Best Prices`,
    template: `%s | ${store.name}`,
  },
  description:
    'Browse our full crackers and fireworks catalogue - sparklers, flower pots, ' +
    'ground chakkars, rockets, gift boxes and combo packs. Build your list and ' +
    'send the order to us on WhatsApp.',
  applicationName: store.name,
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: { telephone: true, address: false, email: false },
  openGraph: { type: 'website', siteName: store.name, locale: 'en_IN' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport = {
  themeColor: '#a62c2c',
  width: 'device-width',
  initialScale: 1,
  // Never block pinch-zoom - capping it is an accessibility failure for anyone
  // who needs to magnify a price or a safety instruction.
  maximumScale: 5,
};

/**
 * Applies the saved theme before first paint.
 *
 * This must run synchronously in <head>, ahead of any rendering. Doing it in a
 * useEffect would paint the default palette first and then repaint - a visible
 * flash on every page load for anyone not using the default theme.
 */
const THEME_SCRIPT = `
try {
  var t = localStorage.getItem('crackers-theme');
  if (t && t !== 'festive') document.documentElement.dataset.theme = t;
} catch (e) {}
`;

/**
 * Root layout holds only <html>/<body>. The storefront chrome lives in
 * app/(shop)/layout.js and the admin chrome in app/admin/layout.js, so the two
 * never share a header.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">{children}</body>
    </html>
  );
}
