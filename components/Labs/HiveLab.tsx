import React, { useState, useEffect } from 'react';
import { getLabById } from '../../constants';
import { TabId } from '../../types';
import { shouldUseLiveMode } from '../../config/env';
import { LabFrame } from '../LabFrame';
import { 
  HiveCharacterSheet, 
  HiveDiceRoller, 
  HiveCharacterCreator,
  type HiveCharacter,
  type ShardId,
  type HiveOrder,
  type DiceOutcome,
  calculateMicDelta
} from '../Hive';
import { 
  Users, Coins, AlertTriangle, Map, ChevronRight, 
  Dices, User, BookOpen, RotateCcw, Download, Upload
} from 'lucide-react';

// ============================================
// HIVE Lab - DnD Style Civic RPG
// ============================================

// Storage keys
const STORAGE_KEY_CHARACTER = 'mobius-hive-character';
const STORAGE_KEY_GAME_LOG = 'mobius-hive-game-log';

// View modes
type HiveViewMode = 'city' | 'character' | 'play';

// Simple Pixel Art Components using CSS (kept from original for city view)
const PixelHouse = ({ type = 'cottage', x, y }: { type?: 'cottage' | 'shop' | 'mansion', x: number, y: number }) => (
  <div className="absolute group cursor-pointer transition-transform hover:scale-105 hover:z-10" style={{ left: `${x}%`, top: `${y}%` }}>
    <div className="absolute bottom-0 w-16 h-4 bg-black/20 rounded-full translate-y-1 blur-[2px]" />
    <div className="relative">
      <div className={`w-16 h-10 mx-auto relative z-10 ${type === 'shop' ? 'bg-blue-800' : type === 'mansion' ? 'bg-purple-900' : 'bg-[#8B4513]'} border-b-4 border-black/20`} 
           style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
           <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10" />
      </div>
      <div className={`w-12 h-10 mx-auto ${type === 'shop' ? 'bg-stone-300' : 'bg-[#DEB887]'} relative`}>
         <div className="absolute top-2 left-1 w-3 h-3 bg-[#4a3c31] border border-white/20" />
         <div className="absolute top-2 right-1 w-3 h-3 bg-[#4a3c31] border border-white/20" />
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-[#5D4037] border-t border-l border-r border-black/20" />
      </div>
    </div>
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
      <div className="w-1 h-1 bg-[#ffccaa] absolute top-0.5 left-1" />
      <div className="w-3 h-2 bg-blue-800 absolute top-3 left-0.5" />
    </div>
  </div>
);

// City View Component (original HIVE UI)
const CityView: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  return (
    <div className="h-full bg-[#1a1b26] text-[#c0caf5] font-retro relative overflow-hidden flex flex-col select-none">
      {/* CRT Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      <div className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-b from-white/5 to-transparent h-32 opacity-20" />

      {/* Top HUD */}
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

      {/* Game Viewport */}
      <div className="flex-1 relative overflow-hidden bg-[#56ab2f] z-0">
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'radial-gradient(#3a7b1f 15%, transparent 16%)', 
          backgroundSize: '16px 16px' 
        }} />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#4facfe] border-l-4 border-[#69c0ff]/50 transform -skew-x-12 origin-top-right">
          <div className="w-full h-full opacity-20 animate-pulse bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
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

      {/* Bottom Dialog & UI */}
      <div className="min-h-[140px] sm:min-h-[192px] bg-[#2d2a4a] border-t-4 border-[#1a1b26] p-2 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 z-40 relative shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="hidden sm:block w-24 lg:w-32 h-24 lg:h-32 bg-[#1a1b26] border-4 border-[#414868] flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 flex items-end justify-center bg-[#2c2c2c]">
            <div className="w-16 lg:w-20 h-20 lg:h-24 bg-[#ffccaa] rounded-t-lg relative">
              <div className="w-full h-6 lg:h-8 bg-[#5D4037] absolute top-0" />
              <div className="flex justify-between px-3 lg:px-4 mt-8 lg:mt-10">
                <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 bg-black" />
                <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 bg-black" />
              </div>
              <div className="w-8 lg:w-12 h-1 bg-[#d4a3a3] mx-auto mt-3 lg:mt-4" />
              <div className="w-full h-6 lg:h-8 bg-blue-900 absolute bottom-0" />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#1a1b26] border-2 sm:border-4 border-[#414868] p-2 sm:p-4 relative font-mono text-[10px] sm:text-xs leading-relaxed text-[#a9b1d6] min-h-[60px] sm:min-h-0">
          <h3 className="text-emerald-400 font-bold mb-1 sm:mb-2 tracking-widest text-[8px] sm:text-[10px]">ADVISOR KAI</h3>
          <p className="typewriter-text line-clamp-3 sm:line-clamp-none">
            The aquifer levels are critical. The Industrial District requests a subsidy, but the Agricultural Combine needs water credits.
          </p>
          <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 animate-bounce">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
        </div>

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

// Main HIVE Lab Component
export const HiveLab: React.FC = () => {
  const lab = getLabById(TabId.HIVE);
  
  // Character state
  const [character, setCharacter] = useState<HiveCharacter | null>(null);
  const [viewMode, setViewMode] = useState<HiveViewMode>('city');
  const [gameLog, setGameLog] = useState<DiceOutcome[]>([]);

  // Load character from localStorage on mount
  useEffect(() => {
    const savedCharacter = localStorage.getItem(STORAGE_KEY_CHARACTER);
    if (savedCharacter) {
      try {
        setCharacter(JSON.parse(savedCharacter));
      } catch (e) {
        console.error('Failed to parse saved character:', e);
      }
    }
    
    const savedLog = localStorage.getItem(STORAGE_KEY_GAME_LOG);
    if (savedLog) {
      try {
        setGameLog(JSON.parse(savedLog));
      } catch (e) {
        console.error('Failed to parse saved game log:', e);
      }
    }
  }, []);

  // Save character to localStorage when it changes
  useEffect(() => {
    if (character) {
      localStorage.setItem(STORAGE_KEY_CHARACTER, JSON.stringify(character));
    }
  }, [character]);

  // Save game log to localStorage when it changes
  useEffect(() => {
    if (gameLog.length > 0) {
      localStorage.setItem(STORAGE_KEY_GAME_LOG, JSON.stringify(gameLog));
    }
  }, [gameLog]);

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

  // Handle character creation
  const handleCharacterCreated = (newCharacter: HiveCharacter) => {
    setCharacter(newCharacter);
    setViewMode('play');
  };

  // Handle character updates
  const handleNameChange = (name: string) => {
    if (character) {
      setCharacter({ ...character, name, lastPlayedAt: new Date().toISOString() });
    }
  };

  const handleOrderChange = (order: HiveOrder) => {
    if (character) {
      setCharacter({ ...character, order, lastPlayedAt: new Date().toISOString() });
    }
  };

  const handleShardChange = (id: ShardId, value: number) => {
    if (character) {
      setCharacter({
        ...character,
        shardValues: { ...character.shardValues, [id]: value },
        lastPlayedAt: new Date().toISOString(),
      });
    }
  };

  const handleCivicMemoryChange = (civicMemory: string) => {
    if (character) {
      // For now, store as a simple string in unresolvedTrial as placeholder
      // A more complete implementation would use the civicMemory array
      setCharacter({ ...character, lastPlayedAt: new Date().toISOString() });
    }
  };

  const handleUnresolvedTrialChange = (unresolvedTrial: string) => {
    if (character) {
      setCharacter({ ...character, unresolvedTrial, lastPlayedAt: new Date().toISOString() });
    }
  };

  // Handle dice roll completion
  const handleRollComplete = (outcome: DiceOutcome, micDelta: number) => {
    setGameLog((prev) => [outcome, ...prev].slice(0, 50)); // Keep last 50 rolls
    
    if (character) {
      setCharacter({
        ...character,
        micXp: Math.max(0, character.micXp + micDelta),
        lastPlayedAt: new Date().toISOString(),
      });
    }
  };

  // Handle character reset
  const handleResetCharacter = () => {
    if (confirm('Are you sure you want to reset your character? This cannot be undone.')) {
      setCharacter(null);
      setGameLog([]);
      localStorage.removeItem(STORAGE_KEY_CHARACTER);
      localStorage.removeItem(STORAGE_KEY_GAME_LOG);
      setViewMode('city');
    }
  };

  // Export character as JSON
  const handleExportCharacter = () => {
    if (character) {
      const data = JSON.stringify({ character, gameLog }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hive-character-${character.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Import character from JSON
  const handleImportCharacter = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.character) {
              setCharacter(data.character);
              if (data.gameLog) {
                setGameLog(data.gameLog);
              }
              setViewMode('play');
            }
          } catch (err) {
            alert('Failed to import character. Invalid file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Render character creator if no character and trying to access character/play modes
  if (!character && (viewMode === 'character' || viewMode === 'play')) {
    return <HiveCharacterCreator onCharacterCreated={handleCharacterCreated} />;
  }

  // View mode navigation
  const ViewModeNav = () => (
    <div className="bg-white border-b border-stone-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setViewMode('city')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            viewMode === 'city'
              ? 'bg-stone-800 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>City View</span>
        </button>
        <button
          onClick={() => setViewMode(character ? 'play' : 'character')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            viewMode === 'play' || viewMode === 'character'
              ? 'bg-indigo-600 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Dices className="w-3.5 h-3.5" />
          <span>{character ? 'DnD Mode' : 'Create Character'}</span>
        </button>
      </div>

      {/* Character actions */}
      {character && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-stone-500 hidden sm:inline">
            Playing as <span className="font-medium text-stone-700">{character.name}</span>
          </span>
          <button
            onClick={() => setViewMode('character')}
            className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
            title="View Character Sheet"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCharacter}
            className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
            title="Export Character"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleImportCharacter}
            className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
            title="Import Character"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCharacter}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Reset Character"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {!character && (
        <button
          onClick={handleImportCharacter}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Character</span>
        </button>
      )}
    </div>
  );

  // Render the appropriate view
  return (
    <div className="h-full flex flex-col">
      <ViewModeNav />
      
      <div className="flex-1 overflow-hidden">
        {viewMode === 'city' && <CityView />}
        
        {viewMode === 'character' && character && (
          <div className="h-full overflow-auto p-4 bg-stone-100">
            <div className="max-w-4xl mx-auto">
              <HiveCharacterSheet
                name={character.name}
                order={character.order}
                shardValues={character.shardValues}
                onNameChange={handleNameChange}
                onOrderChange={handleOrderChange}
                onShardChange={handleShardChange}
                civicMemory=""
                onCivicMemoryChange={handleCivicMemoryChange}
                unresolvedTrial={character.unresolvedTrial}
                onUnresolvedTrialChange={handleUnresolvedTrialChange}
                micXp={character.micXp}
                isEditable={true}
              />
            </div>
          </div>
        )}
        
        {viewMode === 'play' && character && (
          <div className="h-full overflow-auto p-4 bg-stone-100">
            <div className="max-w-6xl mx-auto">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                {/* Character Sheet (Compact) */}
                <HiveCharacterSheet
                  name={character.name}
                  order={character.order}
                  shardValues={character.shardValues}
                  onNameChange={handleNameChange}
                  onOrderChange={handleOrderChange}
                  onShardChange={handleShardChange}
                  civicMemory=""
                  onCivicMemoryChange={handleCivicMemoryChange}
                  unresolvedTrial={character.unresolvedTrial}
                  onUnresolvedTrialChange={handleUnresolvedTrialChange}
                  micXp={character.micXp}
                  isEditable={false}
                />

                {/* Dice Roller */}
                <div className="space-y-4">
                  <HiveDiceRoller
                    shardValues={character.shardValues}
                    onRollComplete={handleRollComplete}
                  />

                  {/* Future: Story/Scenario Panel */}
                  <div className="bg-white border border-stone-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <BookOpen className="w-4 h-4 text-stone-500" />
                      <h3 className="text-sm font-semibold text-stone-700">Coming Soon: Story Mode</h3>
                    </div>
                    <p className="text-xs text-stone-500">
                      In future updates, this panel will display narrative scenarios, 
                      branching choices, and multiplayer civic challenges. Your dice rolls 
                      will determine outcomes in shared stories.
                    </p>
                    <div className="mt-3 pt-3 border-t border-stone-100 space-y-1">
                      <p className="text-xs text-stone-400">🏛️ The Dome in Heat (coming)</p>
                      <p className="text-xs text-stone-400">⚖️ The Trial of Echoes (coming)</p>
                      <p className="text-xs text-stone-400">🌊 The Great Flood Choice (coming)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
