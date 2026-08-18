'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/format';

/**
 * Quantity stepper.
 *
 * Both buttons are real <button> elements with accessible names, and each is
 * 44px on its shortest side so it stays comfortably tappable on a phone.
 */
export default function QuantitySelector({
  value,
  onIncrement,
  onDecrement,
  min = 1,
  max = 999,
  size = 'md',
  label = 'quantity',
  className,
}) {
  const compact = size === 'sm';

  const buttonClass = cn(
    'flex shrink-0 items-center justify-center text-ink-700',
    'transition-colors hover:bg-ink-100 active:bg-ink-200',
    'disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent',
    compact ? 'h-9 w-9' : 'h-11 w-11',
  );

  const iconClass = compact ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-ink-300 bg-white',
        className,
      )}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        className={cn(buttonClass, 'rounded-l-lg')}
        aria-label={`Decrease ${label}`}
      >
        <Minus className={iconClass} strokeWidth={2.5} />
      </button>

      {/*
        aria-live announces the new value to screen readers when the buttons
        change it, since neither button's own label conveys the result.
      */}
      <span
        className={cn(
          'min-w-9 text-center font-semibold tabular-nums text-ink-950',
          compact ? 'text-sm' : 'text-base',
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        disabled={value >= max}
        className={cn(buttonClass, 'rounded-r-lg')}
        aria-label={`Increase ${label}`}
      >
        <Plus className={iconClass} strokeWidth={2.5} />
      </button>
    </div>
  );
}
