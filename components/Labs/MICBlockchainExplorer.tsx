/**
 * MIC Blockchain Explorer
 *
 * Visual explorer for the local MIC blockchain.
 * Shows chain integrity, block details, hash links,
 * holder balances, and transaction history.
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Link2, Hash, Clock, Layers,
  ChevronDown, ChevronUp, Award, Activity, Users, Cpu,
  CheckCircle2, XCircle, Box, ArrowRight, Fingerprint
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { MICBlock } from '../../hooks/useMICBlockchain';
import { useAuth } from '../../contexts/AuthContext';

// ─── Source labels for display ──────────────────
const SOURCE_LABELS: Record<string, { icon: string; label: string }> = {
  genesis:                       { icon: '🌀', label: 'Genesis' },
  learning_module_completion:    { icon: '📚', label: 'Learning Module' },
  oaa_tutor_question:            { icon: '🎓', label: 'OAA Question' },
  oaa_tutor_session_complete:    { icon: '🎓', label: 'OAA Session' },
  reflection_entry_created:      { icon: '✨', label: 'Reflection' },
  reflection_entry_complete:     { icon: '✨', label: 'Reflection Complete' },
  shield_module_complete:        { icon: '🛡️', label: 'Shield Module' },
  civic_radar_action_taken:      { icon: '📡', label: 'Civic Radar' },
};

function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? { icon: '💎', label: source };
}

// ─── Hash display helper ──────────────────────
function shortHash(hash: string, len = 8) {
  if (!hash) return '—';
  return `${hash.slice(0, len)}...${hash.slice(-len)}`;
}

// ─── Block Card ──────────────────────────────
const BlockCard: React.FC<{
  block: MICBlock;
  isExpanded: boolean;
  onToggle: () => void;
  isGenesis: boolean;
}> = ({ block, isExpanded, onToggle, isGenesis }) => {
  const totalMic = block.transactions.reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className={`
      border rounded-xl overflow-hidden transition-all duration-200
      ${isGenesis
        ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50'
        : 'border-stone-200 bg-white hover:border-stone-300'}
    `}>
      {/* Block header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`
            w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
            ${isGenesis
              ? 'bg-amber-200 text-amber-800'
              : 'bg-stone-100 text-stone-600'}
          `}>
            #{block.index}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-stone-900 truncate">
              {isGenesis ? 'Genesis Block' : `Block #${block.index}`}
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <Hash className="w-3 h-3 flex-shrink-0" />
              <span className="font-mono truncate">{shortHash(block.hash)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {totalMic > 0 && (
            <span className="text-sm font-bold text-amber-500">+{totalMic} MIC</span>
          )}
          <span className="text-xs text-stone-400">
            {block.transactions.length} tx
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-stone-100 pt-3 space-y-3">
          {/* Hash details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-stone-400 mb-0.5 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Block Hash
              </div>
              <div className="font-mono text-stone-700 break-all text-[11px] leading-relaxed">
                {block.hash}
              </div>
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-stone-400 mb-0.5 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Previous Hash
              </div>
              <div className="font-mono text-stone-700 break-all text-[11px] leading-relaxed">
                {block.previousHash === '0'.repeat(64) ? '0×64 (genesis)' : block.previousHash}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-stone-400 mb-0.5">Nonce</div>
              <div className="font-mono text-stone-700">{block.nonce}</div>
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-stone-400 mb-0.5">Merkle Root</div>
              <div className="font-mono text-stone-700 truncate" title={block.merkleRoot}>
                {shortHash(block.merkleRoot, 6)}
              </div>
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-stone-400 mb-0.5">Timestamp</div>
              <div className="text-stone-700">
                {new Date(block.timestamp).toLocaleString('en-US', {
                  month: 'short', day: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
              Transactions ({block.transactions.length})
            </h4>
            <div className="space-y-1.5">
              {block.transactions.map((tx, idx) => {
                const src = sourceLabel(tx.source);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs bg-stone-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>{src.icon}</span>
                      <span className="font-medium text-stone-700">{src.label}</span>
                      <ArrowRight className="w-3 h-3 text-stone-300" />
                      <span className="font-mono text-stone-500 truncate max-w-[120px]" title={tx.recipient}>
                        {tx.recipient.length > 16 ? shortHash(tx.recipient, 6) : tx.recipient}
                      </span>
                    </div>
                    <span className={`font-bold ${tx.amount > 0 ? 'text-amber-500' : 'text-stone-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} MIC
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Explorer Component ────────────────
export const MICBlockchainExplorer: React.FC = () => {
  const { user } = useAuth();
  const {
    blockchain, chainStats, chainLoading,
    getChainBalance, getAllHolders, verifyChain,
  } = useWallet();

  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showAllBlocks, setShowAllBlocks] = useState(false);

  const userRecipient = user?.id || user?.email || 'local-user';
  const userBalance = getChainBalance(userRecipient);
  const holders = getAllHolders();

  const handleVerify = async () => {
    setVerifying(true);
    await verifyChain();
    setTimeout(() => setVerifying(false), 1200);
  };

  // Show most recent blocks first
  const displayBlocks = [...blockchain].reverse();
  const blocksToShow = showAllBlocks ? displayBlocks : displayBlocks.slice(0, 10);

  if (chainLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-stone-400">
        <Cpu className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Initializing MIC blockchain...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Chain Status Banner ═══ */}
      <div className={`
        rounded-xl p-4 sm:p-5 border-2
        ${chainStats.isValid
          ? 'bg-emerald-50 border-emerald-300'
          : 'bg-rose-50 border-rose-300'}
      `}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {chainStats.isValid ? (
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            )}
            <div>
              <h3 className={`font-bold text-lg ${chainStats.isValid ? 'text-emerald-800' : 'text-rose-800'}`}>
                {chainStats.isValid ? 'Chain Integrity Verified' : 'Chain Integrity Compromised'}
              </h3>
              <p className={`text-xs ${chainStats.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                {chainStats.length} blocks • {chainStats.totalTransactions} transactions •
                SHA-256 hash-linked • Difficulty {chainStats.difficulty}
              </p>
            </div>
          </div>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className={`
              px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0
              ${verifying
                ? 'bg-stone-200 text-stone-400 cursor-wait'
                : chainStats.isValid
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-rose-600 text-white hover:bg-rose-700'}
            `}
          >
            {verifying ? (
              <>
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify Chain
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══ Chain Stats Grid ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <Layers className="w-5 h-5 text-stone-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-stone-900">{chainStats.length}</div>
          <div className="text-xs text-stone-500">Blocks</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-amber-500">{chainStats.totalMicMinted}</div>
          <div className="text-xs text-stone-500">MIC Minted</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-stone-900">{chainStats.totalTransactions}</div>
          <div className="text-xs text-stone-500">Transactions</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <Users className="w-5 h-5 text-violet-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-stone-900">{holders.length}</div>
          <div className="text-xs text-stone-500">Holders</div>
        </div>
      </div>

      {/* ═══ Your Holdings ═══ */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-600 uppercase tracking-wide font-semibold mb-1">
              Your On-Chain Balance
            </div>
            <div className="text-4xl font-black text-amber-600 flex items-center gap-2">
              <Award className="w-8 h-8" />
              {userBalance.toLocaleString()} MIC
            </div>
            <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
              <Fingerprint className="w-3 h-3" />
              <span className="font-mono">{userRecipient}</span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-stone-400 mb-0.5">Latest Block</div>
            <div className="font-mono text-xs text-stone-600">
              {chainStats.latestHash ? shortHash(chainStats.latestHash) : '—'}
            </div>
            <div className="text-xs text-stone-400 mt-1">
              {chainStats.latestTimestamp
                ? new Date(chainStats.latestTimestamp).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })
                : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MIC Holders Table ═══ */}
      {holders.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              MIC Holders ({holders.length})
            </h3>
          </div>
          <div className="divide-y divide-stone-100">
            {holders.map((holder, idx) => (
              <div key={holder.recipient} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-400 w-6 text-right">#{idx + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-stone-900 font-mono">
                      {holder.recipient.length > 24 ? shortHash(holder.recipient, 10) : holder.recipient}
                    </div>
                    <div className="text-xs text-stone-400">{holder.txCount} transactions</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-amber-500">
                  {holder.balance.toLocaleString()} MIC
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Block Explorer ═══ */}
      <div>
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Box className="w-4 h-4" />
          Block Explorer
          <span className="text-stone-400 font-normal lowercase">
            (most recent first)
          </span>
        </h3>

        <div className="space-y-2">
          {blocksToShow.map((block) => (
            <BlockCard
              key={block.index}
              block={block}
              isGenesis={block.index === 0}
              isExpanded={expandedBlock === block.index}
              onToggle={() =>
                setExpandedBlock(expandedBlock === block.index ? null : block.index)
              }
            />
          ))}
        </div>

        {/* Show more / less */}
        {blockchain.length > 10 && (
          <button
            onClick={() => setShowAllBlocks(!showAllBlocks)}
            className="w-full mt-3 py-2 text-xs text-stone-500 hover:text-stone-700 font-medium transition-colors"
          >
            {showAllBlocks
              ? `Show recent 10 blocks`
              : `Show all ${blockchain.length} blocks`}
          </button>
        )}
      </div>

      {/* ═══ Testnet Notice ═══ */}
      <div className="text-center text-xs text-stone-400 space-y-1 py-2">
        <p>
          🧪 Testnet — Local chain uses SHA-256 proof-of-work (difficulty {chainStats.difficulty}).
        </p>
        <p>
          On mainnet, this chain syncs with the distributed Mobius ledger for full consensus.
        </p>
      </div>
    </div>
  );
};

export default MICBlockchainExplorer;
