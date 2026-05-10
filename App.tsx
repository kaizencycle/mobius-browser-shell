import React, { lazy, Suspense, useState } from 'react';
import { SENTINELS } from './constants';
import { TabId } from './types';
import { SentinelStatus } from './components/SentinelStatus';
import { ShellErrorBoundary } from './components/ShellErrorBoundary';
import { useAtlasErrorLog } from './components/useAtlasErrorLog';
import { ErrorCodes } from './errors/errorCodes';
import { Omnibar } from './components/Omnibar';
import { TabNavigation } from './components/TabNavigation';
import { LabSkeleton } from './components/Labs/LabSkeleton';
import { Tornado, Coffee, CheckCircle } from 'lucide-react';

// OAA is the only lab still directly rendered from App — all other labs are
// wrapped by their chamber components which handle their own lazy loading.
const OAALab = lazy(() =>
  import('./components/Labs/OAALab').then((m) => ({ default: m.OAALab })),
);
import { Hallway } from './components/Hallway';
import { HiveChamber } from './components/chambers/HiveChamber';
import { ReflectionsChamber } from './components/chambers/ReflectionsChamber';
import { ShieldChamber } from './components/chambers/ShieldChamber';
import { AtlasChamber } from './components/chambers/AtlasChamber';
import { JadeChamber } from './components/chambers/JadeChamber';
import { WalletChamber } from './components/chambers/WalletChamber';
import { wakeAllServices, env } from './config/env';
import { useAuth } from './contexts/AuthContext';
import { useWallet } from './contexts/WalletContext';
import { useSessionHeartbeat } from './hooks/useSessionHeartbeat';
import { InquiryChatModal } from './components/InquiryChatModal';
import { CitizenProfile } from './components/CitizenProfile/CitizenProfile';
import { CitizenProfileButton } from './components/CitizenProfile/CitizenProfileButton';
import { useCitizenProfile } from './hooks/useCitizenProfile';
import { useGuest } from './contexts/GuestContext';
import { useTerminal } from './contexts/TerminalContext';
import { type TerminalState } from './src/lib/terminal-bridge';
import { WorldSignalStrip } from './components/WorldSignalStrip';
import { TerminalHeartbeat } from './components/TerminalHeartbeat';

const TERMINAL_APP_URL = `${env.terminalOrigin.replace(/\/+$/, '')}/terminal`;

const ROOM_SHELL_ID: Partial<Record<TabId, string>> = {
  [TabId.OAA]:             'oaa',
  [TabId.HIVE]:            'hive',
  [TabId.REFLECTIONS]:     'reflect',
  [TabId.SHIELD]:          'shield',
  [TabId.KNOWLEDGE_GRAPH]: 'atlas',
  [TabId.JADE]:            'jade',
  [TabId.WALLET]:          'wallet',
};

const CHAMBER_META: Partial<Record<TabId, { room: string; name: string }>> = {
  [TabId.OAA]:             { room: '01', name: 'Open Academy' },
  [TabId.HIVE]:            { room: '02', name: 'HIVE Quest' },
  [TabId.REFLECTIONS]:     { room: '03', name: 'Reflections' },
  [TabId.SHIELD]:          { room: '04', name: 'Citizen Shield' },
  [TabId.KNOWLEDGE_GRAPH]: { room: '05', name: 'ATLAS Observatory' },
  [TabId.JADE]:            { room: '06', name: 'JADE Sentinel' },
  [TabId.WALLET]:          { room: '07', name: 'MIC Treasury' },
};

function giChipLinkClasses(
  mode: TerminalState['mode'],
  stale: boolean,
): string {
  if (stale) return 'text-stone-400';
  switch (mode) {
    case 'green':
      return 'text-emerald-400';
    case 'red':
      return 'text-rose-400';
    case 'yellow':
    default:
      return 'text-amber-400';
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.HALLWAY);
  const [isWaking, setIsWaking] = useState(false);
  const [wakeComplete, setWakeComplete] = useState(false);

  // Auth & Wallet hooks (citizen from passkey; always authenticated when App renders in auth flow)
  const { citizen } = useAuth();
  const { wallet } = useWallet();
  const profile = useCitizenProfile();
  const { isGuest, triggerBecomeCitizen } = useGuest();

  // Session heartbeat — polls for revocation, forces sign-out if citizen revoked
  useSessionHeartbeat();

  // Single shell-wide terminal subscription (see contexts/TerminalContext).
  const { state: terminalState } = useTerminal();

  // ATLAS error logging — shared across all panel boundaries
  const logToAtlas = useAtlasErrorLog();

  const handleWakeAllLabs = async () => {
    setIsWaking(true);
    setWakeComplete(false);
    
    await wakeAllServices();
    
    // Show completion state briefly
    setIsWaking(false);
    setWakeComplete(true);
    setTimeout(() => setWakeComplete(false), 3000);
  };

  const goToKnowledgeGraph = React.useCallback(() => setActiveTab(TabId.KNOWLEDGE_GRAPH), []);
  const goToReflections = React.useCallback(() => setActiveTab(TabId.REFLECTIONS), []);

  const renderContent = () => {
    switch (activeTab) {
      case TabId.HALLWAY:
        return <Hallway onEnter={setActiveTab} />;
      case TabId.OAA:
        return (
          <ShellErrorBoundary
            appName="OAA Learning Hub"
            appIcon="📚"
            errorCode={ErrorCodes.OAA_LOAD_FAILED}
            onError={logToAtlas}
          >
            <OAALab onNavigateToKnowledgeGraph={goToKnowledgeGraph} />
          </ShellErrorBoundary>
        );
      case TabId.HIVE:
        return <HiveChamber />;
      case TabId.REFLECTIONS:
        return <ReflectionsChamber onNavigateToKnowledgeGraph={goToKnowledgeGraph} />;
      case TabId.KNOWLEDGE_GRAPH:
        return <AtlasChamber onNavigateToReflections={goToReflections} />;
      case TabId.SHIELD:
        return <ShieldChamber onNavigateToHive={() => setActiveTab(TabId.HIVE)} />;
      case TabId.JADE:
        return (
          <JadeChamber
            onNavigateToOaa={() => setActiveTab(TabId.OAA)}
            onNavigateToKnowledgeGraph={goToKnowledgeGraph}
          />
        );
      case TabId.WALLET:
        return <WalletChamber onNavigateToOaa={() => setActiveTab(TabId.OAA)} />;
      default:
        return (
          <ShellErrorBoundary
            appName="OAA Learning Hub"
            appIcon="📚"
            onError={logToAtlas}
          >
            <OAALab />
          </ShellErrorBoundary>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-100">
      
      {/* ════ SCHOOL HEADER ════ */}
      <header className="school-header">

        {/* Brand (left) */}
        <div className="school-header__brand">
          <div className="school-header__brand-icon">
            <Tornado className="w-4 h-4" />
          </div>
          <div className="school-header__brand-text">
            <span className="school-header__brand-name">Mobius Substrate</span>
            <span className="school-header__brand-sub">School of Chambers</span>
          </div>
        </div>

        {/* Breadcrumb (center) */}
        <div className="school-header__crumb">
          {activeTab !== TabId.HALLWAY ? (
            <>
              <button
                className="school-header__crumb-home"
                onClick={() => setActiveTab(TabId.HALLWAY)}
              >
                Hallway
              </button>
              <span className="school-header__crumb-sep" aria-hidden>›</span>
              <span className="school-header__crumb-room">
                ROOM {CHAMBER_META[activeTab]?.room} · {CHAMBER_META[activeTab]?.name ?? activeTab}
              </span>
            </>
          ) : (
            <span className="school-header__crumb-tagline">Agora for Integrity</span>
          )}
        </div>

        {/* Actions (right) */}
        <div className="school-header__actions">
          {/* GI Terminal link */}
          {terminalState ? (
            <a
              href={TERMINAL_APP_URL}
              target="_blank"
              rel="noreferrer"
              className={`school-header__gi ${giChipLinkClasses(terminalState.mode, terminalState.stale)}`}
              title={terminalState.stale ? 'Terminal snapshot is stale — showing last-known-good' : 'Open Mobius Terminal'}
            >
              ↗ GI {terminalState.gi.toFixed(2)}
              {terminalState.stale && <span className="school-header__gi-stale">(cached)</span>}
            </a>
          ) : (
            <span className="school-header__gi school-header__gi--dim">GI …</span>
          )}

          <TerminalHeartbeat compact className="hidden sm:inline-flex" />

          {/* MII chip */}
          <div className="school-header__chip school-header__chip--mii">
            <span>MII</span>
            <b>0.95</b>
          </div>

          {/* MIC chip */}
          <div className="school-header__chip school-header__chip--mic">
            <span>MIC</span>
            <b>{wallet ? wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</b>
            {env.network.isTestnet && <span className="school-header__testnet-t">T</span>}
          </div>

          {/* Wake Labs (icon only) */}
          <button
            className="school-header__wake"
            onClick={handleWakeAllLabs}
            disabled={isWaking}
            title="Wake all Render services (prevents cold start delays)"
          >
            {wakeComplete
              ? <CheckCircle className="w-4 h-4" />
              : <Coffee className={`w-4 h-4 ${isWaking ? 'animate-pulse' : ''}`} />}
          </button>

          {/* Citizen / Guest */}
          {isGuest ? (
            <button className="school-header__citizen" onClick={triggerBecomeCitizen} title="Become a Citizen">⬡</button>
          ) : citizen ? (
            <CitizenProfileButton onClick={profile.open} />
          ) : null}

          <SentinelStatus sentinels={SENTINELS} />
        </div>
      </header>

      {/* Omnibar + Tabs (hidden in hallway) */}
      {activeTab !== TabId.HALLWAY && (
        <div className="flex-none bg-white border-b border-stone-200">
          <div className="py-2 sm:py-4 px-3 sm:px-6">
            <Omnibar />
          </div>
          <div className="px-2 sm:px-6">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      )}

      <WorldSignalStrip terminalState={terminalState} />

      {/* 🧩 MAIN CONTENT AREA */}
      <main
        className={[
          'flex-1 overflow-hidden relative shadow-inner',
          activeTab !== TabId.HALLWAY
            ? `room-shell room-shell--${ROOM_SHELL_ID[activeTab] ?? ''}`
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Suspense fallback={activeTab !== TabId.HALLWAY ? <LabSkeleton /> : null}>
          {renderContent()}
        </Suspense>
      </main>

      {/* Inquiry Chat Modal - Floating button */}
      <InquiryChatModal />

      {/* Citizen Profile drawer */}
      <CitizenProfile isOpen={profile.isOpen} onClose={profile.close} />
    </div>
  );
};

export default App;
