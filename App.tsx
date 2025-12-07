import React, { useState } from 'react';
import { SENTINELS } from './constants';
import { TabId } from './types';
import { SentinelStatus } from './components/SentinelStatus';
import { Omnibar } from './components/Omnibar';
import { TabNavigation } from './components/TabNavigation';
import { OAALab } from './components/Labs/OAALab';
import { HiveLab } from './components/Labs/HiveLab';
import { ReflectionsLab } from './components/Labs/ReflectionsLab';
import { CitizenShieldLab } from './components/Labs/CitizenShieldLab';
import { Tornado } from 'lucide-react'; // Simulating the Mobius Sigil

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.OAA);

  const renderContent = () => {
    switch (activeTab) {
      case TabId.OAA: return <OAALab />;
      case TabId.HIVE: return <HiveLab />;
      case TabId.REFLECTIONS: return <ReflectionsLab />;
      case TabId.SHIELD: return <CitizenShieldLab />;
      case TabId.WALLET: return (
        <div className="flex items-center justify-center h-full bg-stone-50 text-stone-400 font-mono text-sm">
            Wallet Interface // MIC Ledger: Connected
        </div>
      );
      default: return <OAALab />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-100">
      
      {/* 🌀 TOP SHELL: The "Spine" */}
      <header className="flex-none bg-white border-b border-stone-200 z-50">
        
        {/* Row 1: Status & Brand */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-stone-100">
           <div className="flex items-center space-x-2 text-stone-900">
              <div className="p-1 bg-stone-900 rounded-md text-white">
                <Tornado className="w-4 h-4" /> 
              </div>
              <span className="font-serif font-bold tracking-tight">Mobius Systems</span>
              <span className="text-xs text-stone-400 font-mono px-2 py-0.5 bg-stone-100 rounded">v0.1</span>
           </div>
           
           <SentinelStatus sentinels={SENTINELS} />
        </div>

        {/* Row 2: Omnibar */}
        <div className="py-4 px-6">
            <Omnibar />
        </div>

        {/* Row 3: Tabs */}
        <div className="px-6">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </header>

      {/* 🧩 MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative shadow-inner">
        {renderContent()}
      </main>

    </div>
  );
};

export default App;