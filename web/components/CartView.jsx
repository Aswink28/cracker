'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, ArrowLeft, MessageCircle, ShoppingBag, Loader2 } from 'lucide-react';
import ProductImage from './ProductImage';
import QuantitySelector from './QuantitySelector';
import CustomerDetailsForm, { validateCustomer } from './CustomerDetailsForm';
import { useCart } from '@/hooks/useCart';
import { useCartStore } from '@/store/cart';
import { formatPrice, effectivePrice, cn } from '@/lib/format';
import { generateWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { store, has, apiUrl } from '@/lib/config';

const EMPTY_CUSTOMER = {
  name: '',
  mobile: '',
  orderType: 'pickup',
  address: '',
  message: '',
};

export default function CartView() {
  const { items, totalQuantity, totalAmount, totalSavings, hydrated } = useCart();
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /**
   * Log the enquiry to the API, then open WhatsApp.
   *
   * The logging call is deliberately fire-and-forget with its own error trap:
   * the WhatsApp handoff is the actual product, and it must happen even if the
   * API is down, rate-limiting, or misconfigured. Nothing here awaits a
   * successful save before opening the chat.
   */
  function recordEnquiry(payload) {
    if (!apiUrl) return;

    fetch(`${apiUrl}/order-enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((error) => {
      console.warn('Order enquiry not recorded:', error.message);
    });
  }

  function handleOrder(event) {
    event.preventDefault();

    const validation = validateCustomer(customer);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      // Move focus to the first problem so the customer is not left guessing
      // why nothing happened.
      const firstField = Object.keys(validation)[0];
      document.getElementById(`customer-${firstField}`)?.focus();
      return;
    }

    setErrors({});
    setSubmitting(true);

    const message = generateWhatsAppMessage({
      items,
      customer,
      storeName: store.name,
    });

    recordEnquiry({
      customerName: customer.name.trim(),
      mobile: customer.mobile.trim(),
      orderType: customer.orderType,
      address: customer.orderType === 'delivery' ? customer.address.trim() : '',
      message: customer.message.trim(),
      items: items.map((item) => ({
        product: item.id,
        name: item.name,
        slug: item.slug,
        unitPrice: effectivePrice(item),
        quantity: item.quantity,
      })),
    });

    // Navigate in the same tab. window.open is unreliable here because this
    // runs after an async-looking handler and mobile browsers block popups
    // that are not tightly bound to the tap.
    window.location.href = buildWhatsAppUrl(message);

    // Restore the button if the customer comes straight back to this tab.
    setTimeout(() => setSubmitting(false), 3000);
  }

  if (!hydrated) {
    return (
      <div className="container-page py-16">
        <div className="flex flex-col items-center gap-3 text-ink-500">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <p className="text-sm">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-card border border-dashed border-ink-300 bg-white px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <ShoppingBag className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink-950">Your cart is empty</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
            Browse the catalogue and add the crackers you would like. You can send the
            whole list to us on WhatsApp in one tap.
          </p>
          <Link href="/products" className="btn-primary mt-6">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        Continue shopping
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-ink-950 sm:text-3xl">Your Cart</h1>
      <p className="mt-1 text-sm text-ink-600">
        {totalQuantity} item{totalQuantity === 1 ? '' : 's'} across {items.length} product
        {items.length === 1 ? '' : 's'}
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8">
        {/* Items */}
        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className="sr-only">
            Cart items
          </h2>

          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const unit = effectivePrice(item);
              const lineTotal = unit * item.quantity;
              const hasOffer = item.offerPrice != null && item.offerPrice < item.price;

              return (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-card border border-ink-200 bg-white p-3"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100 sm:h-24 sm:w-24"
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    <ProductImage
                      image={item.image}
                      alt={`${item.name} crackers`}
                      sizes="96px"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm leading-snug font-semibold text-ink-950">
                          <Link href={`/products/${item.slug}`} className="hover:text-brand-700">
                            {item.name}
                          </Link>
                        </h3>
                        {item.categoryName && (
                          <p className="mt-0.5 text-xs text-ink-500">{item.categoryName}</p>
                        )}
                        {item.unit && <p className="text-xs text-ink-500">{item.unit}</p>}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-error-50 hover:text-error-700"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-ink-950">
                          {formatPrice(unit)}
                        </span>
                        {hasOffer && (
                          <span className="text-xs text-ink-400 line-through">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <QuantitySelector
                          value={item.quantity}
                          onIncrement={() => setQuantity(item.id, item.quantity + 1)}
                          onDecrement={() => setQuantity(item.id, item.quantity - 1)}
                          min={0}
                          size="sm"
                          label={`quantity of ${item.name}`}
                        />
                        <span className="min-w-16 text-right text-sm font-bold text-ink-950">
                          {formatPrice(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={clear}
            className="mt-4 text-sm font-medium text-ink-500 hover:text-error-700"
          >
            Clear cart
          </button>
        </section>

        {/* Summary + customer details */}
        <section
          aria-labelledby="summary-heading"
          className="mt-8 lg:sticky lg:top-24 lg:mt-0"
        >
          <form
            onSubmit={handleOrder}
            noValidate
            className="rounded-card border border-ink-200 bg-white p-4 sm:p-5"
          >
            <h2 id="summary-heading" className="text-lg font-bold text-ink-950">
              Order summary
            </h2>

            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Total quantity</dt>
                <dd className="font-medium text-ink-950">{totalQuantity}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd className="font-medium text-ink-950">{formatPrice(totalAmount)}</dd>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-success-700">
                  <dt>You save</dt>
                  <dd className="font-medium">{formatPrice(totalSavings)}</dd>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-ink-200 pt-3 text-base">
                <dt className="font-bold text-ink-950">Total amount</dt>
                <dd className="font-bold text-ink-950">{formatPrice(totalAmount)}</dd>
              </div>
            </dl>

            <hr className="my-5 border-ink-200" />

            <CustomerDetailsForm
              value={customer}
              onChange={(next) => {
                setCustomer(next);
                // Clear a field's error as soon as the customer edits it.
                setErrors((prev) => {
                  const cleared = { ...prev };
                  for (const key of Object.keys(next)) {
                    if (next[key] !== customer[key]) delete cleared[key];
                  }
                  return cleared;
                });
              }}
              errors={errors}
            />

            <button
              type="submit"
              disabled={submitting}
              className={cn('btn-whatsapp mt-5 w-full', submitting && 'opacity-70')}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <MessageCircle className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              )}
              {submitting ? 'Opening WhatsApp...' : 'Order via WhatsApp'}
            </button>

            {!has.whatsapp && (
              <p className="mt-2 text-xs text-error-700">
                No WhatsApp number is configured for this store yet.
              </p>
            )}

            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              Tapping the button opens WhatsApp with your order details filled in. Send the
              message and we will confirm availability and the final amount. No payment is
              taken on this website.
            </p>

            {has.phone && (
              <a href={`tel:${store.phone}`} className="btn-secondary mt-3 w-full">
                Call {store.phone}
              </a>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
