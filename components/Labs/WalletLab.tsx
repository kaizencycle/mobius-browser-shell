
import React from 'react';
import { Wallet, ShieldCheck, Activity, Zap, Hexagon, TrendingUp, History, Lock, ChevronRight, Fingerprint } from 'lucide-react';

const SHARD_ARCHETYPES = [
  { id: 'CIV', name: 'Civic', weight: 0.25, score: 12, color: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-500' },
  { id: 'REF', name: 'Reflection', weight: 0.20, score: 42, color: 'text-indigo-600', bg: 'bg-indigo-100', bar: 'bg-indigo-500' },
  { id: 'LRN', name: 'Learning', weight: 0.15, score: 28, color: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-500' },
  { id: 'STB', name: 'Stability', weight: 0.15, score: 15, color: 'text-slate-600', bg: 'bg-slate-100', bar: 'bg-slate-500' },
  { id: 'STW', name: 'Stewardship', weight: 0.10, score: 8, color: 'text-stone-600', bg: 'bg-stone-100', bar: 'bg-stone-500' },
  { id: 'INV', name: 'Innovation', weight: 0.10, score: 5, color: 'text-violet-600', bg: 'bg-violet-100', bar: 'bg-violet-500' },
  { id: 'GRD', name: 'Guardian', weight: 0.05, score: 3, color: 'text-red-600', bg: 'bg-red-100', bar: 'bg-red-500' },
];

const TRANSACTIONS = [
  { id: 1, type: 'MINT', desc: 'Epoch 156 Distribution', amount: '+45.20 MIC', time: '2 hours ago', mii_contrib: '+0.0002' },
  { id: 2, type: 'SPEND', desc: 'Library Access / Cafe', amount: '-15.00 MIC', time: 'Yesterday', mii_contrib: '0.0000' },
  { id: 3, type: 'SHARD', desc: 'Civic Proposal Vote', amount: 'MFS (CIV)', time: 'Yesterday', mii_contrib: '+0.0001' },
  { id: 4, type: 'SHARD', desc: 'Learning Module: Thermodynamics', amount: 'MFS (LRN)', time: '2 days ago', mii_contrib: '+0.0003' },
];

export const WalletLab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-6 md:p-10 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header: Identity & Balance */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-8 gap-6">
            <div>
                <div className="flex items-center space-x-2 text-stone-400 mb-2 font-mono text-xs uppercase tracking-widest">
                    <Fingerprint className="w-4 h-4" />
                    <span>Identity: 0x7f...ae21 (Sovereign)</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight">Fractal Wallet</h1>
                <p className="text-stone-500 mt-2">Cycle 157 • <span className="text-emerald-600 font-medium">Canonical Chain</span></p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm min-w-[300px] flex flex-col items-end">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Available Balance</span>
                <div className="text-4xl font-mono font-medium text-stone-900 flex items-center">
                    <span className="text-2xl mr-1 text-stone-400">▣</span> 1,240.50
                </div>
                <span className="text-xs text-emerald-600 font-medium mt-2 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Purchasing Power Stable
                </span>
            </div>
        </div>

        {/* The Integrity Stack (Top Layer) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. MII Circuit Breaker */}
            <div className="bg-stone-900 text-stone-50 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="w-32 h-32" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-4">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">System Integrity (MII)</span>
                    </div>
                    
                    <div className="flex items-end space-x-2 mb-2">
                        <span className="text-5xl font-mono font-bold">0.992</span>
                        <span className="text-sm text-stone-400 pb-1">/ 1.00</span>
                    </div>

                    <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-emerald-500 w-[99.2%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>

                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                        <Zap className="w-3 h-3 mr-1.5 fill-current" />
                        MINTING ACTIVE
                    </div>
                    <p className="text-[10px] text-stone-500 mt-4 leading-relaxed">
                        Minting is enabled because Global Integrity (0.992) exceeds the critical threshold (0.95). Your integrity actions are currently generating value.
                    </p>
                </div>
            </div>

            {/* 2. MIA Allocation Track */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">MIA Growth Track</span>
                        </div>
                        <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Tier 2</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-stone-600">Annual ΔMII</span>
                                <span className="font-mono text-stone-900">+0.018</span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[75%]" />
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">Target: +0.020 for Tier 3 Multiplier (2.0x)</p>
                        </div>
                        
                        <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                             <div className="text-xs text-stone-500 mb-1">Est. Annual Allocation</div>
                             <div className="text-xl font-mono text-stone-800">15,400 MIC</div>
                        </div>
                    </div>
                </div>
                <div className="text-[10px] text-stone-400 mt-4">
                    Next distribution: Cycle 160 (28 days)
                </div>
            </div>

            {/* 3. UBI & Reserve */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                     <div className="flex items-center space-x-2 mb-4">
                        <Wallet className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Citizen Dividend</span>
                    </div>
                    <div className="text-3xl font-serif text-stone-900 mb-2">Weekly UBI</div>
                    <p className="text-sm text-stone-500 mb-6">
                        Distributed to all verified citizens maintaining &gt;0.85 personal integrity.
                    </p>
                    <button className="w-full py-2 bg-stone-100 text-stone-400 text-sm font-medium rounded-lg cursor-not-allowed border border-stone-200 flex items-center justify-center">
                        <History className="w-4 h-4 mr-2" />
                        Claimed (2 days ago)
                    </button>
                </div>
            </div>
        </div>

        {/* Middle Layer: MFS Fractal Shards */}
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-stone-900 flex items-center">
                    <Hexagon className="w-5 h-5 mr-2 text-stone-400" />
                    Mobius Fractal Shards (MFS)
                </h2>
                <div className="text-xs font-mono text-stone-400">Total Shards: 113</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* The "Fractal" Visualizer Card */}
                <div className="lg:col-span-1 row-span-2 bg-stone-900 rounded-2xl p-6 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
                     {/* Abstract CSS Fractal */}
                     <div className="relative w-32 h-32 mb-6">
                        <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-2 border-2 border-indigo-500/30 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
                        <div className="absolute inset-4 border-2 border-amber-500/30 rounded-full animate-[spin_5s_linear_infinite]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Hexagon className="w-12 h-12 text-white/80" />
                        </div>
                     </div>
                     <h3 className="font-serif text-xl mb-1">Soulbound Portfolio</h3>
                     <p className="text-xs text-stone-400 max-w-[200px]">
                        These shards are non-transferable proofs of your contribution to the commons.
                     </p>
                </div>

                {/* Shard Archetypes */}
                {SHARD_ARCHETYPES.map((shard) => (
                    <div key={shard.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-lg ${shard.bg} ${shard.color}`}>
                                <Hexagon className="w-4 h-4" />
                            </div>
                            <span className="font-mono text-lg font-bold text-stone-700">{shard.score}</span>
                        </div>
                        <h4 className="font-medium text-stone-900 text-sm">{shard.name}</h4>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 mb-2">
                             <span>Weight: {shard.weight}</span>
                             <span>+{shard.score * 0.01} MII</span>
                        </div>
                        <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className={`h-full ${shard.bar}`} style={{ width: `${Math.min(shard.score * 2, 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Bottom Layer: The Immutable Ledger */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                 <h3 className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Recent Integrity Ledger</h3>
                 <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View Full Chain</button>
             </div>
             <div className="divide-y divide-stone-100">
                 {TRANSACTIONS.map((tx) => (
                     <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors group">
                         <div className="flex items-center space-x-4">
                             <div className={`p-2 rounded-full ${tx.type === 'MINT' ? 'bg-emerald-100 text-emerald-600' : tx.type === 'SPEND' ? 'bg-stone-100 text-stone-500' : 'bg-indigo-100 text-indigo-600'}`}>
                                 {tx.type === 'MINT' ? <Zap className="w-4 h-4" /> : tx.type === 'SPEND' ? <Wallet className="w-4 h-4" /> : <Hexagon className="w-4 h-4" />}
                             </div>
                             <div>
                                 <p className="text-sm font-medium text-stone-900">{tx.desc}</p>
                                 <div className="flex items-center space-x-2 text-xs text-stone-400">
                                     <span>{tx.time}</span>
                                     <span>•</span>
                                     <span className="font-mono">MII Impact: {tx.mii_contrib}</span>
                                 </div>
                             </div>
                         </div>
                         <div className={`font-mono text-sm font-medium ${tx.amount.startsWith('+') ? 'text-emerald-600' : tx.amount.startsWith('-') ? 'text-stone-900' : 'text-indigo-600'}`}>
                             {tx.amount}
                         </div>
                     </div>
                 ))}
             </div>
        </div>

      </div>
    </div>
  );
};
