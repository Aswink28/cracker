'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, Phone, Sparkles } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { store, has } from '@/lib/config';
import { cn } from '@/lib/format';
import SearchBar from './SearchBar';
import ThemeSwitcher from './ThemeSwitcher';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Header({ categories = [] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalQuantity, hydrated } = useCart();

  // Close the drawer on navigation, otherwise it stays open over the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock background scrolling while the drawer is open so the page behind it
  // does not scroll under the customer's finger.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/*
        Solid background rather than a translucent one with backdrop-blur.
        backdrop-filter establishes a containing block for fixed-position
        descendants, which would trap the mobile drawer below inside the
        header's own box instead of the viewport. It also costs real paint time
        on mid-range phones for an effect invisible behind a 95% opaque bar.
      */}
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo + store name */}
          <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">
              <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-bold text-ink-950 sm:text-lg">
                {store.name}
              </span>
              <span className="hidden text-[11px] text-ink-500 sm:block">
                {store.tagline}
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-ink-700 hover:bg-ink-100 hover:text-ink-950',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop search */}
          <div className="hidden max-w-xs flex-1 lg:block">
            <Suspense fallback={<div className="h-11" />}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ThemeSwitcher />

            {has.phone && (
              <a
                href={`tel:${store.phone}`}
                className="hidden h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 sm:flex"
                aria-label={`Call ${store.name}`}
              >
                <Phone className="h-5 w-5" strokeWidth={2} />
              </a>
            )}

            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
              aria-label={
                hydrated && totalQuantity > 0
                  ? `Cart, ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`
                  : 'Cart'
              }
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={2} />
              {hydrated && totalQuantity > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[11px] font-bold text-white">
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Mobile search sits on its own row so it gets full width */}
        <div className="pb-3 lg:hidden">
          <Suspense fallback={<div className="h-11" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
      </header>

      {/*
        The drawer lives OUTSIDE <header> on purpose. As a descendant it would
        be positioned against the header's box - a sticky, ~112px-tall element -
        rather than the viewport, collapsing the nav to a sliver. Kept as a
        sibling, `fixed inset-0` resolves against the viewport as intended.
      */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-xl animate-slide-up"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 px-4">
              <span className="font-bold text-ink-950">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
                aria-label="Close menu"
                autoFocus
              >
                <X className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain p-4">
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-center rounded-lg px-3 text-base font-medium',
                        isActive(link.href)
                          ? 'bg-brand-50 text-brand-800'
                          : 'text-ink-800 hover:bg-ink-100',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {categories.length > 0 && (
                <>
                  <h2 className="mt-6 mb-2 px-3 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                    Categories
                  </h2>
                  <ul className="flex flex-col gap-1">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/categories/${category.slug}`}
                          className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm text-ink-800 hover:bg-ink-100"
                        >
                          <span>{category.name}</span>
                          <span className="text-xs text-ink-400">{category.productCount}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </nav>

            {has.phone && (
              <div className="shrink-0 border-t border-ink-200 p-4">
                <a href={`tel:${store.phone}`} className="btn-secondary w-full">
                  <Phone className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  Call {store.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
