'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Phone, MessageCircle, MapPin, Package } from 'lucide-react';
import { listEnquiries, updateEnquiryStatus, errorMessage } from '@/lib/adminApi';
import { formatPrice, cn } from '@/lib/format';

/**
 * Orders customers sent through the WhatsApp flow.
 *
 * Every one of these is a real enquiry with a real mobile number, given
 * deliberately at checkout - so the list is both a work queue and the shop's
 * customer record. Status is the only editable field: the order itself is
 * whatever the customer submitted, and rewriting that would lose what they
 * actually asked for.
 */
const STATUSES = [
  { id: 'new', label: 'New', tone: 'bg-warning-50 text-warning-700 ring-warning-500/30' },
  { id: 'contacted', label: 'Contacted', tone: 'bg-brand-50 text-brand-800 ring-brand-300' },
  { id: 'confirmed', label: 'Confirmed', tone: 'bg-success-50 text-success-700 ring-success-500/30' },
  { id: 'cancelled', label: 'Cancelled', tone: 'bg-ink-100 text-ink-500 ring-ink-300' },
];

const FILTERS = [{ id: '', label: 'All' }, ...STATUSES.map((s) => ({ id: s.id, label: s.label }))];

function toneFor(status) {
  return STATUSES.find((s) => s.id === status)?.tone ?? STATUSES[3].tone;
}

/** "13 Sep 2026, 8:41 am" - readable at a glance, unambiguous about the day. */
function when(value) {
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listEnquiries({ limit: 50, ...(status ? { status } : {}) });
      setEnquiries(data.enquiries ?? []);
      setTotal(data.total ?? 0);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load orders'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(enquiry, next) {
    setSavingId(enquiry.id);
    setError('');
    try {
      await updateEnquiryStatus(enquiry.id, next);
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiry.id ? { ...e, status: next } : e)),
      );
    } catch (err) {
      setError(errorMessage(err, 'Could not update the status'));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div>
        <h2 className="text-lg font-bold text-ink-950">Orders</h2>
        <p className="text-sm text-ink-500">
          {total} enquir{total === 1 ? 'y' : 'ies'} sent from the cart
        </p>
      </div>

      {/* Filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            onClick={() => setStatus(f.id)}
            aria-pressed={status === f.id}
            className={cn(
              'min-h-9 rounded-lg px-3 text-sm font-medium transition-colors',
              status === f.id
                ? 'bg-brand-700 text-white'
                : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-100',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading orders...
        </div>
      ) : enquiries.length === 0 ? (
        <p className="mt-5 rounded-card border border-dashed border-ink-200 bg-white px-4 py-10 text-center text-sm text-ink-500">
          {status
            ? 'No orders with this status.'
            : 'No orders yet. They appear here as soon as a customer sends their cart on WhatsApp.'}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {enquiries.map((enquiry) => (
            <li
              key={enquiry.id}
              className="rounded-card border border-ink-200 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-950">{enquiry.customerName}</p>
                  <p className="text-xs text-ink-500">{when(enquiry.createdAt)}</p>
                </div>

                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                    toneFor(enquiry.status),
                  )}
                >
                  {STATUSES.find((s) => s.id === enquiry.status)?.label ?? enquiry.status}
                </span>
              </div>

              {/* Contact. Both are one tap, because the next action after
                  reading an order is almost always to call or message. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`tel:${enquiry.mobile}`} className="btn-secondary min-h-9 px-3 text-sm">
                  <Phone className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  {enquiry.mobile}
                </a>
                <a
                  href={`https://wa.me/${enquiry.mobile.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary min-h-9 px-3 text-sm"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" strokeWidth={2.2} aria-hidden="true" />
                  WhatsApp
                </a>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-ink-400" strokeWidth={2} aria-hidden="true" />
                  {enquiry.totalQuantity} item{enquiry.totalQuantity === 1 ? '' : 's'}
                </span>
                <span className="font-semibold text-ink-950">
                  {formatPrice(enquiry.totalAmount)}
                </span>
                <span className="capitalize">{enquiry.orderType}</span>
              </div>

              {enquiry.address && (
                <p className="mt-2 flex gap-2 text-sm text-ink-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                  <span>{enquiry.address}</span>
                </p>
              )}

              {enquiry.message && (
                <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                  &ldquo;{enquiry.message}&rdquo;
                </p>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-brand-700">
                  What they ordered
                </summary>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {enquiry.items.map((item, i) => (
                    <li key={`${enquiry.id}-${i}`} className="flex justify-between gap-3">
                      <span className="min-w-0 text-ink-800">
                        {item.name}
                        <span className="text-ink-500"> x{item.quantity}</span>
                      </span>
                      <span className="shrink-0 text-ink-600">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                <span className="text-xs font-medium text-ink-500">Mark as</span>
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={savingId === enquiry.id || enquiry.status === s.id}
                    onClick={() => changeStatus(enquiry, s.id)}
                    className={cn(
                      'min-h-9 rounded-lg px-2.5 text-xs font-medium transition-colors',
                      enquiry.status === s.id
                        ? 'cursor-default bg-ink-100 text-ink-400'
                        : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-100',
                      savingId === enquiry.id && 'opacity-50',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
                {savingId === enquiry.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-ink-400" aria-hidden="true" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
