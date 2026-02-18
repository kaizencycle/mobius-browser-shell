import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { KnowledgeGraphProvider } from './contexts/KnowledgeGraphContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <WalletProvider>
        <KnowledgeGraphProvider>
          <App />
        </KnowledgeGraphProvider>
      </WalletProvider>
    </AuthProvider>
  </React.StrictMode>
);