'use client';

import { useEffect, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/format';

export const THEMES = [
  { id: 'festive', label: 'Festive Red', swatch: '#a62c2c', hint: 'The classic Diwali palette' },
  { id: 'peacock', label: 'Royal Peacock', swatch: '#1a615f', hint: 'Deep teal and gold' },
  { id: 'midnight', label: 'Midnight Gold', swatch: '#c9a227', hint: 'Dark, easy on the eyes' },
];

export const THEME_KEY = 'crackers-theme';

/**
 * Theme picker. Writes `data-theme` on <html>, which re-points the brand and
 * ink colour ramps in globals.css - components never read the theme directly.
 *
 * The chosen theme is applied before first paint by an inline script in the
 * root layout, so switching does not cause a flash of the default palette on
 * the next page load.
 */
export default function ThemeSwitcher({ className }) {
  const [theme, setTheme] = useState('festive');
  const [open, setOpen] = useState(false);

  // Read the value the pre-paint script already applied, rather than assuming
  // the default - otherwise the checkmark would disagree with the page.
  useEffect(() => {
    const current = document.documentElement.dataset.theme || 'festive';
    setTheme(current);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!event.target.closest('[data-theme-menu]')) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  function choose(id) {
    setTheme(id);
    setOpen(false);
    if (id === 'festive') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = id;
    try {
      window.localStorage.setItem(THEME_KEY, id);
    } catch {
      // Private browsing can reject writes; the theme still applies for this visit.
    }
  }

  return (
    <div data-theme-menu className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
        aria-label="Change colour theme"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Palette className="h-5 w-5" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Colour theme"
          className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-card border border-ink-200 bg-white shadow-lg animate-fade-in"
        >
          {THEMES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === option.id}
              onClick={() => choose(option.id)}
              className={cn(
                'flex w-full min-h-11 items-center gap-3 px-3 py-2 text-left transition-colors',
                theme === option.id ? 'bg-brand-50' : 'hover:bg-ink-100',
              )}
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 shrink-0 rounded-full border border-ink-300"
                style={{ backgroundColor: option.swatch }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink-950">{option.label}</span>
                <span className="block text-xs text-ink-500">{option.hint}</span>
              </span>
              {theme === option.id && (
                <Check className="h-4 w-4 shrink-0 text-brand-700" strokeWidth={2.6} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
