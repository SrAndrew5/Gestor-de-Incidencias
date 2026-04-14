import { useState, useEffect } from "react";

export function Badge({ estado }) {
  const map = {
    ABIERTA: "bg-red-400/15 text-red-400 border border-red-400/30",
    EN_PROGRESO: "bg-amber-400/15 text-amber-400 border border-amber-400/30",
    RESUELTA: "bg-emerald-400/15 text-emerald-400 border border-emerald-400/30",
    CERRADA: "bg-zinc-600/40 text-zinc-400 border border-zinc-600/30",
  };
  const label = { ABIERTA: "Abierta", EN_PROGRESO: "En Progreso", RESUELTA: "Resuelta", CERRADA: "Cerrada" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide ${map[estado] || "bg-zinc-700 text-zinc-400"}`}>
      {label[estado] || estado}
    </span>
  );
}

export function PrioridadBadge({ prioridad }) {
  const map = {
    CRITICA: "bg-red-900/60 text-red-300 border border-red-700/50",
    ALTA: "bg-orange-900/40 text-orange-300 border border-orange-700/40",
    MEDIA: "bg-yellow-900/30 text-yellow-300 border border-yellow-700/30",
    BAJA: "bg-zinc-700/40 text-zinc-400 border border-zinc-600/30",
  };
  const dot = { CRITICA: "●", ALTA: "●", MEDIA: "●", BAJA: "○" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${map[prioridad] || "bg-zinc-700 text-zinc-400"}`}>
      <span className="text-xs">{dot[prioridad]}</span>{prioridad}
    </span>
  );
}

export function EstadoEquipo({ estado }) {
  const map = {
    OPERATIVO: "bg-emerald-400/15 text-emerald-400",
    AVERIADO: "bg-red-400/15 text-red-400",
    MANTENIMIENTO: "bg-amber-400/15 text-amber-400",
    BAJA: "bg-zinc-600/30 text-zinc-500",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[estado] || "bg-zinc-700 text-zinc-400"}`}>{estado}</span>;
}

// Etiqueta Badge - solo visualización
export function EtiquetaBadge({ tag, onRemove }) {
  // Color determinista basado en el nombre de la etiqueta
  const colors = [
    "bg-violet-400/15 text-violet-300 border-violet-400/25",
    "bg-sky-400/15 text-sky-300 border-sky-400/25",
    "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
    "bg-pink-400/15 text-pink-300 border-pink-400/25",
    "bg-amber-400/15 text-amber-300 border-amber-400/25",
    "bg-teal-400/15 text-teal-300 border-teal-400/25",
    "bg-orange-400/15 text-orange-300 border-orange-400/25",
  ];
  const idx = tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colors[idx]}`}>
      #{tag}
      {onRemove && (
        <button onClick={() => onRemove(tag)} className="hover:opacity-70 leading-none ml-0.5">✕</button>
      )}
    </span>
  );
}

// TagInput — añadir/eliminar etiquetas con autocompletado
export function TagInput({ value = [], onChange, suggestions = [] }) {
  const [input, setInput] = useState("");
  const [showSug, setShowSug] = useState(false);

  const filtered = suggestions.filter(s => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()));

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (clean && !value.includes(clean)) onChange([...value, clean]);
    setInput("");
    setShowSug(false);
  };

  const removeTag = (tag) => onChange(value.filter(t => t !== tag));

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); if (input.trim()) addTag(input); }
    if (e.key === "Backspace" && !input && value.length) removeTag(value[value.length - 1]);
  };

  return (
    <div className="relative">
      <div className="min-h-[40px] bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 flex flex-wrap gap-1.5 items-center focus-within:border-amber-400/60 transition-colors">
        {value.map(tag => <EtiquetaBadge key={tag} tag={tag} onRemove={removeTag} />)}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSug(true); }}
          onKeyDown={handleKey}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder={value.length === 0 ? "Añadir etiqueta..." : ""}
          className="bg-transparent text-zinc-300 text-xs outline-none flex-1 min-w-20 placeholder-zinc-600"
        />
      </div>
      {showSug && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded shadow-xl max-h-36 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
            >
              <span className="text-zinc-500">#</span>{s}
            </button>
          ))}
        </div>
      )}
      <div className="text-zinc-600 text-xs mt-1">Enter o coma para añadir · Backspace para eliminar</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, loading = false, className = "", type = "button" }) {
  const variants = {
    primary: "bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold",
    secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700",
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30",
    ghost: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
    success: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 rounded transition-all ${variants[variant]} ${sizes[size]} ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`bg-zinc-900 border border-zinc-800 rounded-lg ${className}`}>{children}</div>;
}

export function EmptyState({ icon = "🔍", title = "Sin resultados", message = "No hemos encontrado nada con esos filtros.", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="text-4xl mb-3 opacity-30">{icon}</div>
      <h3 className="text-zinc-200 font-bold text-sm mb-1">{title}</h3>
      <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed">{message}</p>
    </div>
  );
}

export function Input({ label, error, required, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-zinc-400 text-[10px] font-bold tracking-widest uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input 
        {...props} 
        className={`w-full bg-zinc-800 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-amber-400/60'} rounded px-3 py-2 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none transition-all`} 
      />
      {error && <p className="text-red-400 text-[10px] font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  );
}

export function Select({ label, error, required, children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-zinc-400 text-[10px] font-bold tracking-widest uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select 
        {...props} 
        className={`w-full bg-zinc-800 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-amber-400/60'} rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none transition-all`}
      >
        {children}
      </select>
      {error && <p className="text-red-400 text-[10px] font-medium">{error}</p>}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = false, color = "" }) {
  return (
    <div className={`bg-zinc-900 border rounded-lg p-5 ${accent ? "border-amber-400/30" : "border-zinc-800"}`}>
      <div className="text-zinc-500 text-xs mb-2 tracking-wide">{label}</div>
      <div className={`text-3xl font-bold tracking-tight ${color || (accent ? "text-amber-400" : "text-white")}`}>{value}</div>
      {sub && <div className="text-zinc-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-zinc-900 border border-zinc-700 rounded-xl w-full shadow-2xl my-4 ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-bold text-sm">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 text-lg leading-none" aria-label="Cerrar">✕</button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
