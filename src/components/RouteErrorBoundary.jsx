import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export class RouteErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[FORGE] ${this.props.routeName} route crashed`, error, info.componentStack);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.routeName !== this.props.routeName && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex-1 min-h-0 bg-surface-base overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto mt-8 border border-status-incident/40 bg-surface-raised rounded-lg p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-incident shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-label-sm font-bold uppercase tracking-wider text-status-incident">
                {this.props.routeName} page failed to render
              </div>
              <p className="text-body-sm text-text-secondary mt-2">
                Command Center caught the page error instead of leaving a blank screen. Reload once; if it repeats, check the browser console and the Audit log for the matching failure.
              </p>
              <pre className="mt-4 max-h-40 overflow-auto rounded border border-surface-border bg-surface-base p-3 text-[11px] text-text-secondary whitespace-pre-wrap">
                {this.state.error.message || String(this.state.error)}
              </pre>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center gap-2 rounded border border-surface-border bg-surface-base px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-primary hover:border-emerald-accent transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reload page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
