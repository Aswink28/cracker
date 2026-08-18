'use client';

import { Store, Truck } from 'lucide-react';
import { cn } from '@/lib/format';

/**
 * Validate the customer details captured before the WhatsApp handoff.
 *
 * Exported separately from the component so the cart can run it on submit and
 * the same rules stay in one place. Messages are written to tell the customer
 * what to do, not to name the rule that failed.
 */
export function validateCustomer(customer) {
  const errors = {};

  const name = customer.name?.trim() ?? '';
  if (!name) {
    errors.name = 'Please enter your name';
  } else if (name.length < 2) {
    errors.name = 'Please enter your full name';
  }

  // Accepts an optional +91 and ignores spaces, dashes and brackets, because
  // customers type their number in all of those shapes.
  const mobile = (customer.mobile ?? '').replace(/[\s\-()]/g, '');
  if (!mobile) {
    errors.mobile = 'Please enter your mobile number';
  } else if (!/^(\+?91)?[6-9]\d{9}$/.test(mobile)) {
    errors.mobile = 'Enter a valid 10-digit mobile number';
  }

  if (customer.orderType === 'delivery') {
    const address = customer.address?.trim() ?? '';
    if (!address) {
      errors.address = 'Please enter the delivery address';
    } else if (address.length < 10) {
      errors.address = 'Please enter the full address including area and pincode';
    }
  }

  return errors;
}

export default function CustomerDetailsForm({ value, onChange, errors = {} }) {
  const set = (field) => (event) => onChange({ ...value, [field]: event.target.value });

  return (
    <fieldset>
      <legend className="text-base font-bold text-ink-950">Your details</legend>
      <p className="mt-1 text-xs text-ink-500">
        We need these to confirm your order over WhatsApp.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <Field
          id="customer-name"
          label="Your name"
          required
          error={errors.name}
        >
          <input
            id="customer-name"
            type="text"
            value={value.name}
            onChange={set('name')}
            autoComplete="name"
            placeholder="Full name"
            className={cn('input', errors.name && 'border-error-500')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'customer-name-error' : undefined}
          />
        </Field>

        <Field
          id="customer-mobile"
          label="Mobile number"
          required
          error={errors.mobile}
        >
          <input
            id="customer-mobile"
            type="tel"
            inputMode="numeric"
            value={value.mobile}
            onChange={set('mobile')}
            autoComplete="tel"
            placeholder="10-digit mobile number"
            className={cn('input', errors.mobile && 'border-error-500')}
            aria-invalid={Boolean(errors.mobile)}
            aria-describedby={errors.mobile ? 'customer-mobile-error' : undefined}
          />
        </Field>

        {/* Order type - radios rather than a select, so both options are visible */}
        <div>
          <span className="mb-2 block text-sm font-medium text-ink-800">
            How would you like to receive it?
            <span className="text-error-500"> *</span>
          </span>

          <div className="grid grid-cols-2 gap-2">
            <OrderTypeOption
              checked={value.orderType === 'pickup'}
              onChange={() => onChange({ ...value, orderType: 'pickup' })}
              icon={Store}
              label="Pickup"
              hint="Collect from the shop"
            />
            <OrderTypeOption
              checked={value.orderType === 'delivery'}
              onChange={() => onChange({ ...value, orderType: 'delivery' })}
              icon={Truck}
              label="Delivery"
              hint="We deliver to you"
            />
          </div>
        </div>

        {/*
          The address field only exists for delivery orders. Rendering it
          disabled for pickup would still let screen readers announce a
          required field the customer cannot fill.
        */}
        {value.orderType === 'delivery' && (
          <Field
            id="customer-address"
            label="Delivery address"
            required
            error={errors.address}
          >
            <textarea
              id="customer-address"
              rows={3}
              value={value.address}
              onChange={set('address')}
              autoComplete="street-address"
              placeholder="House/flat, street, area, city and pincode"
              className={cn('input resize-y', errors.address && 'border-error-500')}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? 'customer-address-error' : undefined}
            />
          </Field>
        )}

        <Field id="customer-message" label="Anything else?" hint="Optional">
          <textarea
            id="customer-message"
            rows={2}
            value={value.message}
            onChange={set('message')}
            placeholder="Preferred date, landmark, or any special request"
            className="input resize-y"
          />
        </Field>
      </div>
    </fieldset>
  );
}

function Field({ id, label, required, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-ink-800">
        {label}
        {required && <span className="text-error-500">*</span>}
        {hint && <span className="text-xs font-normal text-ink-400">{hint}</span>}
      </label>

      {children}

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-error-700">
          {error}
        </p>
      )}
    </div>
  );
}

function OrderTypeOption({ checked, onChange, icon: Icon, label, hint }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors',
        checked
          ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700'
          : 'border-ink-300 bg-white hover:bg-ink-50',
      )}
    >
      <span className="flex items-center gap-2">
        <input
          type="radio"
          name="orderType"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 accent-brand-700"
        />
        <Icon
          className={cn('h-4 w-4', checked ? 'text-brand-700' : 'text-ink-500')}
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold text-ink-950">{label}</span>
      </span>
      <span className="pl-6 text-xs text-ink-500">{hint}</span>
    </label>
  );
}
