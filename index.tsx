import './index.css';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GuestLanding } from './components/GuestLanding/GuestLanding';
import { AuthGate } from './components/AuthGate';
import { OnboardingGate } from './components/onboarding/OnboardingGate';
import { WalletProvider } from './contexts/WalletContext';
import { KnowledgeGraphProvider } from './contexts/KnowledgeGraphContext';
import { RootErrorBoundary } from './components/RootErrorBoundary';

function RootGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [hasClickedEnter, setHasClickedEnter] = useState(() =>
    sessionStorage.getItem('mobius_has_entered') === 'true'
  );

  const handleEnter = () => {
    sessionStorage.setItem('mobius_has_entered', 'true');
    setHasClickedEnter(true);
  };

  if (status === 'unauthenticated' && !hasClickedEnter) {
    return <GuestLanding onEnter={handleEnter} />;
  }

  return <>{children}</>;
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
          <AuthGate>
            <OnboardingGate>
              <WalletProvider>
                <KnowledgeGraphProvider>
                  <App />
                </KnowledgeGraphProvider>
              </WalletProvider>
            </OnboardingGate>
          </AuthGate>
        </RootGate>
      </AuthProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);