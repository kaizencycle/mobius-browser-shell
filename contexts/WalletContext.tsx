// contexts/WalletContext.tsx
/**
 * MIC Wallet Context
 * 
 * Manages the user's MIC (Mobius Integrity Credits) wallet state.
 * 
 * Key Architecture:
 * - Wallet balance is DERIVED from ledger (never stored directly)
 * - All MIC changes go through the append-only ledger
 * - Frontend calls earnMIC() -> Backend writes to ledger -> Frontend refreshes wallet
 * 
 * API Endpoints (via OAA API or dedicated wallet service):
 * - GET /mic/wallet - Get wallet balance (derived from ledger)
 * - GET /mic/events - Get recent ledger events
 * - POST /mic/earn - Write earning event to ledger
 */
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { env } from '../config/env';

interface WalletData {
  user_id: string;
  balance: number;
  total_earned: number;
  event_count: number;
  gii?: number;
  circuit_breaker_active?: boolean;
}

interface MICEvent {
  id: string;
  source: string;
  amount: number;
  reason?: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  integrity_score?: number;
  gii?: number;
}

interface WalletContextType {
  wallet: WalletData | null;
  events: MICEvent[];
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  earnMIC: (source: string, meta?: Record<string, unknown>) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [events, setEvents] = useState<MICEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API_BASE already includes /api suffix when using OAA wallet
  const API_BASE = env.api.micWallet;

  const refreshWallet = useCallback(async () => {
    if (!token) {
      setWallet(null);
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch wallet balance (derived from ledger)
      const walletResponse = await fetch(`${API_BASE}/mic/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet(walletData);
        
        if (env.features.debugMode) {
          console.log('💰 Wallet refreshed:', walletData);
        }
      } else if (walletResponse.status === 401) {
        setError('Authentication required');
      } else {
        const errorData = await walletResponse.json().catch(() => ({}));
        setError(errorData.message || 'Failed to fetch wallet');
      }

      // Fetch recent events from ledger
      const eventsResponse = await fetch(`${API_BASE}/mic/events?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
        
        if (env.features.debugMode) {
          console.log('📜 Ledger events:', eventsData.length, 'entries');
        }
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
      setError('Network error - could not reach wallet service');
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE]);

  // Earn MIC - writes to ledger and refreshes wallet
  const earnMIC = useCallback(async (source: string, meta?: Record<string, unknown>): Promise<boolean> => {
    if (!token) {
      console.warn('Cannot earn MIC: not authenticated');
      return false;
    }

    try {
      if (env.features.debugMode) {
        console.log('🪙 Earning MIC:', { source, meta });
      }
      
      const response = await fetch(`${API_BASE}/mic/earn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source, meta: meta || {} }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (env.features.debugMode) {
          console.log('✅ MIC earned:', {
            amount: result.amount,
            ledger_proof: result.ledger_proof,
            new_balance: result.new_balance
          });
        }
        
        // Refresh wallet to show new balance (derived from ledger)
        await refreshWallet();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to earn MIC:', errorData);
        
        // Check for circuit breaker
        if (response.status === 503 && errorData.circuit_breaker_active) {
          console.warn('⚠️ MIC minting halted - circuit breaker active');
        }
        
        return false;
      }
    } catch (err) {
      console.error('Failed to earn MIC:', err);
      return false;
    }
  }, [token, API_BASE, refreshWallet]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <WalletContext.Provider value={{ wallet, events, loading, error, refreshWallet, earnMIC }}>
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
