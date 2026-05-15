// components/Labs/CitizenOnboardingStepper.tsx
// C-307 · ATLAS · guest onboarding path: Explore → Learn → Earn
import React from 'react';
import { useGuest } from '../../contexts/GuestContext';

const STEPS = [
  { id: 1, label: 'Explore', desc: 'Browse the chamber. See what integrity looks like.' },
  { id: 2, label: 'Learn',   desc: 'Complete a lesson. Earn your first XP.' },
  { id: 3, label: 'Earn',    desc: 'Convert XP → MIC. Become a citizen.' },
] as const;

export const CitizenOnboardingStepper: React.FC = () => {
  const { isGuest, triggerBecomeCitizen } = useGuest();
  if (!isGuest) return null;

  return (
    <div className="mx-4 mt-3 mb-1 p-3 rounded-lg border border-stone-200 bg-stone-50 flex-shrink-0">
      <p className="text-[10px] text-stone-400 font-mono mb-2 uppercase tracking-widest">
        ATLAS · Your Path
      </p>
      <div className="flex items-start">
        {STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-0 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                i === 0
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'bg-white border-stone-300 text-stone-400'
              }`}>
                {step.id}
              </div>
              <span className="text-[10px] font-semibold text-stone-700 mt-1">{step.label}</span>
              <span className="text-[9px] text-stone-400 text-center leading-tight mt-0.5 px-1">{step.desc}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-shrink-0 w-6 h-px bg-stone-300 mt-3" />
            )}
          </React.Fragment>
        ))}
      </div>
      <button
        onClick={triggerBecomeCitizen}
        className="mt-3 w-full text-[10px] font-mono py-1.5 rounded border border-stone-900 bg-stone-900 text-white hover:bg-stone-700 transition-colors"
      >
        Become a Citizen →
      </button>
    </div>
  );
};
