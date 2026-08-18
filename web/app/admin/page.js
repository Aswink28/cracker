'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Tags, Star, EyeOff, Plus, Loader2 } from 'lucide-react';
import { listAdminProducts, listAdminCategories, errorMessage } from '@/lib/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [all, inactive, featured, categories] = await Promise.all([
          listAdminProducts({ limit: 1 }),
          listAdminProducts({ limit: 1, active: false }),
          listAdminProducts({ limit: 1, featured: true }),
          listAdminCategories(),
        ]);

        if (cancelled) return;
        setStats({
          products: all.total,
          inactive: inactive.total,
          featured: featured.total,
          categories: categories.length,
        });
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load dashboard data'));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
        {error}
      </p>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading...
      </div>
    );
  }

  const cards = [
    { label: 'Total products', value: stats.products, icon: Package, href: '/admin/products' },
    { label: 'Categories', value: stats.categories, icon: Tags, href: '/admin/categories' },
    { label: 'Featured', value: stats.featured, icon: Star, href: '/admin/products' },
    { label: 'Disabled', value: stats.inactive, icon: EyeOff, href: '/admin/products' },
  ];

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label}>
            <Link
              href={card.href}
              className="flex flex-col rounded-card border border-ink-200 bg-white p-4 hover:border-brand-300"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <card.icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className="mt-3 text-2xl font-bold text-ink-950">{card.value}</span>
              <span className="text-sm text-ink-500">{card.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Add product
        </Link>
        <Link href="/admin/categories" className="btn-secondary">
          Manage categories
        </Link>
      </div>

      <div className="mt-8 rounded-card border border-ink-200 bg-white p-5">
        <h2 className="text-base font-bold text-ink-950">How changes reach the site</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Saving a product or category tells the storefront to re-render the affected
          pages straight away. If a change does not appear within a minute, check that
          <code className="mx-1 rounded bg-ink-100 px-1 py-0.5 text-xs">REVALIDATE_URL</code>
          and
          <code className="mx-1 rounded bg-ink-100 px-1 py-0.5 text-xs">REVALIDATE_SECRET</code>
          are set on the API and match the storefront.
        </p>
      </div>
    </div>
  );
}
