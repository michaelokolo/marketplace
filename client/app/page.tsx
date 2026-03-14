'use client';
import { AccountProvider } from '@/contexts/AccountContext';
import ConnectOnboarding from '@/components/ConnectOnboarding';
import Products from '@/components/Products';
import ProductForm from '@/components/ProductForm';
export default function Home() {
  return (
    <AccountProvider>
      {' '}
      <main className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8"> Marketplace Dashboard </h1>
        <ConnectOnboarding />
        <ProductForm />
        <Products />
      </main>
    </AccountProvider>
  );
}
