import React from 'react';
import { TabId } from '../types';
import { BookOpen, Hexagon, Feather, Shield, Wallet, Sparkles, Network } from 'lucide-react';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}

const TABS = [
  { id: TabId.OAA, label: 'OAA Hub', shortLabel: 'OAA', icon: BookOpen },
  { id: TabId.HIVE, label: 'HIVE Lab', shortLabel: 'HIVE', icon: Hexagon },
  { id: TabId.REFLECTIONS, label: 'Reflections', shortLabel: 'Reflect', icon: Feather },
  { id: TabId.KNOWLEDGE_GRAPH, label: 'Knowledge', shortLabel: 'Graph', icon: Network },
  { id: TabId.SHIELD, label: 'Citizen Shield', shortLabel: 'Shield', icon: Shield },
  { id: TabId.JADE, label: 'Jade', shortLabel: 'Jade', icon: Sparkles },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center pt-2 px-1 sm:px-4 space-x-0.5 sm:space-x-1 overflow-x-auto no-scrollbar">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-t-lg transition-all duration-200 text-xs sm:text-sm font-medium border-t border-x whitespace-nowrap
              ${isActive 
                ? 'bg-stone-50 border-stone-200 text-stone-900 shadow-sm z-10 translate-y-px' 
                : 'bg-stone-200/50 border-transparent text-stone-500 hover:bg-stone-200 hover:text-stone-700'
              }
            `}
          >
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-indigo-600' : 'text-stone-400'}`} />
            {/* Show short label on mobile, full label on larger screens */}
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-50" />} {/* Hides bottom border */}
          </button>
        );
      })}
      
      {/* Wallet is slightly separated */}
      <div className="flex-1 min-w-[8px]" />
      <button 
         onClick={() => onTabChange(TabId.WALLET)}
         className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-medium transition-colors border whitespace-nowrap ${activeTab === TabId.WALLET ? 'bg-amber-100 text-amber-900 border-amber-200' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
      >
        <Wallet className="w-3 h-3" />
        <span className="hidden xs:inline sm:inline">1,240 MIC</span>
        <span className="xs:hidden sm:hidden">MIC</span>
      </button>
    </div>
  );
};