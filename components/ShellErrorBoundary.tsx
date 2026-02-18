import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { ErrorCode } from '../errors/errorCodes';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShellErrorBoundaryProps {
  /** The sub-app name shown in the fallback UI ("OAA Learning Hub", etc.) */
  appName: string;
  /** Icon character or emoji for the sub-app (shown in fallback) */
  appIcon?: string;
  /** Optional error code for ATLAS classification */
  errorCode?: ErrorCode;
  /** Whether to show a "retry" button — default true */
  recoverable?: boolean;
  /** Called when an error is caught — use for ATLAS integrity logging */
  onError?: (
    error: Error,
    errorInfo: ErrorInfo,
    appName: string,
    errorCode?: ErrorCode
  ) => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ShellErrorBoundary
 *
 * Wraps individual sub-apps within the Mobius Browser Shell. A crash in one
 * panel (e.g. Citizen Shield) will not bring down OAA Hub or the shell chrome.
 *
 * Designed to plug into the ATLAS sentinel via the onError callback — every
 * caught error gets a unique errorId for correlation across logs.
 *
 * Usage:
 *   <ShellErrorBoundary appName="OAA Learning Hub" appIcon="📚" onError={atlasLog}>
 *     <OAAHub />
 *   </ShellErrorBoundary>
 */
export class ShellErrorBoundary extends Component<
  ShellErrorBoundaryProps,
  State
> {
  constructor(props: ShellErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { appName, onError, errorCode } = this.props;
    const { errorId } = this.state;

    // Console trace for local dev
    console.error(
      `[ShellErrorBoundary] "${appName}" crashed (${errorId})`,
      error,
      errorInfo.componentStack
    );

    // Forward to ATLAS / external logger if wired up
    if (onError) {
      onError(error, errorInfo, appName, errorCode);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { appName, appIcon, recoverable = true, children } = this.props;

    if (!hasError) return children;

    return (
      <ErrorFallback
        appName={appName}
        appIcon={appIcon}
        error={error}
        errorId={errorId}
        recoverable={recoverable}
        onRetry={this.handleRetry}
      />
    );
  }
}

// ── Fallback UI ───────────────────────────────────────────────────────────────

interface ErrorFallbackProps {
  appName: string;
  appIcon?: string;
  error: Error | null;
  errorId: string | null;
  recoverable: boolean;
  onRetry: () => void;
}

function ErrorFallback({
  appName,
  appIcon = '⬡',
  error,
  errorId,
  recoverable,
  onRetry,
}: ErrorFallbackProps) {
  const [showDetail, setShowDetail] = React.useState(false);

  return (
    <div
      className={`flex flex-col items-center justify-center h-full w-full p-8 bg-stone-50 border-2 rounded-xl animate-fadeIn ${
        recoverable ? 'border-stone-200' : 'border-red-500/50 animate-pulse'
      }`}
    >
      {/* Icon + title */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="relative">
          <span className="text-4xl opacity-30 select-none">{appIcon}</span>
          <span className="absolute -bottom-1 -right-1 text-lg">⚠</span>
        </div>
        <h2 className="text-stone-700 font-semibold text-base tracking-tight">
          {appName} is unavailable
        </h2>
        <p className="text-stone-400 text-xs text-center max-w-xs leading-relaxed">
          This panel encountered an unexpected error and has been isolated to
          protect the rest of the shell.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-5">
        {recoverable && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-xs font-medium bg-stone-800 text-stone-50 rounded-lg hover:bg-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
          >
            Retry
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
        >
          Reload shell
        </button>
      </div>

      {/* Error ID + detail toggle */}
      <div className="text-center">
        {errorId && (
          <p className="font-mono text-[10px] text-stone-300 mb-1">{errorId}</p>
        )}
        <button
          onClick={() => setShowDetail((v) => !v)}
          className="text-[10px] text-stone-300 hover:text-stone-400 underline underline-offset-2 transition-colors"
        >
          {showDetail ? 'Hide' : 'Show'} error detail
        </button>
        {showDetail && error && (
          <pre className="mt-3 p-3 bg-stone-100 border border-stone-200 rounded-lg text-[10px] text-stone-500 text-left max-w-sm overflow-auto max-h-32 leading-relaxed">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}

export default ShellErrorBoundary;
