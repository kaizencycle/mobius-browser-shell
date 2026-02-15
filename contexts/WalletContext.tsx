// contexts/WalletContext.tsx
/**
 * MIC Wallet Context
 *
 * Manages the user's MIC (Mobius Integrity Credits) wallet state.
 *
 * Architecture:
 * - Backend ledger (API): Production source of truth
 * - Local blockchain: Client-side SHA-256 hash-linked chain for transparency
 * - Every MIC event is recorded to BOTH the API ledger and the local blockchain
 * - Wallet balance is derived (never stored directly)
 *
 * API Endpoints:
 * - GET  /mic/wallet  — Get wallet balance (derived from ledger)
 * - GET  /mic/events  — Get recent ledger events
 * - POST /mic/earn    — Write earning event to ledger
 */
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { env } from '../config/env';
import { useMICBlockchain, MICBlock, MICTransaction, ChainStats } from '../hooks/useMICBlockchain';

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
  // ── API wallet ──
  wallet: WalletData | null;
  events: MICEvent[];
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  earnMIC: (source: string, meta?: Record<string, unknown>) => Promise<boolean>;

  // ── Local blockchain ──
  blockchain: MICBlock[];
  chainStats: ChainStats;
  chainLoading: boolean;
  getChainBalance: (recipient: string) => number;
  getChainTransactions: (recipient: string) => (MICTransaction & { blockIndex: number; blockHash: string; timestamp: string })[];
  getAllHolders: () => { recipient: string; balance: number; txCount: number }[];
  verifyChain: () => Promise<boolean>;
  getBlock: (index: number) => MICBlock | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [events, setEvents] = useState<MICEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Local blockchain ──
  const {
    chain: blockchain,
    stats: chainStats,
    loading: chainLoading,
    addBlock,
    getBalance: getChainBalance,
    getTransactions: getChainTransactions,
    getAllHolders,
    verifyChain,
    getBlock,
  } = useMICBlockchain();

  const API_BASE = env.api.micWallet;

  // ── Refresh from API ──
  const refreshWallet = useCallback(async () => {
    if (!token) {
      setWallet(null);
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const walletResponse = await fetch(`${API_BASE}/mic/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet(walletData);
        if (env.features.debugMode) console.log('Wallet refreshed:', walletData);
      } else if (walletResponse.status === 401) {
        setError('Authentication required');
      } else {
        const errorData = await walletResponse.json().catch(() => ({}));
        setError(errorData.message || 'Failed to fetch wallet');
      }

      const eventsResponse = await fetch(`${API_BASE}/mic/events?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
      setError('Network error - could not reach wallet service');
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE]);

  // ── Earn MIC: writes to API ledger AND local blockchain ──
  const earnMIC = useCallback(
    async (source: string, meta?: Record<string, unknown>): Promise<boolean> => {
      const recipient = user?.id || user?.email || 'local-user';
      const amount = (meta?.mic_earned as number) ?? 0;

      // 1. Always write to local blockchain (works offline)
      try {
        const tx: MICTransaction = {
          source,
          amount,
          recipient,
          meta,
        };
        await addBlock([tx]);
        if (env.features.debugMode) {
          console.log('Block mined to local chain:', { source, amount, recipient });
        }
      } catch (blockErr) {
        console.warn('Failed to write to local blockchain:', blockErr);
      }

      // 2. Write to API if authenticated
      if (!token) {
        // Not logged in — local chain is the only record
        return true;
      }

      try {
        const response = await fetch(`${API_BASE}/mic/earn`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ source, meta: meta || {} }),
        });

        if (response.ok) {
          const result = await response.json();
          if (env.features.debugMode) {
            console.log('MIC earned (API):', {
              amount: result.amount,
              ledger_proof: result.ledger_proof,
              new_balance: result.new_balance,
            });
          }
          await refreshWallet();
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to earn MIC (API):', errorData);
          if (response.status === 503 && errorData.circuit_breaker_active) {
            console.warn('MIC minting halted - circuit breaker active');
          }
          // API failed but local chain still recorded
          return true;
        }
      } catch (err) {
        console.error('Failed to earn MIC (API):', err);
        // Network error but local chain recorded
        return true;
      }
    },
    [token, API_BASE, refreshWallet, addBlock, user],
  );

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        events,
        loading,
        error,
        refreshWallet,
        earnMIC,
        blockchain,
        chainStats,
        chainLoading,
        getChainBalance,
        getChainTransactions,
        getAllHolders,
        verifyChain,
        getBlock,
      }}
    >
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
