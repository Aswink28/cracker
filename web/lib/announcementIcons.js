import { Megaphone, Tag, Sparkles, Gift, Truck, Percent } from 'lucide-react';

/**
 * Icon names live in the database; the mapping to components lives here.
 *
 * That keeps UI markup out of the API, and means the storefront strip and the
 * admin picker can never drift apart - both read this one map. The names match
 * the enum in the server's announcement validator.
 */
export const ANNOUNCEMENT_ICONS = {
  megaphone: Megaphone,
  tag: Tag,
  sparkles: Sparkles,
  gift: Gift,
  truck: Truck,
  percent: Percent,
};

export const DEFAULT_ICON = 'megaphone';

export const ICON_NAMES = Object.keys(ANNOUNCEMENT_ICONS);

/** Never returns undefined, so an unknown name renders the default instead of crashing. */
export function iconFor(name) {
  return ANNOUNCEMENT_ICONS[name] ?? ANNOUNCEMENT_ICONS[DEFAULT_ICON];
}
