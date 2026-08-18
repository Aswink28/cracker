'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Loader2, Search, Star } from 'lucide-react';
import {
  listAdminProducts,
  deleteProduct,
  listAdminCategories,
  errorMessage,
} from '@/lib/adminApi';
import { formatPrice, effectivePrice, cn } from '@/lib/format';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdminProducts({
        search: search || undefined,
        category: category || undefined,
        limit: 60,
        sort: 'newest',
      });
      setProducts(data.products);
      setTotal(data.total);
    } catch (err) {
      setError(errorMessage(err, 'Could not load products'));
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listAdminCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  async function handleDelete(product) {
    // Deleting a product is irreversible and removes its image, so it always
    // requires an explicit confirmation naming the product.
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone and its image will be removed.`,
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the product'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-950">Products</h2>
          <p className="text-sm text-ink-500">{total} total</p>
        </div>

        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Add product
        </Link>
      </div>

      {/* Filters */}
      <form
        className="mt-4 flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <div className="relative min-w-56 flex-1">
          <label htmlFor="admin-search" className="sr-only">
            Search products
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="admin-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="input pl-9"
          />
        </div>

        <div>
          <label htmlFor="admin-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="admin-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-auto"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-secondary">
          Apply
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-ink-300 bg-white px-4 py-10 text-center text-sm text-ink-500">
          No products match. Try clearing the filters, or add a new product.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-ink-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-100">
              {products.map((product) => (
                <tr key={product.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-950">{product.name}</span>
                      {product.featured && (
                        <Star
                          className="h-3.5 w-3.5 fill-gold-400 text-gold-500"
                          aria-label="Featured"
                        />
                      )}
                    </div>
                    <code className="text-xs text-ink-400">/{product.slug}</code>
                  </td>

                  <td className="px-4 py-3 text-ink-600">{product.category?.name ?? '-'}</td>

                  <td className="px-4 py-3">
                    <span className="font-semibold text-ink-950">
                      {formatPrice(effectivePrice(product))}
                    </span>
                    {product.discountPercentage > 0 && (
                      <span className="ml-1.5 text-xs text-ink-400 line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        product.active
                          ? 'bg-success-50 text-success-700'
                          : 'bg-ink-100 text-ink-500',
                      )}
                    >
                      {product.active ? 'Active' : 'Disabled'}
                    </span>
                    {!product.inStock && (
                      <span className="ml-1.5 inline-flex rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
                        No stock
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-error-50 hover:text-error-700 disabled:opacity-50"
                        aria-label={`Delete ${product.name}`}
                      >
                        {deletingId === product.id ? (
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
