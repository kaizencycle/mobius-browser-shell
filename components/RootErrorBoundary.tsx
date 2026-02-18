import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

/**
 * RootErrorBoundary
 *
 * Last-resort boundary wrapping the entire shell root.
 * If this catches, something fundamental broke (not a sub-app).
 * Shows a full-screen recovery page instead of a blank white screen.
 *
 * Place this as the outermost wrapper in index.tsx / App.tsx root.
 */
export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError(): Partial<State> {
    const errorId = `ROOT-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Shell-level crash', error, errorInfo);
    // TODO: wire to ATLAS sentinel when auth is in place
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-stone-900 text-stone-100 p-8">
        {/* Mobius mark */}
        <div className="text-6xl mb-8 opacity-20 select-none font-retro">
          ⬡
        </div>

        <h1 className="text-xl font-semibold mb-2 tracking-tight">
          Mobius Shell Error
        </h1>
        <p className="text-stone-400 text-sm text-center max-w-sm mb-8 leading-relaxed">
          The shell encountered a critical error. Your data is safe. Please
          reload to restore your session.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 text-sm font-medium bg-stone-100 text-stone-900 rounded-xl hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 focus:ring-offset-stone-900"
        >
          Reload Mobius
        </button>

        {this.state.errorId && (
          <p className="mt-6 font-mono text-[10px] text-stone-600">
            {this.state.errorId}
          </p>
        )}
      </div>
    );
  }
}

export default RootErrorBoundary;
