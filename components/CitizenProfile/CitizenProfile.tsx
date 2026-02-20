import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from '../../utils/time';

/**
 * CitizenProfile
 *
 * A slide-in panel (right drawer) showing the authenticated citizen's
 * identity card. Triggered from the shell nav.
 *
 * Displays:
 * - Citizen handle (or "Anonymous citizen")
 * - Truncated citizenId with copy-to-clipboard
 * - Covenant acceptance timestamp
 * - Covenant hash (truncated, with copy)
 * - MIC balance (stub — wired to MIC wallet when available)
 * - Session info (authenticated at, session age)
 * - Sign out
 *
 * Design: matches AuthGate / onboarding aesthetic — stone/dark, minimal.
 */

interface CitizenProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CitizenProfile({ isOpen, onClose }: CitizenProfileProps) {
  const { citizen, signOut } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape key closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus trap: move focus to close button when drawer opens
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  if (!citizen) return null;

  const copy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const truncate = (s: string, start = 8, end = 6) =>
    s.length > start + end + 3
      ? `${s.slice(0, start)}…${s.slice(-end)}`
      : s;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Citizen profile"
        aria-modal="true"
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-stone-950 border-l border-stone-800 z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-stone-600 text-xs select-none">⬡</span>
            <span className="text-stone-400 text-xs font-medium">Citizen Identity</span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close profile"
            className="text-stone-600 hover:text-stone-400 transition-colors text-lg leading-none focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-500 rounded"
          >
            ×
          </button>
        </div>

        {/* Identity card */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Handle + avatar */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center select-none">
              <span className="text-stone-400 text-xl font-retro">⬡</span>
            </div>
            <div className="text-center flex flex-col gap-0.5">
              <p className="text-stone-100 text-base font-medium">
                {citizen.handle ? `@${citizen.handle}` : 'Anonymous citizen'}
              </p>
              {!citizen.handle && (
                <p className="text-stone-700 text-xs">No handle set</p>
              )}
            </div>
          </div>

          {/* Identity fields */}
          <div className="flex flex-col gap-2">
            <ProfileField
              label="Citizen ID"
              value={truncate(citizen.citizenId, 8, 6)}
              fullValue={citizen.citizenId}
              copyable
              onCopy={() => copy(citizen.citizenId, 'citizenId')}
              copied={copiedField === 'citizenId'}
              mono
            />

            {citizen.covenantsAcceptedAt && (
              <ProfileField
                label="Covenants accepted"
                value={formatDistanceToNow(citizen.covenantsAcceptedAt)}
                tooltip={new Date(citizen.covenantsAcceptedAt).toLocaleString()}
              />
            )}

            {citizen.covenantHash && (
              <ProfileField
                label="Covenant hash"
                value={truncate(citizen.covenantHash.replace('sha256-', ''), 8, 6)}
                fullValue={citizen.covenantHash}
                copyable
                onCopy={() => copy(citizen.covenantHash!, 'covenantHash')}
                copied={copiedField === 'covenantHash'}
                mono
              />
            )}

            <ProfileField
              label="Session started"
              value={formatDistanceToNow(citizen.authenticatedAt)}
              tooltip={new Date(citizen.authenticatedAt).toLocaleString()}
            />

            {/* MIC balance stub */}
            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-stone-900/40 border border-stone-800/50">
              <span className="text-stone-600 text-xs">MIC balance</span>
              <span className="text-stone-500 text-xs font-mono">
                ◎ — <span className="text-stone-700 italic text-[10px]">wallet coming soon</span>
              </span>
            </div>
          </div>

          {/* Covenants */}
          <div className="flex flex-col gap-2">
            <p className="text-stone-700 text-[10px] uppercase tracking-widest font-medium px-1">
              Covenants
            </p>
            {[
              { symbol: '⬡', name: 'Integrity' },
              { symbol: '◎', name: 'Ecology' },
              { symbol: '⊕', name: 'Custodianship' },
            ].map(({ symbol, name }) => (
              <div
                key={name}
                className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-stone-900/30 border border-stone-800/40"
              >
                <span className="text-stone-600 text-xs select-none w-4 text-center">{symbol}</span>
                <span className="text-stone-400 text-xs">{name}</span>
                <span className="ml-auto text-stone-600 text-[10px]">◉ accepted</span>
              </div>
            ))}
          </div>

          {/* CC0 note */}
          <p className="text-stone-800 text-[10px] leading-relaxed text-center px-2">
            Your identity is held in trust by Mobius Substrate.<br />
            CC0 public domain. No private extraction.
          </p>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-5 border-t border-stone-800/60 flex flex-col gap-2">
          <button
            onClick={() => { onClose(); signOut(); }}
            className="w-full py-2.5 px-4 text-xs text-stone-500 hover:text-stone-300 border border-stone-800 hover:border-stone-700 rounded-xl transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-500"
          >
            Sign out
          </button>
          <p className="text-stone-800 text-[10px] text-center">
            mobiussubstrate.org
          </p>
        </div>
      </aside>
    </>
  );
}

// ── ProfileField ──────────────────────────────────────────────────────────────

interface ProfileFieldProps {
  label: string;
  value: string;
  fullValue?: string;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  mono?: boolean;
  tooltip?: string;
}

function ProfileField({
  label,
  value,
  copyable,
  onCopy,
  copied,
  mono,
  tooltip,
}: ProfileFieldProps) {
  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-stone-900/40 border border-stone-800/50 gap-3"
      title={tooltip}
    >
      <span className="text-stone-600 text-xs shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`text-xs truncate ${
            mono ? 'font-mono text-stone-400' : 'text-stone-400'
          }`}
        >
          {value}
        </span>
        {copyable && onCopy && (
          <button
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="text-stone-700 hover:text-stone-400 transition-colors shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-500 rounded"
          >
            {copied ? (
              <span className="text-stone-500 text-[10px]">✓</span>
            ) : (
              <span className="text-[10px]">⎘</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
