import { useState, useEffect } from "react";

/* ─── BADGES ──────────────────────────────────────────────────────────────── */

export function Badge({ estado }) {
  const map = {
    ABIERTA:     "bg-red-500 text-white",
    EN_PROGRESO: "bg-amber-400 text-zinc-900",
    RESUELTA:    "bg-emerald-500 text-white",
    CERRADA:     "bg-slate-400 text-white",
  };
  const label = { ABIERTA: "Abierta", EN_PROGRESO: "En Progreso", RESUELTA: "Resuelta", CERRADA: "Cerrada" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide ${map[estado] || "bg-well text-ink"}`}>
      {label[estado] || estado}
    </span>
  );
}

export function PrioridadBadge({ prioridad }) {
  const map = {
    CRITICA: "bg-red-600 text-white",
    ALTA:    "bg-orange-500 text-white",
    MEDIA:   "bg-yellow-400 text-zinc-900",
    BAJA:    "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
  };
  const dot = { CRITICA: "●", ALTA: "●", MEDIA: "●", BAJA: "○" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${map[prioridad] || "bg-well text-ink"}`}>
      <span>{dot[prioridad]}</span>{prioridad}
    </span>
  );
}

export function EstadoEquipo({ estado }) {
  const map = {
    OPERATIVO:    "bg-emerald-500 text-white",
    AVERIADO:     "bg-red-500 text-white",
    MANTENIMIENTO:"bg-amber-400 text-zinc-900",
    BAJA:         "bg-slate-400 text-white dark:bg-slate-600",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${map[estado] || "bg-well text-ink"}`}>{estado}</span>;
}

export function EtiquetaBadge({ tag, onRemove }) {
  const colors = [
    "bg-violet-500 text-white",
    "bg-sky-500 text-white",
    "bg-emerald-500 text-white",
    "bg-pink-500 text-white",
    "bg-amber-400 text-zinc-900",
    "bg-teal-500 text-white",
    "bg-orange-500 text-white",
  ];
  const idx = tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[idx]}`}>
      #{tag}
      {onRemove && (
        <button onClick={() => onRemove(tag)} className="hover:opacity-70 leading-none ml-0.5">✕</button>
      )}
    </span>
  );
}

/* ─── TAG INPUT ───────────────────────────────────────────────────────────── */

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
      <div className="min-h-[40px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded px-2 py-1.5 flex flex-wrap gap-1.5 items-center focus-within:border-amber-500 transition-colors">
        {value.map(tag => <EtiquetaBadge key={tag} tag={tag} onRemove={removeTag} />)}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSug(true); }}
          onKeyDown={handleKey}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder={value.length === 0 ? "Añadir etiqueta..." : ""}
          className="bg-transparent text-ink text-xs outline-none flex-1 min-w-20 placeholder-ink3"
        />
      </div>
      {showSug && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded shadow-xl max-h-36 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
            >
              <span className="text-ink3">#</span>{s}
            </button>
          ))}
        </div>
      )}
      <div className="text-ink3 text-xs mt-1">Enter o coma para añadir · Backspace para eliminar</div>
    </div>
  );
}

/* ─── LAYOUT HELPERS ──────────────────────────────────────────────────────── */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-ink text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-ink3 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, loading = false, className = "", type = "button" }) {
  const variants = {
    primary:   "bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold",
    secondary: "bg-white dark:bg-zinc-800 text-ink hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-300 dark:border-zinc-600",
    danger:    "bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 dark:border-red-500/30",
    ghost:     "text-ink2 hover:text-ink hover:bg-gray-100 dark:hover:bg-zinc-800",
    success:   "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:border-emerald-500/30",
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
  return <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg ${className}`}>{children}</div>;
}

export function EmptyState({ icon = "🔍", title = "Sin resultados", message = "No hemos encontrado nada con esos filtros.", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="text-4xl mb-3 opacity-30">{icon}</div>
      <h3 className="text-ink font-bold text-sm mb-1">{title}</h3>
      <p className="text-ink3 text-xs max-w-xs mx-auto leading-relaxed">{message}</p>
    </div>
  );
}

/* ─── FORM FIELDS ─────────────────────────────────────────────────────────── */

export function Input({ label, error, required, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-ink3 text-xs font-semibold tracking-wide uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        {...props}
        className={`w-full bg-white dark:bg-zinc-800 border ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-gray-300 dark:border-zinc-600 focus:border-amber-500"
        } rounded px-3 py-2 text-ink text-sm placeholder-ink3 focus:outline-none transition-all`}
      />
      {error && <p className="text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  );
}

export function Select({ label, error, required, children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-ink3 text-xs font-semibold tracking-wide uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        {...props}
        className={`w-full bg-white dark:bg-zinc-800 border ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-gray-300 dark:border-zinc-600 focus:border-amber-500"
        } rounded px-3 py-2 text-ink text-sm focus:outline-none transition-all`}
      >
        {children}
      </select>
      {error && <p className="text-red-600 dark:text-red-400 text-xs font-medium">{error}</p>}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = false, color = "" }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-lg p-5 ${accent ? "border-amber-400/40" : "border-gray-200 dark:border-zinc-700"}`}>
      <div className="text-ink3 text-xs mb-2 tracking-wide">{label}</div>
      <div className={`text-3xl font-bold tracking-tight ${color || (accent ? "text-amber-500 dark:text-amber-400" : "text-ink")}`}>{value}</div>
      {sub && <div className="text-ink3 text-xs mt-1">{sub}</div>}
    </div>
  );
}

/* ─── MODAL ───────────────────────────────────────────────────────────────── */

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Backdrop — separate from modal so blur doesn't bleed through */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(10,10,20,0.72)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />
      {/* Scroll container */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pointer-events-none overflow-y-auto">
        <div
          className={`pointer-events-auto w-full my-8 ${wide ? "max-w-2xl" : "max-w-lg"}`}
          style={{ background: "var(--modal-bg, #ffffff)", boxShadow: "0 24px 64px rgba(0,0,0,0.36), 0 0 0 1px rgba(0,0,0,0.08)", borderRadius: "12px" }}
          onClick={e => e.stopPropagation()}
        >
          <style>{`.dark [data-modal] { --modal-bg: #1c1c24; }`}</style>
          <div
            data-modal
            className="bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60">
              <h3 className="text-ink font-bold">{title}</h3>
              <button
                onClick={onClose}
                className="text-ink3 hover:text-ink w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-base leading-none"
                aria-label="Cerrar"
              >✕</button>
            </div>
            <div className="px-5 py-5 max-h-[calc(100vh-10rem)] overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
