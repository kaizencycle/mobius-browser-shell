import { useState, useEffect, useCallback } from 'react';
import {
  getFirstActions,
  markFirstAction,
  resetFirstActions,
  allFirstActionsComplete,
  FIRST_ACTIONS_EVENT,
  type FirstActionId,
} from '../src/lib/onboarding/first-actions';

export function useFirstActions() {
  const [actions, setActions] = useState(getFirstActions);

  useEffect(() => {
    const refresh = () => setActions(getFirstActions());
    window.addEventListener(FIRST_ACTIONS_EVENT, refresh);
    return () => window.removeEventListener(FIRST_ACTIONS_EVENT, refresh);
  }, []);

  const mark = useCallback((action: Exclude<FirstActionId, 'path'>) => {
    markFirstAction(action);
    setActions(getFirstActions());
  }, []);

  const reset = useCallback(() => {
    resetFirstActions();
    setActions(getFirstActions());
  }, []);

  return {
    actions,
    allComplete: allFirstActionsComplete(),
    markSeminar: () => mark('seminar'),
    markJade: () => mark('jade'),
    markPulse: () => mark('pulse'),
    reset,
  };
}
