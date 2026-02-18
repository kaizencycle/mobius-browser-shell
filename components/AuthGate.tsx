/**
 * AuthGate
 *
 * Full-screen gate. Nothing behind it renders until the citizen is
 * authenticated. Sits between RootErrorBoundary and App in index.tsx.
 *
 * Handles three states:
 *   - loading      → animated substrate pulse
 *   - unauthenticated → passkey landing screen
 *   - authenticated → renders children (the shell)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PasskeyService } from '../services/PasskeyService';

type GateView = 'landing' | 'registering' | 'authenticating';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, register, authenticate, error, clearError } = useAuth();
  const [view, setView] = useState<GateView>('landing');
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    PasskeyService.isPlatformAuthenticatorAvailable().then(setIsPlatformAvailable);
  }, []);

  useEffect(() => {
    if (!error) setView('landing');
  }, [error]);

  if (status === 'loading') return <SubstrateLoader />;
  if (status === 'authenticated') return <>{children}</>;

  const handleRegister = async () => {
    clearError();
    setView('registering');
    setIsWorking(true);
    await register();
    setIsWorking(false);
  };

  const handleAuthenticate = async () => {
    clearError();
    setView('authenticating');
    setIsWorking(true);
    await authenticate();
    setIsWorking(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-stone-950 text-stone-100 p-6 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,_#d6d3d1_1px,_transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm animate-fadeIn">
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl font-retro text-stone-100 opacity-90 select-none">⬡</span>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-stone-100">
              Mobius Substrate
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Constitutional AI infrastructure
            </p>
          </div>
        </div>

        {isWorking && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-stone-600 border-t-stone-300 rounded-full animate-spin" />
            <p className="text-xs text-stone-400">
              {view === 'registering'
                ? 'Creating your citizen passkey…'
                : 'Verifying your passkey…'}
            </p>
          </div>
        )}

        {error && !isWorking && (
          <div className="w-full bg-red-950/40 border border-red-800/50 rounded-xl p-4 text-center animate-fadeIn">
            <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-[10px] text-red-500 hover:text-red-400 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {!isWorking && !error && (
          <div className="w-full flex flex-col gap-3">
            {!isPlatformAvailable && (
              <p className="text-amber-500 text-[10px] text-center leading-relaxed mb-1">
                Your browser or device may not support passkeys.
                Try Chrome, Safari, or Edge on a modern device.
              </p>
            )}

            <button
              onClick={handleAuthenticate}
              disabled={!isPlatformAvailable}
              className="w-full py-3 px-4 bg-stone-100 text-stone-900 text-sm font-medium rounded-xl hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 focus:ring-offset-stone-950"
            >
              Sign in with passkey
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-[10px] text-stone-600">new citizen</span>
              <div className="flex-1 h-px bg-stone-800" />
            </div>

            <button
              onClick={handleRegister}
              disabled={!isPlatformAvailable}
              className="w-full py-3 px-4 bg-transparent border border-stone-700 text-stone-300 text-sm font-medium rounded-xl hover:border-stone-500 hover:text-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2 focus:ring-offset-stone-950"
            >
              Register as citizen
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="text-[10px] text-stone-700 leading-relaxed max-w-xs">
            Passkeys use your device&apos;s biometrics or PIN.
            No password is created or stored by Mobius.
          </p>
          <p className="text-[10px] text-stone-800 mt-2">
            For your security, Mobius requires authentication on each new browser session. Your session lasts 24 hours once started.
          </p>
          <p className="text-[10px] text-stone-800 mt-2">
            Mobius Systems · CC0 Public Domain
          </p>
        </div>
      </div>
    </div>
  );
}

function SubstrateLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-950">
      <div className="flex flex-col items-center gap-4">
        <span className="text-4xl font-retro text-stone-700 animate-pulse-subtle select-none">⬡</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 bg-stone-600 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
