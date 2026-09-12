'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, EyeOff } from 'lucide-react';
import {
  listAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getStripSettings,
  updateStripSettings,
  errorMessage,
} from '@/lib/adminApi';
import { ICON_NAMES, DEFAULT_ICON, iconFor } from '@/lib/announcementIcons';
import { cn } from '@/lib/format';

const BLANK = { text: '', icon: DEFAULT_ICON, displayOrder: 0, active: true };
const MAX_LENGTH = 160;

/**
 * A labelled checkbox that saves on change.
 *
 * Kept as a real checkbox rather than a styled div so it is keyboard
 * operable and announced correctly, with the label and hint tied to it.
 */
function Toggle({ id, checked, busy, onChange, label, hint }) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={busy}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={`${id}-hint`}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700 disabled:opacity-50"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-ink-900">
          {label}
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" aria-hidden="true" />}
        </label>
        <p id={`${id}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      </div>
    </div>
  );
}

/**
 * Manages the messages in the homepage offers strip.
 *
 * Product discounts appear there automatically, so this page is only for copy
 * that belongs to no single product - a festival sale, a delivery cut-off. The
 * preview matches the real strip's colours because the message is written to be
 * read against that background, not on white.
 */
export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | announcement
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settings, setSettings] = useState({ enabled: true, showProductOffers: true });
  const [savingSetting, setSavingSetting] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [list, current] = await Promise.all([
        listAdminAnnouncements(),
        getStripSettings(),
      ]);
      setAnnouncements(list);
      setSettings(current);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load the offers strip'));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Saves immediately on toggle rather than behind a Save button.
   *
   * These are two switches with an instant, visible effect on the homepage, so
   * a pending-changes state would only be a way to lose them. The previous
   * value is restored if the request fails, so the switch never shows a state
   * the server did not accept.
   */
  async function toggleSetting(field, value) {
    const previous = settings;
    setSettings({ ...settings, [field]: value });
    setSavingSetting(field);
    setError('');

    try {
      setSettings(await updateStripSettings({ [field]: value }));
    } catch (err) {
      setSettings(previous);
      setError(errorMessage(err, 'Could not change that setting'));
    } finally {
      setSavingSetting('');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    // Put a new message after everything that exists, so adding one never
    // silently reorders the strip.
    const next = announcements.reduce((max, a) => Math.max(max, a.displayOrder ?? 0), 0) + 1;
    setForm({ ...BLANK, displayOrder: next });
    setEditing('new');
  }

  function startEdit(announcement) {
    setForm({
      text: announcement.text,
      icon: announcement.icon ?? DEFAULT_ICON,
      displayOrder: announcement.displayOrder ?? 0,
      active: announcement.active !== false,
    });
    setEditing(announcement);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      text: form.text.trim(),
      icon: form.icon,
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active,
    };

    try {
      if (editing === 'new') await createAnnouncement(payload);
      else await updateAnnouncement(editing.id, payload);

      setEditing(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the message'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(announcement) {
    if (!window.confirm(`Delete this message?\n\n"${announcement.text}"`)) return;

    setDeletingId(announcement.id);
    try {
      await deleteAnnouncement(announcement.id);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the message'));
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = announcements.filter((a) => a.active !== false).length;
  const PreviewIcon = iconFor(form.icon);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-950">Offers strip</h2>
          <p className="text-sm text-ink-500">
            {announcements.length} message{announcements.length === 1 ? '' : 's'}
            {announcements.length > 0 && ` - ${activeCount} live`}
          </p>
        </div>

        <button type="button" onClick={startNew} className="btn-primary">
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Add message
        </button>
      </div>

      <div className="mt-4 rounded-card border border-ink-200 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-bold text-ink-950">What the strip shows</h3>
        <p className="mt-1 text-sm text-ink-500">
          The strip scrolls across the top of the homepage. Both switches take effect
          straight away.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Toggle
            id="s-enabled"
            checked={settings.enabled !== false}
            busy={savingSetting === 'enabled'}
            onChange={(value) => toggleSetting('enabled', value)}
            label="Show the offers strip"
            hint="Off removes the whole bar from the homepage."
          />
          <Toggle
            id="s-products"
            checked={settings.showProductOffers !== false}
            busy={savingSetting === 'showProductOffers'}
            onChange={(value) => toggleSetting('showProductOffers', value)}
            label="List discounted products automatically"
            hint="Off shows only the messages below, leaving product prices untouched."
          />
        </div>

        {settings.enabled === false && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-ink-100 px-3 py-2.5 text-sm text-ink-700">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>
              The strip is hidden, so nothing on this page is visible to customers right now.
            </span>
          </p>
        )}

        {settings.enabled !== false &&
          settings.showProductOffers === false &&
          announcements.filter((a) => a.active !== false).length === 0 && (
            <p className="mt-4 rounded-lg bg-warning-50 px-3 py-2.5 text-sm text-ink-700">
              Product offers are off and there are no live messages, so the strip is falling
              back to general shop notes. Add a message, or switch the strip off to remove it.
            </p>
          )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </p>
      )}

      {editing && (
        <form
          onSubmit={handleSave}
          className="mt-5 rounded-card border border-brand-200 bg-brand-50/40 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink-950">
              {editing === 'new' ? 'New message' : 'Edit message'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-white"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="a-text" className="mb-1.5 block text-sm font-medium text-ink-800">
                Message <span className="text-error-500">*</span>
              </label>
              <input
                id="a-text"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                required
                maxLength={MAX_LENGTH}
                placeholder="Diwali sale - 20% off all sparklers"
                className="input"
              />
              <p className="mt-1 text-xs text-ink-500">
                {form.text.length}/{MAX_LENGTH} characters. Keep it short - the strip is one
                scrolling line.
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink-800">Icon</span>
              <div className="flex flex-wrap gap-2">
                {ICON_NAMES.map((name) => {
                  const Icon = iconFor(name);
                  const selected = form.icon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setForm({ ...form, icon: name })}
                      aria-pressed={selected}
                      title={name}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
                        selected
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                      <span className="sr-only">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="a-order" className="mb-1.5 block text-sm font-medium text-ink-800">
                Order
              </label>
              <input
                id="a-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                className="input"
              />
              <p className="mt-1 text-xs text-ink-500">Lower numbers scroll past first.</p>
            </div>

            <label htmlFor="a-active" className="flex cursor-pointer items-end gap-2 pb-2">
              <input
                id="a-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-brand-700"
              />
              <span className="text-sm font-medium text-ink-900">
                Live on the homepage
              </span>
            </label>
          </div>

          <div className="mt-5">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">Preview</span>
            <div className="flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm text-brand-50">
              <PreviewIcon
                className="h-4 w-4 shrink-0 text-gold-300"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="truncate">
                {form.text.trim() || 'Your message will appear here'}
              </span>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading messages...
        </div>
      ) : announcements.length === 0 ? (
        <p className="mt-5 rounded-card border border-dashed border-ink-200 bg-white px-4 py-10 text-center text-sm text-ink-500">
          No messages yet. The strip is showing your product offers on their own.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-ink-200 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Message</th>
                <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-100">
              {announcements.map((announcement) => {
                const Icon = iconFor(announcement.icon);
                return (
                  <tr key={announcement.id}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Icon
                          className="h-4 w-4 shrink-0 text-brand-700"
                          strokeWidth={2.2}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-ink-950">{announcement.text}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{announcement.displayOrder}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          announcement.active
                            ? 'bg-success-50 text-success-700'
                            : 'bg-ink-100 text-ink-500',
                        )}
                      >
                        {announcement.active ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(announcement)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                          aria-label={`Edit "${announcement.text}"`}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(announcement)}
                          disabled={deletingId === announcement.id}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-error-50 hover:text-error-700 disabled:opacity-50"
                          aria-label={`Delete "${announcement.text}"`}
                        >
                          {deletingId === announcement.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
