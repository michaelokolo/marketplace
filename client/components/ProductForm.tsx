'use client';
import { useState } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import useAccountStatus from '@/hooks/useAccountStatus';
const API_URL = 'http://localhost:4242/api';
interface ProductFormData {
  productName: string;
  productDescription: string;
  productPrice: number;
}
export default function ProductForm() {
  const { accountId } = useAccount();
  const { needsOnboarding } = useAccountStatus();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProductFormData>({
    productName: '',
    productDescription: '',
    productPrice: 1000,
  });
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!accountId || needsOnboarding) return;
    await fetch(`${API_URL}/create-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        accountId,
      }),
    }); // Reset form and hide it
    setFormData({
      productName: '',
      productDescription: '',
      productPrice: 1000,
    });
    setShowForm(false);
  }; // Only show the form if the merchant has completed
  // onboarding and can accept charges
  if (!accountId || needsOnboarding) return null;
  return (
    <div className="my-6">
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {showForm ? 'Cancel' : 'Add New Product'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>

            <input
              type="text"
              value={formData.productName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productName: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={formData.productDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productDescription: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (in cents)</label>

            <input
              type="number"
              value={formData.productPrice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productPrice: parseInt(e.target.value),
                })
              }
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Product
          </button>
        </form>
      )}
    </div>
  );
}
