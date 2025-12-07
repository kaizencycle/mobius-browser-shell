
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
    <div className="h-full overflow-y-auto bg-stone-50 p-4 sm:p-6 lg:p-10 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        
        {/* Header: Identity & Balance */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-stone-200 pb-4 sm:pb-6 lg:pb-8 gap-4 lg:gap-6">
            <div>
                <div className="flex items-center space-x-2 text-stone-400 mb-1 sm:mb-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest">
                    <Fingerprint className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">ID: 0x7f...ae21 (Sovereign)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-serif text-stone-900 leading-tight">Fractal Wallet</h1>
                <p className="text-stone-500 mt-1 sm:mt-2 text-sm sm:text-base">Cycle 157 • <span className="text-emerald-600 font-medium">Canonical</span></p>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm w-full lg:w-auto lg:min-w-[280px] flex flex-col items-start sm:items-end">
                <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Available Balance</span>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-mono font-medium text-stone-900 flex items-center">
                    <span className="text-lg sm:text-xl lg:text-2xl mr-1 text-stone-400">▣</span> 1,240.50
                </div>
                <span className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-1 sm:mt-2 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Power Stable
                </span>
            </div>
        </div>

        {/* The Integrity Stack (Top Layer) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* 1. MII Circuit Breaker */}
            <div className="bg-stone-900 text-stone-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="w-20 sm:w-32 h-20 sm:h-32" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400">System Integrity (MII)</span>
                    </div>
                    
                    <div className="flex items-end space-x-2 mb-2">
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold">0.992</span>
                        <span className="text-xs sm:text-sm text-stone-400 pb-1">/ 1.00</span>
                    </div>

                    <div className="h-1.5 sm:h-2 w-full bg-stone-800 rounded-full overflow-hidden mb-3 sm:mb-4">
                        <div className="h-full bg-emerald-500 w-[99.2%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>

                    <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold border border-emerald-500/30">
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5 fill-current" />
                        MINTING ACTIVE
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-stone-500 mt-3 sm:mt-4 leading-relaxed hidden sm:block">
                        Minting is enabled because GI (0.992) exceeds threshold (0.95).
                    </p>
                </div>
            </div>

            {/* 2. MIA Allocation Track */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                     <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400">MIA Track</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-mono bg-indigo-50 text-indigo-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Tier 2</span>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-1">
                                <span className="text-stone-600">Annual ΔMII</span>
                                <span className="font-mono text-stone-900">+0.018</span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[75%]" />
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-stone-400 mt-1">Target: +0.020 for Tier 3</p>
                        </div>
                        
                        <div className="p-2 sm:p-3 bg-stone-50 rounded-lg border border-stone-100">
                             <div className="text-[10px] sm:text-xs text-stone-500 mb-1">Est. Annual</div>
                             <div className="text-lg sm:text-xl font-mono text-stone-800">15,400 MIC</div>
                        </div>
                    </div>
                </div>
                <div className="text-[9px] sm:text-[10px] text-stone-400 mt-3 sm:mt-4">
                    Next: Cycle 160 (28 days)
                </div>
            </div>

            {/* 3. UBI & Reserve */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                     <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400">Citizen Dividend</span>
                    </div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-serif text-stone-900 mb-2">Weekly UBI</div>
                    <p className="text-xs sm:text-sm text-stone-500 mb-4 sm:mb-6">
                        For verified citizens with &gt;0.85 integrity.
                    </p>
                    <button className="w-full py-2 bg-stone-100 text-stone-400 text-xs sm:text-sm font-medium rounded-lg cursor-not-allowed border border-stone-200 flex items-center justify-center">
                        <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Claimed (2 days ago)
                    </button>
                </div>
            </div>
        </div>

        {/* Middle Layer: MFS Fractal Shards */}
        <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-stone-900 flex items-center">
                    <Hexagon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-stone-400" />
                    <span className="hidden sm:inline">Mobius Fractal Shards</span>
                    <span className="sm:hidden">MFS Shards</span>
                </h2>
                <div className="text-[10px] sm:text-xs font-mono text-stone-400">Shards: 113</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* The "Fractal" Visualizer Card - Hidden on mobile, shown on larger screens */}
                <div className="hidden sm:flex col-span-1 row-span-2 bg-stone-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white flex-col items-center justify-center text-center relative overflow-hidden">
                     {/* Abstract CSS Fractal */}
                     <div className="relative w-20 sm:w-32 h-20 sm:h-32 mb-4 sm:mb-6">
                        <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-2 border-2 border-indigo-500/30 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
                        <div className="absolute inset-4 border-2 border-amber-500/30 rounded-full animate-[spin_5s_linear_infinite]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Hexagon className="w-8 sm:w-12 h-8 sm:h-12 text-white/80" />
                        </div>
                     </div>
                     <h3 className="font-serif text-base sm:text-xl mb-1">Soulbound</h3>
                     <p className="text-[10px] sm:text-xs text-stone-400 max-w-[180px]">
                        Non-transferable proofs of contribution.
                     </p>
                </div>

                {/* Shard Archetypes */}
                {SHARD_ARCHETYPES.map((shard) => (
                    <div key={shard.id} className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className={`p-1.5 sm:p-2 rounded-lg ${shard.bg} ${shard.color}`}>
                                <Hexagon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <span className="font-mono text-base sm:text-lg font-bold text-stone-700">{shard.score}</span>
                        </div>
                        <h4 className="font-medium text-stone-900 text-xs sm:text-sm truncate">{shard.name}</h4>
                        <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-stone-400 mt-1 mb-1.5 sm:mb-2">
                             <span>W: {shard.weight}</span>
                             <span>+{(shard.score * 0.01).toFixed(2)}</span>
                        </div>
                        <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className={`h-full ${shard.bar}`} style={{ width: `${Math.min(shard.score * 2, 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Bottom Layer: The Immutable Ledger */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
             <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                 <h3 className="font-semibold text-stone-700 text-xs sm:text-sm uppercase tracking-wide">Integrity Ledger</h3>
                 <button className="text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
             </div>
             <div className="divide-y divide-stone-100">
                 {TRANSACTIONS.map((tx) => (
                     <div key={tx.id} className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-stone-50 transition-colors group gap-2">
                         <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                             <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${tx.type === 'MINT' ? 'bg-emerald-100 text-emerald-600' : tx.type === 'SPEND' ? 'bg-stone-100 text-stone-500' : 'bg-indigo-100 text-indigo-600'}`}>
                                 {tx.type === 'MINT' ? <Zap className="w-3 h-3 sm:w-4 sm:h-4" /> : tx.type === 'SPEND' ? <Wallet className="w-3 h-3 sm:w-4 sm:h-4" /> : <Hexagon className="w-3 h-3 sm:w-4 sm:h-4" />}
                             </div>
                             <div className="min-w-0">
                                 <p className="text-xs sm:text-sm font-medium text-stone-900 truncate">{tx.desc}</p>
                                 <div className="flex items-center space-x-1 sm:space-x-2 text-[10px] sm:text-xs text-stone-400">
                                     <span>{tx.time}</span>
                                     <span className="hidden sm:inline">•</span>
                                     <span className="font-mono hidden sm:inline">MII: {tx.mii_contrib}</span>
                                 </div>
                             </div>
                         </div>
                         <div className={`font-mono text-xs sm:text-sm font-medium flex-shrink-0 ${tx.amount.startsWith('+') ? 'text-emerald-600' : tx.amount.startsWith('-') ? 'text-stone-900' : 'text-indigo-600'}`}>
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
