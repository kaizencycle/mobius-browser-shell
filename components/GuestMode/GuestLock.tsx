import { ReactNode } from 'react';
import { useGuest } from '../../contexts/GuestContext';

/**
 * GuestLock
 *
 * Wraps any interactive element that requires citizen identity.
 * For guests: intercepts the action and triggers GuestNudge.
 * For citizens: passes through transparently.
 *
 * Usage:
 *   <GuestLock action="submit_quiz">
 *     <button onClick={handleSubmit}>Submit Quiz</button>
 *   </GuestLock>
 *
 * The child renders normally — GuestLock just intercepts onClick.
 * Optional `showLockIcon` adds a subtle ⬡ indicator on the element.
 */

interface GuestLockProps {
  action: string;
  children: ReactNode;
  showLockIcon?: boolean;
}

export function GuestLock({ action, children, showLockIcon = false }: GuestLockProps) {
  const { isGuest, gateAction } = useGuest();

  if (!isGuest) {
    // Citizens: render children with no wrapping at all
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onClickCapture={(e) => {
        const allowed = gateAction(action);
        if (!allowed) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onKeyDownCapture={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const allowed = gateAction(action);
          if (!allowed) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }}
    >
      {children}
      {showLockIcon && (
        <span
          className="absolute top-1 right-1 text-stone-700 text-[10px] select-none pointer-events-none"
          aria-hidden="true"
        >
          ⬡
        </span>
      )}
    </div>
  );
}
