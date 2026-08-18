'use client';

import { use, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import { getAdminProduct, errorMessage } from '@/lib/adminApi';

export default function EditProductPage({ params }) {
  // `params` is a promise in Next 15+; `use` unwraps it in a client component.
  const { id } = use(params);

  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getAdminProduct(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load this product'));
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
        {error}
      </p>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading product...
      </div>
    );
  }

  return <ProductForm product={product} />;
}
