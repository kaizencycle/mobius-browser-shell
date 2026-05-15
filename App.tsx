import React, { Suspense, useState } from 'react';
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
import { useAuth } from './contexts/AuthContext';
import { useSessionHeartbeat } from './hooks/useSessionHeartbeat';
import { InquiryChatModal } from './components/InquiryChatModal';
import { CitizenProfile } from './components/CitizenProfile/CitizenProfile';
import { useCitizenProfile } from './hooks/useCitizenProfile';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.HALLWAY);

  const { citizen } = useAuth();
  const profile = useCitizenProfile();

  useSessionHeartbeat();

  const goToKnowledgeGraph = React.useCallback(() => setActiveTab(TabId.KNOWLEDGE_GRAPH), []);
  const goToReflections = React.useCallback(() => setActiveTab(TabId.REFLECTIONS), []);

  const renderContent = () => {
    switch (activeTab) {
      case TabId.HALLWAY:
        return <Hallway onEnter={setActiveTab} onOpenProfile={profile.open} />;
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
      default:
        return <OAAChamber />;
    }
  };

  return (
    <div className="app-shell">
      {activeTab !== TabId.HALLWAY && (
        <button
          className="hall-back-float"
          onClick={() => setActiveTab(TabId.HALLWAY)}
          aria-label="Return to hallway"
        >
          ← hallway
        </button>
      )}

      <main className="app-main">
        <Suspense fallback={activeTab !== TabId.HALLWAY ? <LabSkeleton /> : null}>
          {renderContent()}
        </Suspense>
      </main>

      <InquiryChatModal />
      <CitizenProfile isOpen={profile.isOpen} onClose={profile.close} />
    </div>
  );
};

export default App;
