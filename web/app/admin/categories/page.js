'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  listAdminCategories,
  listAdminProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImage,
  errorMessage,
} from '@/lib/adminApi';
import { cn, formatPrice, effectivePrice } from '@/lib/format';

const BLANK = {
  name: '',
  slug: '',
  description: '',
  displayOrder: 0,
  active: true,
  keywords: '',
  image: null,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | category object
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  // Products belonging to the category currently being edited.
  const [linked, setLinked] = useState({ loading: false, items: [], total: 0 });

  async function load() {
    setLoading(true);
    try {
      setCategories(await listAdminCategories());
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load categories'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setForm(BLANK);
    setLinked({ loading: false, items: [], total: 0 });
    setEditing('new');
  }

  function startEdit(category) {
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      displayOrder: category.displayOrder ?? 0,
      active: category.active !== false,
      keywords: (category.keywords ?? []).join(', '),
      // A category saved before it had an image carries an empty subdocument
      // rather than null, which would render as a broken <Image src="">.
      image: category.image?.url ? category.image : null,
    });
    setEditing(category);

    // Show what is actually attached to this category before it is renamed,
    // disabled or deleted - the counts alone do not say which products are
    // affected.
    setLinked({ loading: true, items: [], total: 0 });
    listAdminProducts({ category: category.slug, limit: 60, sort: 'name' })
      .then((data) => setLinked({ loading: false, items: data.products, total: data.total }))
      .catch(() => setLinked({ loading: false, items: [], total: 0 }));
  }

  async function handleImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const image = await uploadImage(file, 'categories');
      // Default the alt text to the category name so no image ships without one.
      setForm((prev) => ({ ...prev, image: { ...image, alt: prev.image?.alt || prev.name } }));
    } catch (err) {
      setError(errorMessage(err, 'Image upload failed'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active,
      keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      image: form.image,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();

    try {
      if (editing === 'new') await createCategory(payload);
      else await updateCategory(editing.id, payload);

      setEditing(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the category'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    if (category.productCount > 0) {
      setError(
        `"${category.name}" still has ${category.productCount} product(s). Move or delete them first.`,
      );
      return;
    }

    if (!window.confirm(`Delete the category "${category.name}"?`)) return;

    setDeletingId(category.id);
    try {
      await deleteCategory(category.id);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the category'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-950">Categories</h2>
          <p className="text-sm text-ink-500">{categories.length} total</p>
        </div>

        <button type="button" onClick={startNew} className="btn-primary">
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Add category
        </button>
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
              {editing === 'new' ? 'New category' : `Edit: ${editing.name}`}
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
              <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-ink-800">
                Name <span className="text-error-500">*</span>
              </label>
              <input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={80}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="c-slug" className="mb-1.5 block text-sm font-medium text-ink-800">
                URL slug
              </label>
              <input
                id="c-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                pattern="[a-z0-9\-]*"
                placeholder="Generated from the name"
                className="input font-mono text-sm"
              />
              <p className="mt-1 text-xs text-ink-500">
                {editing !== 'new' && 'Changing this breaks existing links to the category.'}
              </p>
            </div>

            <div>
              <label htmlFor="c-order" className="mb-1.5 block text-sm font-medium text-ink-800">
                Display order
              </label>
              <input
                id="c-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                className="input"
              />
              <p className="mt-1 text-xs text-ink-500">Lower numbers appear first.</p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="c-desc" className="mb-1.5 block text-sm font-medium text-ink-800">
                Description
              </label>
              <textarea
                id="c-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={1000}
                className="input resize-y"
              />
              <p className="mt-1 text-xs text-ink-500">
                Shown on the category page and used as its search-result description.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="c-keywords" className="mb-1.5 block text-sm font-medium text-ink-800">
                Keywords
              </label>
              <input
                id="c-keywords"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="sparklers, phool jhadi"
                className="input"
              />
            </div>

            {/* Image. Shown round because the storefront rail crops it to a
                circle - a square preview would mislead about the framing. */}
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink-800">
                Category image
                <span className="ml-1 font-normal text-ink-400">
                  Replaces the sparkle icon on the home page
                </span>
              </span>

              {form.image?.url ? (
                <div className="flex items-start gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-ink-200">
                    <Image
                      src={form.image.url}
                      alt={form.image.alt || form.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <label htmlFor="c-alt" className="mb-1.5 block text-xs font-medium text-ink-700">
                      Image alt text
                    </label>
                    <input
                      id="c-alt"
                      value={form.image.alt ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, image: { ...prev.image, alt: e.target.value } }))
                      }
                      placeholder={`${form.name || 'Category'} crackers`}
                      className="input text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: null }))}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-error-700 hover:underline"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
                      Remove image
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg',
                    'border border-dashed border-ink-300 bg-white px-4 py-6 text-sm text-ink-600',
                    'hover:border-brand-400 hover:bg-brand-50',
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload an image (JPEG, PNG, WebP or AVIF, max 8 MB)'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleImage}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            <label htmlFor="c-active" className="flex cursor-pointer items-center gap-2">
              <input
                id="c-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-brand-700"
              />
              <span className="text-sm font-medium text-ink-900">Active</span>
            </label>
          </div>

          {editing !== 'new' && (
            <div className="mt-5 rounded-lg border border-ink-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-ink-950">
                Products in this category
                {!linked.loading && (
                  <span className="ml-1 font-normal text-ink-500">({linked.total})</span>
                )}
              </h4>

              {linked.loading ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading...
                </p>
              ) : linked.items.length === 0 ? (
                <p className="mt-2 text-sm text-ink-500">
                  Nothing is linked to this category yet, so it is safe to rename or delete.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-ink-500">
                    These move with the category. It cannot be deleted until they are
                    reassigned or removed.
                  </p>
                  <ul className="mt-3 flex max-h-56 flex-col gap-1 overflow-y-auto">
                    {linked.items.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="flex min-h-9 items-center justify-between gap-3 rounded px-2 text-sm hover:bg-ink-100"
                        >
                          <span className="min-w-0 flex-1 truncate text-ink-800">
                            {product.name}
                          </span>
                          <span className="shrink-0 text-xs font-medium text-ink-600">
                            {formatPrice(effectivePrice(product))}
                          </span>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                              product.active
                                ? 'bg-success-50 text-success-700'
                                : 'bg-ink-100 text-ink-500',
                            )}
                          >
                            {product.active ? 'Active' : 'Disabled'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {linked.total > linked.items.length && (
                    <p className="mt-2 text-xs text-ink-500">
                      Showing {linked.items.length} of {linked.total}.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

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
          Loading categories...
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-ink-200 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                <th scope="col" className="px-4 py-3 font-semibold">Products</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-100">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink-950">{category.name}</span>
                    <br />
                    <code className="text-xs text-ink-400">/categories/{category.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{category.displayOrder}</td>
                  <td className="px-4 py-3 text-ink-600">{category.productCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        category.active
                          ? 'bg-success-50 text-success-700'
                          : 'bg-ink-100 text-ink-500',
                      )}
                    >
                      {category.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        disabled={deletingId === category.id}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-error-50 hover:text-error-700 disabled:opacity-50"
                        aria-label={`Delete ${category.name}`}
                      >
                        {deletingId === category.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
