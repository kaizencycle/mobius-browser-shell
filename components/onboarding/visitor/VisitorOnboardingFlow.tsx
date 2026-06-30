import React from 'react';
import type { TabId } from '../../../types';
import type { OnboardingPath } from '../../../src/lib/onboarding/paths';
import { ONBOARDING_PATHS } from '../../../src/lib/onboarding/paths';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PathScreen } from './screens/PathScreen';
import { ChamberPreviewScreen } from './screens/ChamberPreviewScreen';
import { IdentityScreen } from './screens/IdentityScreen';

const STEP_LABELS = ['Welcome', 'Your path', 'First chamber', 'Identity'];

function StepNav({ current, onSelect }: { current: number; onSelect: (n: number) => void }) {
  return (
    <div className="visitor-step-nav">
      {STEP_LABELS.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <React.Fragment key={label}>
            <button
              className={`visitor-step-btn${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
              onClick={() => isDone && onSelect(i)}
              disabled={!isDone && !isActive}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="visitor-step-num">{isDone ? '✓' : i + 1}</span>
              <span className="visitor-step-label">{label}</span>
            </button>
            {i < STEP_LABELS.length - 1 && <div className="visitor-step-sep" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export interface VisitorOnboardingFlowProps {
  state: {
    currentStep: number;
    path: OnboardingPath | null;
    civicId: string | null;
  };
  setStep: (step: number) => void;
  setPath: (path: OnboardingPath) => void;
  complete: (firstChamber: string, setActiveTab?: (tab: TabId) => void) => void;
  skip: () => void;
  setActiveTab: (tab: TabId) => void;
}

export function VisitorOnboardingFlow({
  state,
  setStep,
  setPath,
  complete,
  skip,
  setActiveTab,
}: VisitorOnboardingFlowProps) {
  const selectedPath = ONBOARDING_PATHS.find(p => p.id === state.path) ?? null;
  const progress = ((state.currentStep + 1) / STEP_LABELS.length) * 100;

  return (
    <div className="visitor-wrapper">
      {/* Progress bar */}
      <div className="visitor-progress-bar">
        <div
          className="visitor-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="visitor-inner">
        <StepNav current={state.currentStep} onSelect={setStep} />

        {state.currentStep === 0 && (
          <WelcomeScreen onContinue={() => setStep(1)} onSkip={skip} />
        )}
        {state.currentStep === 1 && (
          <PathScreen
            selectedPath={state.path}
            onSelect={path => { setPath(path); }}
            onContinue={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {state.currentStep === 2 && (
          <ChamberPreviewScreen
            path={selectedPath}
            onContinue={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {state.currentStep === 3 && (
          <IdentityScreen
            path={selectedPath}
            civicId={state.civicId}
            onComplete={() => complete(selectedPath?.firstChamber ?? 'hallway', setActiveTab)}
            onBack={() => setStep(2)}
            onSkip={skip}
          />
        )}
      </div>
    </div>
  );
}
