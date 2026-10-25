import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
            <h1 className="text-2xl font-bold">Algo salió mal</h1>
            <p className="mt-3 text-sm text-muted">
              No pudimos mostrar esta pantalla. Probá recargar o volver al inicio.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg"
              >
                Recargar
              </button>
              <a
                href="/"
                className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-text"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
