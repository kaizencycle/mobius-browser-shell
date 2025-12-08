// contexts/WalletContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { env } from '../config/env';

interface WalletData {
  user_id: string;
  balance: number;
  total_earned: number;
  event_count: number;
}

interface MICEvent {
  id: string;
  source: string;
  amount: number;
  meta: Record<string, unknown> | null;
  created_at: string;
}

interface WalletContextType {
  wallet: WalletData | null;
  events: MICEvent[];
  loading: boolean;
  refreshWallet: () => Promise<void>;
  earnMIC: (source: string, meta?: Record<string, unknown>) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [events, setEvents] = useState<MICEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = env.api.micWallet;

  const refreshWallet = useCallback(async () => {
    if (!token) {
      setWallet(null);
      setEvents([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch wallet balance
      const walletResponse = await fetch(`${API_BASE}/mic/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet(walletData);
      }

      // Fetch recent events
      const eventsResponse = await fetch(`${API_BASE}/mic/events?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE]);

  // Earn MIC and refresh wallet
  const earnMIC = useCallback(async (source: string, meta?: Record<string, unknown>): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/mic/earn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source, meta: meta || {} }),
      });

      if (response.ok) {
        // Refresh wallet to show new balance
        await refreshWallet();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to earn MIC:', error);
      return false;
    }
  }, [token, API_BASE, refreshWallet]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <WalletContext.Provider value={{ wallet, events, loading, refreshWallet, earnMIC }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
