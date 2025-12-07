import React from 'react';
import { TabId } from '../types';
import { BookOpen, Hexagon, Feather, Shield, Wallet } from 'lucide-react';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}

const TABS = [
  { id: TabId.OAA, label: 'OAA Hub', icon: BookOpen },
  { id: TabId.HIVE, label: 'HIVE Lab', icon: Hexagon },
  { id: TabId.REFLECTIONS, label: 'Reflections', icon: Feather },
  { id: TabId.SHIELD, label: 'Citizen Shield', icon: Shield },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center pt-2 px-4 space-x-1 overflow-x-auto no-scrollbar">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center space-x-2 px-4 py-2.5 rounded-t-lg transition-all duration-200 text-sm font-medium border-t border-x
              ${isActive 
                ? 'bg-stone-50 border-stone-200 text-stone-900 shadow-sm z-10 translate-y-px' 
                : 'bg-stone-200/50 border-transparent text-stone-500 hover:bg-stone-200 hover:text-stone-700'
              }
            `}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-stone-400'}`} />
            <span>{tab.label}</span>
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-50" />} {/* Hides bottom border */}
          </button>
        );
      })}
      
      {/* Wallet is slightly separated */}
      <div className="flex-1" />
      <button 
         onClick={() => onTabChange(TabId.WALLET)}
         className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-colors border ${activeTab === TabId.WALLET ? 'bg-amber-100 text-amber-900 border-amber-200' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
      >
        <Wallet className="w-3 h-3" />
        <span>1,240 MIC</span>
      </button>
    </div>
  );
};