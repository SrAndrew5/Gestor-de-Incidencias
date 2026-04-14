import { Component } from "react";

/**
 * ErrorBoundary global — captura cualquier excepción no controlada en el árbol
 * de componentes y muestra una pantalla de error elegante en lugar de la
 * pantalla en blanco del navegador.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Cuando se integre el backend, aquí se enviaría el error a un servicio de logging (Sentry, etc.)
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen bg-zinc-950 flex items-center justify-center p-8"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <div className="max-w-lg w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-amber-400 rounded flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-sm">B</span>
            </div>
            <span className="text-zinc-500 text-xs tracking-widest">BIBLIOTECAS · GESTIÓN TI</span>
          </div>

          {/* Card de error */}
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 text-xl">⚠</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg mb-1">Algo ha fallado</h1>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Se ha producido un error inesperado en la aplicación. El problema ha sido registrado.
                </p>
              </div>
            </div>

            {/* Mensaje del error */}
            {this.state.error && (
              <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-4 py-3">
                <div className="text-zinc-500 text-xs mb-1">DETALLE DEL ERROR</div>
                <code className="text-red-400 text-xs leading-relaxed break-all">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-amber-400 text-zinc-950 font-bold text-sm rounded hover:bg-amber-300 transition-colors"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-zinc-800 text-zinc-200 text-sm rounded hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                Recargar página
              </button>
            </div>

            <p className="text-zinc-700 text-xs text-center">
              Si el problema persiste, contacta con el administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
