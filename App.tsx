import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { TabId } from './types';
import { LabSkeleton } from './components/Labs/LabSkeleton';

import { Hallway } from './components/Hallway';
import { OAAChamber } from './components/chambers/OAAChamber';
import { HiveChamber } from './components/chambers/HiveChamber';
import { ReflectionsChamber } from './components/chambers/ReflectionsChamber';
import { ShieldChamber } from './components/chambers/ShieldChamber';
import { AtlasChamber } from './components/chambers/AtlasChamber';
import { JadeChamber } from './components/chambers/JadeChamber';
import { WalletChamber } from './components/chambers/WalletChamber';
import { VaultChamber } from './components/chambers/VaultChamber';
import { EPICONChamber } from './components/chambers/EPICONChamber';
import { ReturnCitizenDashboard } from './components/onboarding/ReturnCitizenDashboard';
import { CivicAlertBanner } from './components/Notifications/CivicAlertBanner';
import { LiveSystemBar } from './components/Header/LiveSystemBar';
import { useAuth } from './contexts/AuthContext';
import { useSessionHeartbeat } from './hooks/useSessionHeartbeat';
import { InquiryChatModal } from './components/InquiryChatModal';
import { CitizenProfile } from './components/CitizenProfile/CitizenProfile';
import { useCitizenProfile } from './hooks/useCitizenProfile';
import { useDocumentTitle } from './hooks/useDocumentTitle';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.HALLWAY);

  const { citizen } = useAuth();
  const profile = useCitizenProfile();

  useSessionHeartbeat();
  useDocumentTitle(activeTab);

  // FIX-20: Cmd+P → citizen profile
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p' && citizen) {
        e.preventDefault();
        profile.isOpen ? profile.close() : profile.open();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [citizen, profile]);

  const goToKnowledgeGraph = React.useCallback(() => setActiveTab(TabId.KNOWLEDGE_GRAPH), []);
  const goToReflections = React.useCallback(() => setActiveTab(TabId.REFLECTIONS), []);

  // OPT-15: ambient GI mood class on shell
  const giMoodClass = useMemo(() => {
    // We don't have GI here directly, but LiveSystemBar owns it — use a data attribute trick
    // For now derive from document if set; otherwise neutral
    return '';
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case TabId.HALLWAY:
        return citizen
          ? <ReturnCitizenDashboard onSelectTab={setActiveTab} />
          : <Hallway onEnter={setActiveTab} onOpenProfile={profile.open} />;
      case TabId.OAA:
        return <OAAChamber onNavigateToKnowledgeGraph={goToKnowledgeGraph} />;
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
      case TabId.VAULT:
        return <VaultChamber />;
      case TabId.EPICON:
        return <EPICONChamber />;
      default:
        console.warn(`[Shell] Unhandled TabId: ${String(activeTab)} — falling back to OAA`);
        return <OAAChamber />;
    }
  };

  return (
    <div className={`app-shell bg-stone-950 text-stone-100${giMoodClass ? ` ${giMoodClass}` : ''}`}>
      {/* OPT-02: CRT scanline overlay — subtle, adds depth */}
      <div className="crt-overlay" aria-hidden="true" />
      <LiveSystemBar />

      {activeTab !== TabId.HALLWAY && (
        <button
          className="hall-back-float"
          onClick={() => setActiveTab(TabId.HALLWAY)}
          aria-label="Return to hallway"
        >
          ← hallway
        </button>
      )}

      <CivicAlertBanner />
      <main className="app-main">
        <Suspense fallback={activeTab !== TabId.HALLWAY ? <LabSkeleton /> : null}>
          <div key={activeTab} className="h-full animate-stepIn">
            {renderContent()}
          </div>
        </Suspense>
      </main>

      <InquiryChatModal />
      <CitizenProfile isOpen={profile.isOpen} onClose={profile.close} />
    </div>
  );
};

export default App;
