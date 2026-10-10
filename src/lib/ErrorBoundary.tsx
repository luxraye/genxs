import React from 'react';

/**
 * Without this, one render error unmounts the whole surface and the user sees a
 * blank page with no explanation — which is exactly how the laboratory console
 * failed. A clinical console must say what broke.
 */
interface Props { surface: string; children: React.ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`[${this.props.surface}] render failed:`, error, info.componentStack);
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f7f5f2', color: '#14181f', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 560, width: '100%', background: '#fff', border: '1px solid #e2ded9', borderRadius: 10, padding: 24, boxShadow: '0 6px 20px rgba(20,24,31,.07)' }}>
          <div style={{ fontFamily: '"Instrument Sans", sans-serif', fontSize: 18, fontWeight: 600 }}>
            This console stopped.
          </div>
          <p style={{ color: '#5b6470', fontSize: 14, marginTop: 8 }}>
            The {this.props.surface} surface hit an error while rendering. Nothing has been saved or sent. Reload to try
            again; if it repeats, this is the message to report.
          </p>
          <pre style={{ marginTop: 14, padding: 12, background: '#f1eee9', border: '1px solid #e2ded9', borderRadius: 6, fontSize: 12, fontFamily: '"IBM Plex Mono", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '9px 14px', borderRadius: 6, border: '1px solid #cfc9c2', background: '#fff', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
