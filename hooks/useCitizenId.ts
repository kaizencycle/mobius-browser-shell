import { useAuth } from '../contexts/AuthContext';

/**
 * useCitizenId
 *
 * Convenience hook. Returns the authenticated citizen's ID or null.
 * Primarily used to inject citizenId into ATLAS event payloads.
 */
export function useCitizenId(): string | null {
  const { citizen } = useAuth();
  return citizen?.citizenId ?? null;
}
