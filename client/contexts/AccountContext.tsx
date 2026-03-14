'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

interface AccountContextType {
  accountId: string | null;
  setAccountId: (id: string | null) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function useAccount(): AccountContextType {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return context;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [accountId, setAccountId] = useState<string | null>(searchParams.get('accountId'));

  return (
    <AccountContext.Provider value={{ accountId, setAccountId }}>
      {children}
    </AccountContext.Provider>
  );
}
