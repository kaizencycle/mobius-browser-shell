/**
 * Environment configuration for Mobius Browser Shell
 * 
 * Uses Vite's import.meta.env for environment variables.
 * All variables must be prefixed with VITE_ to be exposed to the client.
 */

export const env = {
  // Lab URLs (for iframe embedding)
  OAA_URL: import.meta.env.VITE_OAA_URL as string | undefined,
  REFLECTIONS_URL: import.meta.env.VITE_REFLECTIONS_URL as string | undefined,
  CITIZEN_SHIELD_URL: import.meta.env.VITE_CITIZEN_SHIELD_URL as string | undefined,
  HIVE_URL: import.meta.env.VITE_HIVE_URL as string | undefined,

  // Backend APIs (for future MIC/MII integration)
  MIC_API_BASE: import.meta.env.VITE_MIC_API_BASE as string | undefined,
  LEDGER_API: import.meta.env.VITE_LEDGER_API as string | undefined,
  CORE_API_BASE: import.meta.env.VITE_CORE_API_BASE as string | undefined,

  // Feature flags
  USE_LIVE_LABS: import.meta.env.VITE_USE_LIVE_LABS === 'true',
};

/**
 * Check if a lab should use live iframe vs demo UI
 */
export function shouldUseLiveMode(labUrl: string | undefined): boolean {
  return env.USE_LIVE_LABS && !!labUrl;
}
