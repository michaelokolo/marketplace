'use client';
import { useState, useEffect } from 'react';
import { useAccount } from '@/contexts/AccountContext';
interface AccountStatus {
  id: string;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
}
export default function useAccountStatus() {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const { accountId, setAccountId } = useAccount();
  useEffect(() => {
    if (!accountId) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:4242/api/account-status/${accountId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: AccountStatus = await res.json();
        setAccountStatus(data);
      } catch {
        setAccountId(null);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [accountId, setAccountId]);
  return {
    accountStatus,
    needsOnboarding: !accountStatus?.chargesEnabled && !accountStatus?.detailsSubmitted,
  };
}
