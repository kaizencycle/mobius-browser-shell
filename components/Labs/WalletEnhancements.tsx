/**
 * WalletEnhancements.tsx
 * WAL-01 through WAL-20: UI/UX enhancements for the Fractal Wallet Lab (C-313)
 */
import React, { useState, useEffect } from 'react';
import { Copy, Check, ChevronRight, BookOpen, Zap, Shield, BarChart2, TrendingUp } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { env } from '../../config/env';
import { TabId } from '../../types';

// ── Local types ────────────────────────────────────────────────────────────────

export interface MicTransaction {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  bonus?: string;
}

// ── Shared constants ───────────────────────────────────────────────────────────

const EARNING_SOURCE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  learning_module_completion: { icon: '📚', label: 'Learning Module', color: 'text-amber-600 bg-amber-50' },
  oaa_tutor_question: { icon: '🎓', label: 'OAA Question', color: 'text-blue-600 bg-blue-50' },
  oaa_tutor_session_complete: { icon: '🎓', label: 'OAA Session Complete', color: 'text-blue-600 bg-blue-50' },
  reflection_entry_created: { icon: '✨', label: 'Reflection Created', color: 'text-purple-600 bg-purple-50' },
  reflection_phase_complete: { icon: '✨', label: 'Reflection Phase', color: 'text-purple-600 bg-purple-50' },
  reflection_entry_complete: { icon: '✨', label: 'Reflection Complete', color: 'text-purple-600 bg-purple-50' },
  reflection_spark: { icon: '✨', label: 'Reflection Bonus', color: 'text-fuchsia-600 bg-fuchsia-50' },
  reflection_geist_mode: { icon: '✨', label: 'Reflection Bonus', color: 'text-indigo-600 bg-indigo-50' },
  reflection_epiphany: { icon: '✨', label: 'Reflection Bonus', color: 'text-violet-600 bg-violet-50' },
  agent_creation_burn: { icon: '🔥', label: 'Agent Forge Burn', color: 'text-red-600 bg-red-50' },
  shield_module_complete: { icon: '🛡️', label: 'Shield Module Complete', color: 'text-green-600 bg-green-50' },
  shield_checklist_item: { icon: '🛡️', label: 'Shield Checklist', color: 'text-green-600 bg-green-50' },
  civic_radar_action_taken: { icon: '📡', label: 'Civic Radar Action', color: 'text-orange-600 bg-orange-50' },
};

const DOMAIN_EARN_COLORS: Record<string, string> = {
  learning: '#3b82f6',
  reflection: '#8b5cf6',
  civic: '#10b981',
  system: '#f59e0b',
  personal: '#ec4899',
};

// ── WAL-01: BalanceCard ────────────────────────────────────────────────────────

interface BalanceCardProps {
  balance: number;
  level?: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, level = 1 }) => {
  return (
    <div
      id="wallet-balance-card"
      className="relative overflow-hidden rounded-2xl p-6 scroll-mt-4"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        boxShadow: '0 0 40px rgba(212,175,55,0.15), 0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Ambient gold glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)' }}
      />

      {/* Testnet watermark — also rendered by WAL-10 below */}
      {env.network.isTestnet && (
        <span className="absolute top-4 right-4 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded uppercase tracking-wide">
          Testnet
        </span>
      )}

      <div className="relative z-10">
        <div className="text-[10px] font-bold text-amber-300/70 uppercase tracking-widest mb-1">
          Available Balance
        </div>
        <div className="flex items-end gap-2 mb-1">
          <span className="text-4xl font-mono font-semibold text-white">
            ⬡ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-base text-amber-300/60 mb-1">MIC</span>
        </div>
        <div className="text-xs text-amber-400/80 font-mono tracking-widest mt-2">
          LEVEL {level} CITIZEN
        </div>
      </div>
    </div>
  );
};

// ── WAL-02: TransactionFeed ────────────────────────────────────────────────────

interface TransactionFeedProps {
  transactions: MicTransaction[];
  searchQuery?: string;
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({ transactions, searchQuery = '' }) => {
  const filtered = searchQuery
    ? transactions.filter((tx) =>
        tx.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (EARNING_SOURCE_LABELS[tx.source]?.label ?? tx.source)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : transactions;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-6 text-stone-400 text-xs">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-stone-100">
      {filtered.map((tx) => {
        const src = EARNING_SOURCE_LABELS[tx.source] ?? {
          icon: '💫',
          label: tx.source,
          color: 'text-gray-600 bg-gray-50',
        };
        const isDebit = tx.amount < 0;

        return (
          <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${src.color}`}>
                {src.icon} {src.label}
              </span>
              {tx.bonus && (
                <span className="text-xs text-orange-500 font-medium shrink-0">🔥 {tx.bonus}</span>
              )}
              <span className="text-[11px] text-stone-400 truncate">
                {new Date(tx.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className={`font-mono text-sm font-semibold shrink-0 ${isDebit ? 'text-red-500' : 'text-emerald-600'}`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} MIC
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── WAL-03: BalanceSparkline ───────────────────────────────────────────────────

interface BalanceSparklineProps {
  snapshots: Array<{ date: string; balance: number }>;
}

export const BalanceSparkline: React.FC<BalanceSparklineProps> = ({ snapshots }) => {
  if (snapshots.length < 2) {
    return (
      <div className="flex items-center justify-center h-16 text-stone-300 text-xs">
        Not enough data yet
      </div>
    );
  }

  const w = 280;
  const h = 64;
  const pad = 4;
  const min = Math.min(...snapshots.map((s) => s.balance));
  const max = Math.max(...snapshots.map((s) => s.balance));
  const range = max - min || 1;

  const points = snapshots.map((s, i) => ({
    x: pad + (i / (snapshots.length - 1)) * (w - pad * 2),
    y: h - pad - ((s.balance - min) / range) * (h - pad * 2),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1]!.x.toFixed(1)} ${h} L ${points[0]!.x.toFixed(1)} ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" aria-label="Balance over 30 days">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── WAL-04: EarnOpportunities ──────────────────────────────────────────────────

interface EarnOpportunitiesProps {
  onNavigate?: (tab: TabId) => void;
}

const EARN_OPS = [
  { label: 'OAA Module', desc: 'Complete a learning module', range: '1–5 MIC', tab: TabId.OAA, icon: '📚' },
  { label: 'HIVE Quest', desc: 'Contribute to a HIVE zone', range: '2–8 MIC', tab: TabId.HIVE, icon: '🐝' },
  { label: 'Streak Bonus', desc: 'Maintain your daily streak', range: '+0.3/day', tab: TabId.REFLECTIONS, icon: '🔥' },
  { label: 'Vault Attest', desc: 'Attest a sealed reflection', range: '0.5–3 MIC', tab: TabId.KNOWLEDGE_GRAPH, icon: '🔐' },
];

export const EarnOpportunities: React.FC<EarnOpportunitiesProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 bg-amber-50/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Earn Opportunities
        </h3>
      </div>
      <div className="divide-y divide-stone-100">
        {EARN_OPS.map((op) => (
          <div key={op.label} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors gap-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">{op.icon}</span>
              <div>
                <div className="text-sm font-medium text-stone-800">{op.label}</div>
                <div className="text-[11px] text-stone-400">{op.desc}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono text-emerald-600 font-semibold">{op.range}</span>
              <button
                type="button"
                onClick={() => onNavigate?.(op.tab)}
                className="px-3 py-1 rounded-lg bg-amber-500 text-stone-900 text-[11px] font-semibold hover:bg-amber-400 transition-colors flex items-center gap-1"
              >
                Go <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── WAL-05: GenesisGrantBanner ─────────────────────────────────────────────────

interface GenesisGrantBannerProps {
  balance: number;
}

export const GenesisGrantBanner: React.FC<GenesisGrantBannerProps> = ({ balance }) => {
  if (balance >= 10) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
        <span className="text-xl">🎉</span>
        <span className="font-medium">Genesis grant received — you're building your MIC balance!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
      <span className="text-xl">🌱</span>
      <div>
        <span className="font-medium">Complete your first activity to unlock your Genesis grant.</span>
        <span className="ml-2 text-amber-600 font-mono text-xs">+50 MIC on first earn</span>
      </div>
    </div>
  );
};

// ── WAL-06: MICConstitutionLink ────────────────────────────────────────────────

export const MICConstitutionLink: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
          <BookOpen className="w-4 h-4 text-amber-500" />
          What is MIC?
        </div>
        <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 text-xs text-stone-500 leading-relaxed space-y-2 border-t border-stone-100 pt-3">
          <p>
            <strong className="text-stone-700">MIC (Mobius Integrity Credits)</strong> is the epistemic
            currency of the Mobius network. It is minted through verified learning and civic contribution —
            not computation or capital.
          </p>
          <p>
            Issuance is governed by <strong className="text-stone-700">Proof of Coherence</strong>: your
            contributions are assessed for consistency, accuracy, and civic value before MIC is awarded.
          </p>
          <p>
            The protocol is released under <strong className="text-stone-700">CC0</strong> — no licenses,
            no rent. The substrate belongs to its citizens.
          </p>
        </div>
      )}
    </div>
  );
};

// ── WAL-07: VaultSealViewer ────────────────────────────────────────────────────

const MOCK_SEALS = [
  { cycle: 'C-311', giScore: 0.94, status: 'sealed' as const },
  { cycle: 'C-312', giScore: 0.97, status: 'sealed' as const },
  { cycle: 'C-313', giScore: 0.91, status: 'pending' as const },
];

export const VaultSealViewer: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/70">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          Recent Vault Seals
        </h3>
      </div>
      <div className="divide-y divide-stone-100">
        {MOCK_SEALS.map((seal) => (
          <div key={seal.cycle} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-stone-600">{seal.cycle}</span>
              <span className="text-xs text-stone-400">GI: {seal.giScore.toFixed(2)}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                seal.status === 'sealed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {seal.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── WAL-08: PendingRewards ─────────────────────────────────────────────────────

const MOCK_PENDING = [
  { label: 'OAA Module in progress', est: 2.5 },
  { label: 'Reflection sequence active', est: 1.0 },
  { label: 'HIVE contribution queued', est: 3.0 },
];

export const PendingRewards: React.FC = () => {
  const total = MOCK_PENDING.reduce((sum, p) => sum + p.est, 0);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Pending Rewards</h3>
        <span className="text-xs font-mono text-amber-600 font-semibold">⬡ ~{total.toFixed(1)} MIC</span>
      </div>
      <div className="divide-y divide-stone-100">
        {MOCK_PENDING.map((p) => (
          <div key={p.label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-stone-600">{p.label}</span>
            <span className="text-xs font-mono text-emerald-600">+{p.est.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── WAL-09: CivicIntegrityImpact ───────────────────────────────────────────────

export const CivicIntegrityImpact: React.FC = () => {
  const mii = 0.95;
  const high = mii >= 0.90;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
      high ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div
        className={`w-3 h-3 rounded-full shrink-0 ${high ? 'bg-emerald-500' : 'bg-amber-400'}`}
        style={{ boxShadow: high ? '0 0 6px rgba(16,185,129,0.7)' : '0 0 6px rgba(245,158,11,0.7)' }}
      />
      <span className={high ? 'text-emerald-800' : 'text-amber-800'}>
        Your MII: <strong>{mii.toFixed(2)}</strong> —{' '}
        {high ? 'High integrity multiplier active' : 'Integrity building — keep going!'}
      </span>
    </div>
  );
};

// ── WAL-10: TestnetWatermark ───────────────────────────────────────────────────

export const TestnetWatermark: React.FC = () => {
  if (!env.network.isTestnet) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden rounded-2xl"
      aria-hidden="true"
    >
      <div
        className="text-5xl font-black text-stone-900/5 uppercase tracking-widest"
        style={{ transform: 'rotate(-35deg)', letterSpacing: '0.3em' }}
      >
        TESTNET
      </div>
    </div>
  );
};

// ── WAL-11: StreakBonusIndicator ───────────────────────────────────────────────

export const StreakBonusIndicator: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs text-orange-700 font-medium">
      <span>🔥</span>
      <span>Active streak: <strong>+0.3 MIC/day</strong> bonus while active</span>
    </div>
  );
};

// ── WAL-12: TransactionSearch ──────────────────────────────────────────────────

interface TransactionSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export const TransactionSearch: React.FC<TransactionSearchProps> = ({ value, onChange }) => {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search transactions by source…"
      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition"
    />
  );
};

// ── WAL-13: EmptyWalletOnboarding ─────────────────────────────────────────────

interface EmptyWalletOnboardingProps {
  onNavigate?: (tab: TabId) => void;
}

export const EmptyWalletOnboarding: React.FC<EmptyWalletOnboardingProps> = ({ onNavigate }) => {
  const paths = [
    { label: 'Start an OAA module', tab: TabId.OAA, icon: '📚' },
    { label: 'Write a Reflection', tab: TabId.REFLECTIONS, icon: '✨' },
    { label: 'Join a HIVE zone', tab: TabId.HIVE, icon: '🐝' },
  ];

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="text-4xl">🌱</div>
      <p className="text-stone-500 text-sm">You haven't earned any MIC yet.</p>
      <p className="text-stone-400 text-xs max-w-xs">Start contributing to the Mobius substrate to grow your balance.</p>
      <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
        {paths.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onNavigate?.(p.tab)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors"
          >
            <span>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── WAL-14: MICIssuanceExplainer ──────────────────────────────────────────────

export const MICIssuanceExplainer: React.FC = () => {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 leading-relaxed">
      <span className="text-lg mt-0.5">ℹ️</span>
      <span>
        MIC is minted through verified learning and civic contribution — not computation or capital.
        Every credit represents a genuine epistemic act.
      </span>
    </div>
  );
};

// ── WAL-15: WalletShareButton ──────────────────────────────────────────────────

interface WalletShareButtonProps {
  balance: number;
  level?: number;
}

export const WalletShareButton: React.FC<WalletShareButtonProps> = ({ balance, level = 1 }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `I've earned ⬡ ${balance.toFixed(2)} MIC as a Level ${level} Mobius Citizen.`;
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-200 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Share Balance'}
    </button>
  );
};

// ── WAL-16: AccuracyBonus ──────────────────────────────────────────────────────

interface AccuracyBonusProps {
  accuracy?: number;
}

export const AccuracyBonus: React.FC<AccuracyBonusProps> = ({ accuracy = 78 }) => {
  const multiplier = accuracy >= 90 ? 1.5 : accuracy >= 75 ? 1.25 : 1.0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs">
      <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
      <span className="text-indigo-700">
        OAA accuracy: <strong>{accuracy}%</strong> → <strong className="text-indigo-900">×{multiplier.toFixed(2)} bonus multiplier</strong>
      </span>
    </div>
  );
};

// ── WAL-17: DomainBreakdown ────────────────────────────────────────────────────

interface DomainBreakdownProps {
  events?: Array<{ source: string; amount: number }>;
}

const SOURCE_TO_DOMAIN: Record<string, string> = {
  learning_module_completion: 'learning',
  oaa_tutor_question: 'learning',
  oaa_tutor_session_complete: 'learning',
  reflection_entry_created: 'reflection',
  reflection_phase_complete: 'reflection',
  reflection_entry_complete: 'reflection',
  reflection_spark: 'reflection',
  reflection_geist_mode: 'reflection',
  reflection_epiphany: 'reflection',
  civic_radar_action_taken: 'civic',
  shield_module_complete: 'system',
  shield_checklist_item: 'system',
  agent_creation_burn: 'personal',
};

export const DomainBreakdown: React.FC<DomainBreakdownProps> = ({ events = [] }) => {
  const totals: Record<string, number> = { learning: 0, reflection: 0, civic: 0, system: 0, personal: 0 };

  events.forEach((ev) => {
    const domain = SOURCE_TO_DOMAIN[ev.source] ?? 'personal';
    totals[domain] = (totals[domain] ?? 0) + Math.max(0, ev.amount);
  });

  const grand = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
  const entries = Object.entries(totals).filter(([, v]) => v > 0);

  if (entries.length === 0) {
    return (
      <div className="text-xs text-stone-400 px-4 py-3">No domain data yet.</div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-4 py-4 space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
        <BarChart2 className="w-3.5 h-3.5" />
        MIC by Domain
      </div>
      {entries.map(([domain, val]) => (
        <div key={domain} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="capitalize text-stone-600">{domain}</span>
            <span className="font-mono text-stone-700">{val.toFixed(1)} MIC</span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(val / grand) * 100}%`,
                backgroundColor: DOMAIN_EARN_COLORS[domain] ?? '#94a3b8',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── WAL-18: CycleEarnings ─────────────────────────────────────────────────────

interface CycleEarningsProps {
  amount?: number;
  cycle?: string;
}

export const CycleEarnings: React.FC<CycleEarningsProps> = ({ amount = 0, cycle = 'C-313' }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-medium">
      <span className="font-mono">This cycle ({cycle}):</span>
      <span className="font-bold">⬡ {amount.toFixed(2)} MIC earned</span>
    </div>
  );
};

// ── WAL-19: WalletSkeleton ────────────────────────────────────────────────────

export const WalletSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Loading wallet…">
      {/* Balance card shimmer */}
      <div className="rounded-2xl h-28 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />

      {/* Transaction rows shimmer */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-stone-100">
          <div className="h-6 w-24 rounded bg-stone-200" />
          <div className="flex-1 h-4 rounded bg-stone-100" />
          <div className="h-5 w-16 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
};

// ── WAL-20: QRShare ────────────────────────────────────────────────────────────

interface QRShareProps {
  walletAddress?: string;
}

export const QRShare: React.FC<QRShareProps> = ({ walletAddress = '0x7f4a…ae21' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-4 py-4">
      <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Share Wallet</div>
      <div className="flex items-center gap-3">
        {/* Placeholder QR box */}
        <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-2xl shrink-0">
          🔲
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-stone-500 mb-1">Wallet address</div>
          <div className="font-mono text-sm text-stone-800 truncate">{walletAddress}</div>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy address'}
          </button>
        </div>
      </div>
      <div className="mt-3 text-[10px] text-stone-400">QR code will be available at mainnet launch.</div>
    </div>
  );
};

// ── Convenience re-export of useWallet for consumers ──────────────────────────

export { useWallet };
