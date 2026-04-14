import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

const MAX_TOASTS = 4;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => {
      // Límite de 4 toasts: descarta el más antiguo si se supera
      const next = [...prev, { id, message, type }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 pointer-events-auto
              transition-all animate-in slide-in-from-bottom-5 duration-300
              ${t.type === "error"   ? "bg-red-900/90 border border-red-500/50 text-red-50"       :
                t.type === "warning" ? "bg-amber-900/90 border border-amber-500/50 text-amber-50" :
                t.type === "success" ? "bg-emerald-900/90 border border-emerald-500/50 text-emerald-50" :
                "bg-zinc-800 border border-zinc-700 text-zinc-200"}`}
          >
            <span className={`text-lg font-bold leading-none flex-shrink-0
              ${t.type === "error" ? "text-red-400" : t.type === "warning" ? "text-amber-400" : t.type === "success" ? "text-emerald-400" : "text-amber-400"}`}>
              {t.type === "error" ? "✕" : t.type === "warning" ? "⚠️" : t.type === "success" ? "✓" : "ℹ"}
            </span>
            <span className="text-sm font-medium flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 text-white/40 hover:text-white transition-colors flex-shrink-0"
              aria-label="Cerrar notificación"
            >✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
