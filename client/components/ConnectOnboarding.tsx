'use client';
import { useState } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import useAccountStatus from '@/hooks/useAccountStatus';
const API_URL = 'http://localhost:4242/api';
export default function ConnectOnboarding() {
  const [email, setEmail] = useState<string>('');
  const { accountId, setAccountId } = useAccount();
  const { accountStatus, needsOnboarding } = useAccountStatus();
  const handleCreateAccount = async () => {
    const res = await fetch(`${API_URL}/create-connect-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setAccountId(data.accountId);
  };
  const handleStartOnboarding = async () => {
    const res = await fetch(`${API_URL}/create-account-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });
    const data = await res.json();
    window.location.href = data.url;
  };
  if (!accountId) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Create Your Seller Account</h2>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />
        <button
          onClick={handleCreateAccount}
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Create Connect Account
        </button>
      </div>
    );
  }
  return (
    <div className="max-w-md mx-auto p-6">
      <h3 className="font-semibold mb-2">Account: {accountId} </h3>
      <p className="mb-2">Charges: {accountStatus?.chargesEnabled ? 'Active' : 'Pending'} </p>
      <p className="mb-4">Payouts: {accountStatus?.payoutsEnabled ? 'Active' : 'Pending'} </p>
      {needsOnboarding && (
        <button
          onClick={handleStartOnboarding}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
        >
          Complete Onboarding
        </button>
      )}
    </div>
  );
}
