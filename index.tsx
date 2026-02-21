import './index.css';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { GuestProvider } from './contexts/GuestContext';
import { GuestLanding } from './components/GuestLanding/GuestLanding';
import { GuestBadge } from './components/GuestMode/GuestBadge';
import { GuestNudge } from './components/GuestMode/GuestNudge';
import { AuthGate } from './components/AuthGate';
import { OnboardingGate } from './components/onboarding/OnboardingGate';
import { WalletProvider } from './contexts/WalletContext';
import { KnowledgeGraphProvider } from './contexts/KnowledgeGraphContext';
import { RootErrorBoundary } from './components/RootErrorBoundary';

function RootGate({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'landing' | 'guest' | 'auth'>(() => {
    if (sessionStorage.getItem('mobius_has_entered') === 'true') return 'auth';
    return 'guest'; // Default: launch guest shell first, not auth gate
  });

  const isGuest = mode === 'guest';
  const isAuthenticated = false; // AuthGate handles auth; guest shell has no citizen

  const handleBecomeCitizen = () => {
    sessionStorage.setItem('mobius_has_entered', 'true');
    setMode('auth');
  };

  const handleExploreAsGuest = () => {
    setMode('guest');
  };

  if (mode === 'landing') {
    return (
      <GuestLanding
        onEnter={handleBecomeCitizen}
        onExplore={handleExploreAsGuest}
      />
    );
  }

  return (
    <GuestProvider isGuest={isGuest} onBecomeCitizen={handleBecomeCitizen}>
      {isGuest ? (
        <>
          <WalletProvider>
            <KnowledgeGraphProvider>
              <App />
            </KnowledgeGraphProvider>
          </WalletProvider>
          <GuestBadge />
          <GuestNudge />
        </>
      ) : (
        <AuthGate>
          <OnboardingGate>
            <WalletProvider>
              <KnowledgeGraphProvider>
                {children}
              </KnowledgeGraphProvider>
            </WalletProvider>
          </OnboardingGate>
        </AuthGate>
      )}
    </GuestProvider>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AuthProvider>
        <RootGate>
          <App />
        </RootGate>
      </AuthProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);
