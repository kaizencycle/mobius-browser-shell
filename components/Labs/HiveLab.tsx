import React from 'react';
import { Users, Coins, TrendingUp, AlertTriangle } from 'lucide-react';

export const HiveLab: React.FC = () => {
  return (
    <div className="h-full bg-slate-900 text-slate-100 font-retro overflow-hidden flex flex-col relative">
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />

        {/* Game Header */}
        <div className="bg-slate-800 border-b-4 border-slate-700 p-4 flex justify-between items-center z-20">
            <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-sm shadow-[4px_4px_0px_rgba(0,0,0,0.5)]"></div>
                <div>
                    <h2 className="text-sm text-emerald-400">SECTOR 7</h2>
                    <p className="text-[10px] text-slate-400">CYCLE 157 // GOVERNANCE PHASE</p>
                </div>
            </div>
            <div className="flex space-x-6 text-xs">
                <div className="flex items-center space-x-2 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span>24,500 MIC</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-400">
                    <Users className="w-4 h-4" />
                    <span>POP: 8,921</span>
                </div>
                <div className="flex items-center space-x-2 text-red-400 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    <span>SCARCITY: WATER</span>
                </div>
            </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex overflow-hidden z-20">
            
            {/* World View (Canvas Placeholder) */}
            <div className="flex-1 bg-slate-950 relative p-8 flex items-center justify-center">
                 {/* Pixel Art City Representation */}
                 <div className="grid grid-cols-4 gap-4 opacity-80">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className={`w-16 h-16 ${i % 3 === 0 ? 'bg-slate-700' : i % 2 === 0 ? 'bg-emerald-900' : 'bg-blue-900'} border-2 border-slate-600 shadow-[4px_4px_0_rgba(0,0,0,0.5)] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer`}>
                            <span className="text-[8px] text-center opacity-50">{i % 3 === 0 ? 'HAB' : i % 2 === 0 ? 'FARM' : 'GRID'}</span>
                        </div>
                    ))}
                 </div>
                 
                 {/* Floating UI Prompt */}
                 <div className="absolute bottom-8 left-8 right-8 bg-slate-800 border-2 border-slate-600 p-4 shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
                    <p className="text-xs leading-loose mb-4">
                        <span className="text-emerald-400">ADVISOR:</span> The aquifer levels are critical. The Industrial District requests a subsidy to retrofit filters, but the Agricultural Combine needs immediate water credits.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="bg-slate-700 hover:bg-emerald-700 text-[10px] py-3 px-2 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                            > SUBSIDIZE INDUSTRY (-500 MIC)
                        </button>
                        <button className="bg-slate-700 hover:bg-blue-700 text-[10px] py-3 px-2 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                            > SUPPORT AGRICULTURE (-500 MIC)
                        </button>
                        <button className="bg-slate-700 hover:bg-yellow-700 text-[10px] py-3 px-2 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                            > IMPOSE RATIONING (Integrity Cost)
                        </button>
                        <button className="bg-slate-700 hover:bg-purple-700 text-[10px] py-3 px-2 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                            > CONSULT AUREA SENTINEL
                        </button>
                    </div>
                 </div>
            </div>

            {/* Sidebar Stats */}
            <div className="w-64 bg-slate-900 border-l-4 border-slate-800 p-4 space-y-6">
                <div>
                    <h3 className="text-xs text-slate-500 mb-2 border-b-2 border-slate-700 pb-1">MARKET TRENDS</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span>ENERGY</span>
                            <span className="text-green-400">+2.4%</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span>FOOD</span>
                            <span className="text-red-400">-1.2%</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span>DATA</span>
                            <span className="text-yellow-400">0.0%</span>
                        </div>
                        <div className="h-24 border border-slate-700 mt-2 flex items-end px-1 space-x-1">
                             {[40, 60, 30, 80, 50, 70, 90, 60].map((h, i) => (
                                 <div key={i} style={{height: `${h}%`}} className="flex-1 bg-emerald-500/50"></div>
                             ))}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs text-slate-500 mb-2 border-b-2 border-slate-700 pb-1">ACTIVE POLICIES</h3>
                    <ul className="text-[8px] space-y-2 text-slate-300">
                        <li className="flex items-center"><div className="w-1 h-1 bg-green-500 mr-2"></div> UBI TRIAL (PHASE 2)</li>
                        <li className="flex items-center"><div className="w-1 h-1 bg-green-500 mr-2"></div> DATA DIVIDEND</li>
                        <li className="flex items-center"><div className="w-1 h-1 bg-red-500 mr-2"></div> CARBON TAX</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
};