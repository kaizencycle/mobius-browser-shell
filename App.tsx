
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
import { JadeLab } from './components/Labs/JadeLab';
import { KnowledgeGraphLab } from './components/KnowledgeGraph';
import { Tornado, Coffee, CheckCircle, Menu, X, User, LogOut } from 'lucide-react';
import { wakeAllServices, env } from './config/env';
import { useAuth } from './contexts/AuthContext';
import { useWallet } from './contexts/WalletContext';
import { AuthModal } from './components/AuthModal';
import { InquiryChatModal } from './components/InquiryChatModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.OAA);
  const [isWaking, setIsWaking] = useState(false);
  const [wakeComplete, setWakeComplete] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auth & Wallet hooks
  const { user, loading: authLoading, logout } = useAuth();
  const { wallet } = useWallet();

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
      case TabId.KNOWLEDGE_GRAPH: return <KnowledgeGraphLab />;
      case TabId.SHIELD: return <CitizenShieldLab />;
      case TabId.JADE: return <JadeLab />;
      case TabId.WALLET: return <WalletLab />;
      default: return <OAALab />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-100">
      
      {/* 🌀 TOP SHELL: The "Spine" */}
      <header className="flex-none bg-white border-b border-stone-200 z-50">
        
        {/* Row 1: Status & Brand */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 border-b border-stone-100">
           <div className="flex items-center space-x-2 text-stone-900">
              <div className="p-1 bg-stone-900 rounded-md text-white">
                <Tornado className="w-4 h-4" /> 
              </div>
              <span className="font-serif font-bold tracking-tight text-sm sm:text-base">Mobius Systems</span>
              <span className="text-[10px] sm:text-xs text-stone-400 font-mono px-1.5 sm:px-2 py-0.5 bg-stone-100 rounded hidden sm:inline">v0.1</span>
           </div>
           
           {/* Desktop Actions */}
           <div className="hidden md:flex items-center space-x-4">
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

              {/* MIC/MII Status with Testnet Badge */}
              <div className="flex items-center space-x-2">
                {/* Testnet Badge */}
                {env.network.isTestnet && (
                  <span className="px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded uppercase">
                    Testnet
                  </span>
                )}
                
                {/* MII Display */}
                <div className="flex items-center space-x-1 px-2 py-1 bg-indigo-50 rounded text-xs">
                  <span className="text-indigo-400">MII</span>
                  <span className="font-mono font-medium text-indigo-600">0.95</span>
                </div>
                
                {/* MIC Balance with Testnet indicator */}
                <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 rounded text-xs border border-amber-200">
                  <span className="text-amber-500">MIC</span>
                  <span className="font-mono font-medium text-amber-600">
                    {wallet ? wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </span>
                  {env.network.isTestnet && (
                    <span className="px-1 py-0.5 bg-yellow-300/50 text-yellow-800 text-[8px] font-bold rounded">
                      T
                    </span>
                  )}
                </div>
              </div>
              
              {/* User Auth Status */}
              {!authLoading && (
                user ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5 px-2 py-1 bg-stone-100 rounded text-xs">
                      <User className="w-3 h-3 text-stone-500" />
                      <span className="text-stone-600 font-medium max-w-[100px] truncate">
                        {user.name || user.email.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded hover:bg-stone-800 transition-colors"
                  >
                    Login
                  </button>
                )
              )}

              <SentinelStatus sentinels={SENTINELS} />
           </div>

           {/* Mobile Menu Button */}
           <button
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
             aria-label="Toggle menu"
           >
             {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
           </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-3 py-3 bg-stone-50 border-b border-stone-200 space-y-3 animate-fadeIn">
            {/* Wake Labs Button - Mobile */}
            <button
              onClick={() => {
                handleWakeAllLabs();
                setIsMobileMenuOpen(false);
              }}
              disabled={isWaking}
              className={`w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                wakeComplete 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isWaking
                  ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-wait'
                  : 'bg-white border-stone-200 text-stone-600'
              }`}
            >
              {wakeComplete ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Labs Awake</span>
                </>
              ) : isWaking ? (
                <>
                  <Coffee className="w-4 h-4 animate-pulse" />
                  <span>Waking Labs...</span>
                </>
              ) : (
                <>
                  <Coffee className="w-4 h-4" />
                  <span>Wake All Labs</span>
                </>
              )}
            </button>
            
            {/* Status Pills - Mobile */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Testnet Badge - Mobile */}
              {env.network.isTestnet && (
                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded uppercase">
                  Testnet
                </span>
              )}
              
              <div className="flex items-center space-x-1 px-2 py-1 bg-indigo-50 rounded text-xs">
                <span className="text-indigo-400">MII</span>
                <span className="font-mono font-medium text-indigo-600">0.95</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 rounded text-xs border border-amber-200">
                <span className="text-amber-500">MIC</span>
                <span className="font-mono font-medium text-amber-600">
                  {wallet ? wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </span>
              </div>
              <SentinelStatus sentinels={SENTINELS} />
            </div>
            
            {/* User Auth - Mobile */}
            {!authLoading && (
              <div className="flex items-center justify-center pt-2">
                {user ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-100 rounded text-xs">
                      <User className="w-3 h-3 text-stone-500" />
                      <span className="text-stone-600 font-medium">
                        {user.name || user.email.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-3 py-1.5 text-stone-500 hover:text-stone-700 text-xs font-medium"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Row 2: Omnibar */}
        <div className="py-2 sm:py-4 px-3 sm:px-6">
            <Omnibar />
        </div>

        {/* Row 3: Tabs */}
        <div className="px-2 sm:px-6">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </header>

      {/* 🧩 MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative shadow-inner">
        {renderContent()}
      </main>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Inquiry Chat Modal - Floating button */}
      <InquiryChatModal />

    </div>
  );
};

export default App;
