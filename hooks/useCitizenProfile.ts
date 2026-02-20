import { useState, useCallback } from 'react';

/**
 * useCitizenProfile
 *
 * Simple open/close state for the CitizenProfile drawer.
 * Keeps panel state out of App.tsx.
 *
 * Usage:
 *   const { isOpen, open, close, toggle } = useCitizenProfile();
 *   <CitizenProfileButton onClick={open} />
 *   <CitizenProfile isOpen={isOpen} onClose={close} />
 */
export function useCitizenProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle };
}
