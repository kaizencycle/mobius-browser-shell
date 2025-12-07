import React, { useState } from 'react';
import { getLabById } from '../../constants';
import { TabId } from '../../types';
import { shouldUseLiveMode } from '../../config/env';
import { LabFrame } from '../LabFrame';
import { Users, Coins, AlertTriangle, Map, ChevronRight } from 'lucide-react';

// Simple Pixel Art Components using CSS
const PixelHouse = ({ type = 'cottage', x, y }: { type?: 'cottage' | 'shop' | 'mansion', x: number, y: number }) => (
  <div className="absolute group cursor-pointer transition-transform hover:scale-105 hover:z-10" style={{ left: `${x}%`, top: `${y}%` }}>
    {/* Shadow */}
    <div className="absolute bottom-0 w-16 h-4 bg-black/20 rounded-full translate-y-1 blur-[2px]" />
    
    {/* Structure */}
    <div className="relative">
      {/* Roof */}
      <div className={`w-16 h-10 mx-auto relative z-10 ${type === 'shop' ? 'bg-blue-800' : type === 'mansion' ? 'bg-purple-900' : 'bg-[#8B4513]'} border-b-4 border-black/20`} 
           style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
           <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10" />
      </div>
      
      {/* Walls */}
      <div className={`w-12 h-10 mx-auto ${type === 'shop' ? 'bg-stone-300' : 'bg-[#DEB887]'} relative`}>
         {/* Windows */}
         <div className="absolute top-2 left-1 w-3 h-3 bg-[#4a3c31] border border-white/20" />
         <div className="absolute top-2 right-1 w-3 h-3 bg-[#4a3c31] border border-white/20" />
         
         {/* Door */}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-[#5D4037] border-t border-l border-r border-black/20" />
      </div>
    </div>
    
    {/* Label on Hover */}
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2d1b2e] text-[#e0c0a0] text-[8px] px-2 py-1 whitespace-nowrap border border-[#e0c0a0] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg">
      {type === 'shop' ? 'MARKET' : type === 'mansion' ? 'TOWN HALL' : 'RESIDENCE'}
    </div>
  </div>
);

const PixelTree = ({ x, y }: { x: number, y: number }) => (
  <div className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 blur-[1px]" />
      <div className="relative flex flex-col items-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-full relative z-10 -mb-2 border-b-2 border-emerald-800" />
          <div className="w-10 h-8 bg-emerald-700 rounded-full relative z-0 -mb-4 border-b-2 border-emerald-900" />
          <div className="w-2 h-4 bg-[#5D4037]" />
      </div>
  </div>
);

const PixelCharacter = ({ x, y, color = 'bg-red-500' }: { x: number, y: number, color?: string }) => (
    <div className="absolute animate-bounce duration-[2000ms]" style={{ left: `${x}%`, top: `${y}%` }}>
         <div className="w-4 h-4 relative">
             <div className={`w-3 h-3 ${color} absolute top-0 left-0.5 rounded-sm`} />
             <div className="w-1 h-1 bg-[#ffccaa] absolute top-0.5 left-1" /> {/* Face */}
             <div className="w-3 h-2 bg-blue-800 absolute top-3 left-0.5" /> {/* Body */}
         </div>
    </div>
);

export const HiveLab: React.FC = () => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const lab = getLabById(TabId.HIVE);
    
    // If live mode is enabled and URL exists, show iframe
    if (lab && shouldUseLiveMode(lab.url)) {
      return (
        <LabFrame 
          url={lab.url!} 
          title={lab.name}
          description={lab.description}
        />
      );
    }

    // Otherwise show demo UI (HIVE game simulation)
    return (
        <div className="h-full bg-[#1a1b26] text-[#c0caf5] font-retro relative overflow-hidden flex flex-col select-none">
            
            {/* 1. CRT Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            <div className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-b from-white/5 to-transparent h-32 opacity-20" />

            {/* 2. Top HUD */}
            <div className="bg-[#2d2a4a] border-b-4 border-[#1a1b26] p-2 sm:p-4 flex justify-between items-center z-40 shadow-xl">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 border-2 border-white/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] flex items-center justify-center">
                         <Map className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-[10px] sm:text-xs text-emerald-400 tracking-wider shadow-black drop-shadow-md">SECTOR 7</h2>
                        <p className="text-[8px] sm:text-[10px] text-slate-400">CYCLE 157 // GOVERNANCE</p>
                    </div>
                </div>
                
                {/* Resource Stats */}
                <div className="flex space-x-2 sm:space-x-6 bg-[#1a1b26] p-1.5 sm:p-2 px-2 sm:px-4 rounded border-2 border-[#414868]">
                    <div className="flex items-center space-x-1 sm:space-x-2 text-yellow-400">
                        <Coins className="w-3 h-3" />
                        <span className="text-[8px] sm:text-[10px]">24.5K</span>
                    </div>
                    <div className="w-px h-4 bg-[#414868] hidden sm:block" />
                    <div className="flex items-center space-x-1 sm:space-x-2 text-blue-400">
                        <Users className="w-3 h-3" />
                        <span className="text-[8px] sm:text-[10px]">8.9K</span>
                    </div>
                    <div className="w-px h-4 bg-[#414868] hidden sm:block" />
                    <div className="flex items-center space-x-1 sm:space-x-2 text-red-400 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[8px] sm:text-[10px] hidden sm:inline">WATER CRITICAL</span>
                        <span className="text-[8px] sm:hidden">!</span>
                    </div>
                </div>
            </div>

            {/* 3. Game Viewport */}
            <div className="flex-1 relative overflow-hidden bg-[#56ab2f] z-0">
                {/* Grass Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ 
                    backgroundImage: 'radial-gradient(#3a7b1f 15%, transparent 16%)', 
                    backgroundSize: '16px 16px' 
                }} />

                {/* River */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[#4facfe] border-l-4 border-[#69c0ff]/50 transform -skew-x-12 origin-top-right">
                    <div className="w-full h-full opacity-20 animate-pulse bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* Town Layout */}
                <div className="absolute inset-0">
                     <PixelHouse type="mansion" x={50} y={20} />
                     <PixelHouse type="shop" x={30} y={40} />
                     <PixelHouse x={65} y={45} />
                     <PixelHouse x={25} y={65} />
                     <PixelHouse x={55} y={70} />
                     <PixelHouse x={80} y={35} />

                     <PixelTree x={20} y={20} />
                     <PixelTree x={15} y={50} />
                     <PixelTree x={85} y={65} />
                     <PixelTree x={45} y={55} />
                     <PixelTree x={70} y={25} />

                     <PixelCharacter x={52} y={35} color="bg-red-500" />
                     <PixelCharacter x={35} y={55} color="bg-blue-500" />
                     <PixelCharacter x={60} y={80} color="bg-yellow-500" />
                </div>
            </div>

            {/* 4. Bottom Dialog & UI */}
            <div className="min-h-[140px] sm:min-h-[192px] bg-[#2d2a4a] border-t-4 border-[#1a1b26] p-2 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 z-40 relative shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                 {/* Portrait - Hidden on small screens */}
                 <div className="hidden sm:block w-24 lg:w-32 h-24 lg:h-32 bg-[#1a1b26] border-4 border-[#414868] flex-shrink-0 relative overflow-hidden">
                     {/* Placeholder Pixel Art Portrait */}
                     <div className="absolute inset-0 flex items-end justify-center bg-[#2c2c2c]">
                        <div className="w-16 lg:w-20 h-20 lg:h-24 bg-[#ffccaa] rounded-t-lg relative">
                            <div className="w-full h-6 lg:h-8 bg-[#5D4037] absolute top-0" /> {/* Hair */}
                            <div className="flex justify-between px-3 lg:px-4 mt-8 lg:mt-10">
                                <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 bg-black" />
                                <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 bg-black" />
                            </div>
                            <div className="w-8 lg:w-12 h-1 bg-[#d4a3a3] mx-auto mt-3 lg:mt-4" /> {/* Mouth */}
                            <div className="w-full h-6 lg:h-8 bg-blue-900 absolute bottom-0" /> {/* Clothes */}
                        </div>
                     </div>
                 </div>

                 {/* Text Box */}
                 <div className="flex-1 bg-[#1a1b26] border-2 sm:border-4 border-[#414868] p-2 sm:p-4 relative font-mono text-[10px] sm:text-xs leading-relaxed text-[#a9b1d6] min-h-[60px] sm:min-h-0">
                     <h3 className="text-emerald-400 font-bold mb-1 sm:mb-2 tracking-widest text-[8px] sm:text-[10px]">ADVISOR KAI</h3>
                     <p className="typewriter-text line-clamp-3 sm:line-clamp-none">
                        The aquifer levels are critical. The Industrial District requests a subsidy, but the Agricultural Combine needs water credits.
                     </p>
                     
                     <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 animate-bounce">
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                     </div>
                 </div>

                 {/* Options */}
                 <div className="flex sm:flex-col gap-1 sm:gap-2 sm:w-48 lg:w-64">
                     {[
                         { label: 'INDUSTRY', fullLabel: 'SUBSIDIZE INDUSTRY', cost: '-500', color: 'hover:bg-blue-900' },
                         { label: 'AGRI', fullLabel: 'SUPPORT AGRICULTURE', cost: '-500', color: 'hover:bg-emerald-900' },
                         { label: 'RATION', fullLabel: 'RATION WATER', cost: '-INT', color: 'hover:bg-red-900' },
                     ].map((opt, idx) => (
                         <button 
                            key={idx}
                            onClick={() => setSelectedOption(idx)}
                            className={`flex-1 flex justify-between items-center px-2 sm:px-3 py-1.5 sm:py-0 text-[8px] sm:text-[10px] bg-[#1a1b26] border-2 ${selectedOption === idx ? 'border-emerald-500 bg-emerald-900/20' : 'border-[#414868]'} ${opt.color} transition-colors group text-left`}
                         >
                            <span className="group-hover:translate-x-1 transition-transform truncate">
                              <span className="sm:hidden">&gt; {opt.label}</span>
                              <span className="hidden sm:inline">&gt; {opt.fullLabel}</span>
                            </span>
                            <span className="text-[6px] sm:text-[8px] opacity-50 ml-1">{opt.cost}</span>
                         </button>
                     ))}
                 </div>
            </div>
        </div>
    );
};