import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Contenedor de Toasts */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 transition-all transform animate-in slide-in-from-bottom-5 duration-300
            ${t.type === "error" ? "bg-red-900/90 border border-red-500/50 text-red-50" : 
              t.type === "warning" ? "bg-amber-900/90 border border-amber-500/50 text-amber-50" :
              t.type === "success" ? "bg-emerald-900/90 border border-emerald-500/50 text-emerald-50" : 
              "bg-zinc-800 border border-zinc-700 text-zinc-200"}`}>
            <span className={`text-lg font-bold leading-none ${t.type === "error" ? "text-red-400" : t.type === "warning" ? "text-amber-400" : t.type === "success" ? "text-emerald-400" : "text-amber-400"}`}>
              {t.type === "error" ? "✕" : t.type === "warning" ? "⚠️" : t.type === "success" ? "✓" : "ℹ"}
            </span>
            <span className="text-sm font-medium">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-2 text-white/50 hover:text-white transition-colors">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
