/**
 * Mobius Substrate - Environment Configuration
 * 
 * Uses Vite's import.meta.env for environment variables.
 * All variables must be prefixed with VITE_ to be exposed to the client.
 * 
 * Complete infrastructure mapping for browser shell.
 */

export const env = {
  // === FRONTEND LABS (iframe targets) ===
  labs: {
    oaa: import.meta.env.VITE_OAA_URL as string || 'https://lab7-proof.onrender.com',
    reflections: import.meta.env.VITE_REFLECTIONS_URL as string || 'https://hive-api-2le8.onrender.com',
    citizenShield: import.meta.env.VITE_CITIZEN_SHIELD_URL as string || 'https://lab6-proof-api.onrender.com',
    hive: import.meta.env.VITE_HIVE_URL as string | undefined,
  },

  // === BACKEND APIs ===
  api: {
    atlas: import.meta.env.VITE_ATLAS_URL as string || '/api/atlas/events',
    oaa: import.meta.env.VITE_OAA_API_BASE as string || 'https://oaa-api-library.onrender.com',
    reflections: import.meta.env.VITE_REFLECTIONS_API_BASE as string || 'https://hive-api-2le8.onrender.com',
    citizenShield: import.meta.env.VITE_CITIZEN_SHIELD_API_BASE as string || 'https://lab6-proof-api.onrender.com',
    // Civic Radar API - defaults to OAA API which hosts the civic-radar route
    civicRadar: import.meta.env.VITE_CIVIC_RADAR_API_BASE as string || import.meta.env.VITE_OAA_API_BASE as string || 'https://oaa-api-library.onrender.com',
    ledger: import.meta.env.VITE_LEDGER_API as string || 'https://civic-protocol-core-ledger.onrender.com',
    micIndexer: import.meta.env.VITE_MIC_API_BASE as string || 'https://gic-indexer.onrender.com',
    thoughtBroker: import.meta.env.VITE_THOUGHT_BROKER_API as string || 'https://mobius-systems.onrender.com',
    // Identity & MIC Wallet services
    identity: import.meta.env.VITE_IDENTITY_API_BASE as string || 'https://mobius-identity-service.onrender.com',
    // MIC Wallet - can use dedicated service OR OAA API (which now has /api/mic/* endpoints)
    // Set VITE_USE_OAA_WALLET=true to use OAA API for wallet operations
    micWallet: (import.meta.env.VITE_USE_OAA_WALLET === 'true' 
      ? (import.meta.env.VITE_OAA_API_BASE as string || 'https://oaa-api-library.onrender.com') + '/api'
      : import.meta.env.VITE_MIC_WALLET_API_BASE as string || 'https://mobius-mic-wallet-service.onrender.com'),
  },

  // === FEATURE FLAGS ===
  features: {
    useLiveLabs: import.meta.env.VITE_USE_LIVE_LABS === 'true',
    micEnabled: import.meta.env.VITE_MIC_ENABLED === 'true',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV,
  },

  // === NETWORK CONFIG ===
  network: {
    name: import.meta.env.VITE_NETWORK as string || 'testnet',
    isTestnet: (import.meta.env.VITE_NETWORK as string || 'testnet') === 'testnet',
    isMainnet: (import.meta.env.VITE_NETWORK as string || 'testnet') === 'mainnet',
  },

  // === DEPLOYMENT INFO ===
  deployment: {
    env: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },

  // Legacy aliases for backwards compatibility
  OAA_URL: import.meta.env.VITE_OAA_URL as string || 'https://lab7-proof.onrender.com',
  REFLECTIONS_URL: import.meta.env.VITE_REFLECTIONS_URL as string || 'https://hive-api-2le8.onrender.com',
  CITIZEN_SHIELD_URL: import.meta.env.VITE_CITIZEN_SHIELD_URL as string || 'https://lab6-proof-api.onrender.com',
  HIVE_URL: import.meta.env.VITE_HIVE_URL as string | undefined,
  MIC_API_BASE: import.meta.env.VITE_MIC_API_BASE as string || 'https://gic-indexer.onrender.com',
  LEDGER_API: import.meta.env.VITE_LEDGER_API as string || 'https://civic-protocol-core-ledger.onrender.com',
  CORE_API_BASE: import.meta.env.VITE_CORE_API_BASE as string || 'https://oaa-api-library.onrender.com',
  USE_LIVE_LABS: import.meta.env.VITE_USE_LIVE_LABS === 'true',
} as const;

// Type exports
export type Environment = typeof env;

/**
 * Get all lab URLs for waking sleeping services
 */
export function getAllLabUrls(): string[] {
  return [
    env.labs.oaa,
    env.labs.reflections,
    env.labs.citizenShield,
  ].filter(Boolean) as string[];
}

/**
 * Get all API URLs for health checks
 */
export function getAllApiUrls(): string[] {
  return [
    env.api.oaa,
    env.api.reflections,
    env.api.citizenShield,
    env.api.ledger,
    env.api.micIndexer,
    env.api.thoughtBroker,
  ].filter(Boolean) as string[];
}

/**
 * Wake all Render services (ping to prevent cold starts)
 */
export async function wakeAllServices(): Promise<void> {
  const urls = [...getAllLabUrls(), ...getAllApiUrls()];
  
  await Promise.allSettled(
    urls.map(url => 
      fetch(url, { mode: 'no-cors' }).catch(() => {})
    )
  );
}

/**
 * Check if a lab should use live iframe vs demo UI
 */
export function shouldUseLiveMode(labUrl: string | undefined): boolean {
  return env.features.useLiveLabs && !!labUrl;
}

// Validation helpers
export const validateEnv = () => {
  const missing: string[] = [];
  
  if (!env.labs.oaa) missing.push('VITE_OAA_URL');
  if (!env.labs.reflections) missing.push('VITE_REFLECTIONS_URL');
  if (!env.labs.citizenShield) missing.push('VITE_CITIZEN_SHIELD_URL');
  
  if (missing.length > 0 && env.deployment.isProd) {
    console.error('❌ Missing required environment variables:', missing);
  }
  
  return missing.length === 0;
};

// Development logging
if (env.features.debugMode) {
  console.log('🌀 Mobius Environment Config:', {
    labs: env.labs,
    apis: env.api,
    features: env.features,
    deployment: env.deployment,
  });
  
  validateEnv();
}
