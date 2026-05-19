// scope-expansion-3 follow-up (2026-05-19): catches silent crashes in
// downstream views so the page never goes truly blank — a thrown render in
// any descendant lands here, shows the error stack, and offers a recovery
// button. Wraps the Wizard + Sim views in App.tsx.

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackLabel?: string;
  onReset?: () => void;
};

type State = { error: Error | null; info: ErrorInfo | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[Selectron ErrorBoundary] caught:", error, info);
    this.setState({ info });
  }

  reset = () => {
    this.setState({ error: null, info: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="panel p-6 max-w-3xl mx-auto my-12 border-warn/40">
          <h2 className="display text-lg text-warn mb-2">
            {this.props.fallbackLabel ?? "Something went wrong in this view"}
          </h2>
          <p className="text-sm text-ink-1 mb-4 leading-relaxed">
            A component threw during render. The page didn't blank out silently
            this time — the error boundary caught it. Details below; please copy
            them into a bug report.
          </p>
          <pre className="mono text-[11px] text-amber-300 bg-bg-2 border border-line p-3 rounded-md overflow-x-auto whitespace-pre-wrap mb-3">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack ?? "(no stack)"}
          </pre>
          {this.state.info?.componentStack && (
            <details className="mono text-[10px] text-ink-2">
              <summary className="cursor-pointer hover:text-ink-0">
                component stack
              </summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {this.state.info.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.reset}
            className="mt-4 mono uppercase tracking-cap text-[11px] px-3 py-2 border border-signal text-signal hover:bg-signal/10 rounded-md"
          >
            try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
