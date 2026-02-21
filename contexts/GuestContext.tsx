import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * GuestContext
 *
 * Guest is a valid identity state — not an error, not a fallback.
 * The shell renders fully for guests. Identity unlocks persistence + MIC.
 *
 * State machine:
 *   guest → (clicks "Become a Citizen") → auth flow → citizen
 *
 * The context provides:
 *   - isGuest: boolean — true when no citizen identity
 *   - gateAction: (action: string) => boolean — returns true if allowed,
 *     false + triggers nudge if requires identity
 *   - nudge: shows the "requires citizen identity" prompt
 *   - dismissNudge: hides the prompt
 */

interface GuestContextValue {
  isGuest: boolean;
  nudgeVisible: boolean;
  nudgeAction: string | null;
  gateAction: (action: string, requiresIdentity?: boolean) => boolean;
  dismissNudge: () => void;
  triggerBecomeCitizen: () => void;
}

const GuestContext = createContext<GuestContextValue | null>(null);

// Actions that require citizen identity
const IDENTITY_REQUIRED_ACTIONS = new Set([
  'save_progress',
  'earn_mic',
  'submit_quiz',          // can take quiz but can't earn MIC or save score
  'create_agent',         // can explore but can't save
  'claim_genesis_grant',
  'post_to_record',
  'vote',
  'flag_threat',          // can view Citizen Shield but can't flag
]);

interface GuestProviderProps {
  children: ReactNode;
  isGuest: boolean;
  onBecomeCitizen: () => void;
}

export function GuestProvider({ children, isGuest, onBecomeCitizen }: GuestProviderProps) {
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [nudgeAction, setNudgeAction] = useState<string | null>(null);

  const gateAction = useCallback((action: string, requiresIdentity = true): boolean => {
    if (!isGuest) return true; // citizens always pass
    if (!requiresIdentity) return true; // some actions are open to guests
    if (!IDENTITY_REQUIRED_ACTIONS.has(action)) return true; // not a gated action

    // Show nudge
    setNudgeAction(action);
    setNudgeVisible(true);
    return false;
  }, [isGuest]);

  const dismissNudge = useCallback(() => {
    setNudgeVisible(false);
    setNudgeAction(null);
  }, []);

  const triggerBecomeCitizen = useCallback(() => {
    sessionStorage.removeItem('mobius_guest_session');
    setNudgeVisible(false);
    onBecomeCitizen();
  }, [onBecomeCitizen]);

  return (
    <GuestContext.Provider value={{
      isGuest,
      nudgeVisible,
      nudgeAction,
      gateAction,
      dismissNudge,
      triggerBecomeCitizen,
    }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest(): GuestContextValue {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used within GuestProvider');
  return ctx;
}

// Convenience hook for gating a single action
export function useGatedAction(action: string) {
  const { gateAction, isGuest } = useGuest();
  return {
    isGuest,
    attempt: () => gateAction(action),
  };
}
