/**
 * ErrorBoundary — if any screen throws, show a calm recovery panel instead of
 * a white page. The rest of the app (navigation) keeps working.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Zwiers Home screen error', error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Navigating to another screen clears the error.
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="tile mx-auto mt-8 max-w-lg p-6 text-center">
        <p className="text-lead font-medium text-fg">Something went wrong on this screen</p>
        <p className="mt-2 text-body text-muted">The rest of the dashboard still works. Reloading usually fixes it.</p>
        <p className="mt-3 text-label text-muted">{this.state.error.message}</p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-5 inline-flex h-11 items-center rounded-full border border-accent-ink bg-accent px-5 font-semibold text-on-accent"
        >
          Reload
        </button>
      </div>
    );
  }
}
