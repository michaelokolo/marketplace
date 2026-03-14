'use client';
import { useState, useEffect } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import useAccountStatus from '@/hooks/useAccountStatus';
const API_URL = 'http://localhost:4242/api';
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  priceId: string;
  period: string | null;
}
export default function Products() {
  const { accountId } = useAccount();
  const { needsOnboarding } = useAccountStatus();
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (!accountId || needsOnboarding) return;
    const fetchProducts = async () => {
      const res = await fetch(`${API_URL}/products/${accountId}`);
      const data: Product[] = await res.json();
      setProducts(data);
    };
    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, [accountId, needsOnboarding]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {' '}
      {products.map((product) => (
        <div key={product.priceId} className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold">  {product.name}</h3>

          <p className="text-gray-600 mt-1">  {product.description}</p>

          <p className="text-xl font-bold mt-3">
            ${((product.price ?? 0) / 100).toFixed(2)}
            {product.period ? ` / ${product.period}` : ''}
          </p>

          <form action={`${API_URL}/create-checkout-session`} method="POST">
            <input type="hidden" name="priceId" value={product.priceId} />
            <input type="hidden" name="accountId" value={accountId ?? ''} />
            <button
              type="submit"
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {product.period ? 'Subscribe' : 'Buy Now'}
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
