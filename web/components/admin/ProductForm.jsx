'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Upload, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  createProduct,
  updateProduct,
  listAdminCategories,
  uploadImage,
  errorMessage,
} from '@/lib/adminApi';
import { cn } from '@/lib/format';

const BLANK = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: '',
  price: '',
  offerPrice: '',
  unit: '',
  keywords: '',
  featured: false,
  active: true,
  inStock: true,
  image: null,
};

/**
 * Create/edit form for a product.
 *
 * The slug field is left empty on create so the API derives it from the name.
 * On edit it is pre-filled but changing it is a deliberate act - the helper
 * text says so, because changing a slug breaks every existing link to that
 * product.
 */
export default function ProductForm({ product = null }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [values, setValues] = useState(BLANK);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    listAdminCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!product) return;
    setValues({
      name: product.name ?? '',
      slug: product.slug ?? '',
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      category: product.category?.id ?? product.category ?? '',
      price: String(product.price ?? ''),
      offerPrice: product.offerPrice != null ? String(product.offerPrice) : '',
      unit: product.unit ?? '',
      keywords: (product.keywords ?? []).join(', '),
      featured: Boolean(product.featured),
      active: product.active !== false,
      inStock: product.inStock !== false,
      image: product.image ?? null,
    });
  }, [product]);

  const set = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  async function handleImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const image = await uploadImage(file, 'products');
      setValues((prev) => ({
        ...prev,
        // Default the alt text to the product name so no image ships without one.
        image: { ...image, alt: prev.image?.alt || prev.name },
      }));
    } catch (err) {
      setError(errorMessage(err, 'Image upload failed'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: values.name.trim(),
        shortDescription: values.shortDescription.trim(),
        description: values.description.trim(),
        category: values.category,
        price: Number(values.price),
        // An empty offer field means "no offer", which the API models as null
        // rather than 0 - zero would render as a 100% discount.
        offerPrice: values.offerPrice === '' ? null : Number(values.offerPrice),
        unit: values.unit.trim(),
        keywords: values.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        featured: values.featured,
        active: values.active,
        inStock: values.inStock,
        image: values.image,
      };

      if (values.slug.trim()) payload.slug = values.slug.trim();

      if (isEdit) await updateProduct(product.id, payload);
      else await createProduct(payload);

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the product'));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        Back to products
      </Link>

      <h2 className="mt-3 text-lg font-bold text-ink-950">
        {isEdit ? `Edit: ${product.name}` : 'Add a product'}
      </h2>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-5">
        <Field label="Product name" htmlFor="p-name" required>
          <input
            id="p-name"
            value={values.name}
            onChange={set('name')}
            required
            maxLength={140}
            className="input"
          />
        </Field>

        <Field
          label="URL slug"
          htmlFor="p-slug"
          hint={
            isEdit
              ? 'Changing this breaks existing links to this product. Leave it alone unless you must.'
              : 'Leave blank to generate it from the name.'
          }
        >
          <input
            id="p-slug"
            value={values.slug}
            onChange={set('slug')}
            pattern="[a-z0-9\-]*"
            placeholder="flower-pot-big"
            className="input font-mono text-sm"
          />
        </Field>

        <Field
          label="Short description"
          htmlFor="p-short"
          hint="One line. Used on cards and as the search-result description."
        >
          <input
            id="p-short"
            value={values.shortDescription}
            onChange={set('shortDescription')}
            maxLength={200}
            className="input"
          />
        </Field>

        <Field label="Full description" htmlFor="p-desc">
          <textarea
            id="p-desc"
            rows={5}
            value={values.description}
            onChange={set('description')}
            maxLength={4000}
            className="input resize-y"
          />
        </Field>

        <Field label="Category" htmlFor="p-category" required>
          <select
            id="p-category"
            value={values.category}
            onChange={set('category')}
            required
            className="input"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price (₹)" htmlFor="p-price" required>
            <input
              id="p-price"
              type="number"
              min="0"
              step="1"
              value={values.price}
              onChange={set('price')}
              required
              className="input"
            />
          </Field>

          <Field label="Offer price (₹)" htmlFor="p-offer" hint="Leave blank for no offer">
            <input
              id="p-offer"
              type="number"
              min="0"
              step="1"
              value={values.offerPrice}
              onChange={set('offerPrice')}
              className="input"
            />
          </Field>
        </div>

        <Field label="Pack size / unit" htmlFor="p-unit" hint="e.g. Box of 10">
          <input id="p-unit" value={values.unit} onChange={set('unit')} className="input" />
        </Field>

        <Field
          label="Search keywords"
          htmlFor="p-keywords"
          hint="Comma separated. Helps customers find this on the site's search."
        >
          <input
            id="p-keywords"
            value={values.keywords}
            onChange={set('keywords')}
            placeholder="flower pot, anar, fountain"
            className="input"
          />
        </Field>

        {/* Image */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-800">Product image</span>

          {values.image?.url ? (
            <div className="flex items-start gap-3">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-ink-200">
                <Image
                  src={values.image.url}
                  alt={values.image.alt || values.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="p-alt" className="mb-1.5 block text-xs font-medium text-ink-700">
                  Image alt text
                  <span className="ml-1 font-normal text-ink-400">
                    Describes the image for screen readers and search engines
                  </span>
                </label>
                <input
                  id="p-alt"
                  value={values.image.alt ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      image: { ...prev.image, alt: e.target.value },
                    }))
                  }
                  placeholder={`${values.name || 'Product'} crackers`}
                  className="input text-sm"
                />

                <button
                  type="button"
                  onClick={() => setValues((prev) => ({ ...prev, image: null }))}
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

        {/* Flags */}
        <fieldset className="rounded-card border border-ink-200 p-4">
          <legend className="px-1 text-sm font-medium text-ink-800">Visibility</legend>
          <div className="flex flex-col gap-3">
            <Toggle
              id="p-active"
              checked={values.active}
              onChange={set('active')}
              label="Active"
              hint="Unchecked hides this product from the site entirely"
            />
            <Toggle
              id="p-instock"
              checked={values.inStock}
              onChange={set('inStock')}
              label="In stock"
              hint="Unchecked shows it as out of stock but keeps the page live"
            />
            <Toggle
              id="p-featured"
              checked={values.featured}
              onChange={set('featured')}
              label="Featured"
              hint="Shows in the featured row on the homepage"
            />
          </div>
        </fieldset>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={saving || uploading} className="btn-primary">
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
        </button>
        <Link href="/admin/products" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, hint, required, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
        {required && <span className="text-error-500"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

function Toggle({ id, checked, onChange, label, hint }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-brand-700"
      />
      <span>
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        <span className="block text-xs text-ink-500">{hint}</span>
      </span>
    </label>
  );
}
