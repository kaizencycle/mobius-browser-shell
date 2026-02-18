import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGate } from './components/AuthGate';
import { OnboardingGate } from './components/onboarding/OnboardingGate';
import { WalletProvider } from './contexts/WalletContext';
import { KnowledgeGraphProvider } from './contexts/KnowledgeGraphContext';
import { RootErrorBoundary } from './components/RootErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AuthProvider>
        <AuthGate>
          <OnboardingGate>
          <WalletProvider>
            <KnowledgeGraphProvider>
              <App />
            </KnowledgeGraphProvider>
          </WalletProvider>
          </OnboardingGate>
        </AuthGate>
      </AuthProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);