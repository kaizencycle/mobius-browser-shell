
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
import { WalletLab } from './components/Labs/WalletLab';
import { Tornado, Coffee, CheckCircle } from 'lucide-react';
import { wakeAllServices, env } from './config/env';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.OAA);
  const [isWaking, setIsWaking] = useState(false);
  const [wakeComplete, setWakeComplete] = useState(false);

  const handleWakeAllLabs = async () => {
    setIsWaking(true);
    setWakeComplete(false);
    
    await wakeAllServices();
    
    // Show completion state briefly
    setIsWaking(false);
    setWakeComplete(true);
    setTimeout(() => setWakeComplete(false), 3000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case TabId.OAA: return <OAALab />;
      case TabId.HIVE: return <HiveLab />;
      case TabId.REFLECTIONS: return <ReflectionsLab />;
      case TabId.SHIELD: return <CitizenShieldLab />;
      case TabId.WALLET: return <WalletLab />;
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
           
           <div className="flex items-center space-x-4">
              {/* Wake All Labs Button */}
              <button
                onClick={handleWakeAllLabs}
                disabled={isWaking}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  wakeComplete 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : isWaking
                    ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-wait'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
                }`}
                title="Wake all Render services (prevents cold start delays)"
              >
                {wakeComplete ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Labs Awake</span>
                  </>
                ) : isWaking ? (
                  <>
                    <Coffee className="w-3.5 h-3.5 animate-pulse" />
                    <span>Waking...</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Wake Labs</span>
                  </>
                )}
              </button>

              {/* MIC/MII Status (when enabled) */}
              {env.features.micEnabled && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-indigo-50 rounded text-xs">
                    <span className="text-indigo-400">MII</span>
                    <span className="font-mono font-medium text-indigo-600">0.95</span>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 rounded text-xs">
                    <span className="text-amber-400">MIC</span>
                    <span className="font-mono font-medium text-amber-600">0.00</span>
                  </div>
                </div>
              )}

              <SentinelStatus sentinels={SENTINELS} />
           </div>
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
