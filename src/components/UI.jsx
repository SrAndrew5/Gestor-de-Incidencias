import { useState, useEffect, forwardRef } from "react";
import { cn } from "../utils/cn";

/* ─── BADGES ──────────────────────────────────────────────────────────────── */

export function Badge({ estado, className }) {
  const map = {
    ABIERTA:     "bg-red-500 text-white dark:bg-red-600",
    EN_PROGRESO: "bg-amber-400 text-zinc-900 dark:bg-amber-500 dark:text-zinc-950",
    RESUELTA:    "bg-emerald-500 text-white dark:bg-emerald-600",
    CERRADA:     "bg-slate-400 text-white dark:bg-slate-600",
  };
  const label = { ABIERTA: "Abierta", EN_PROGRESO: "En Progreso", RESUELTA: "Resuelta", CERRADA: "Cerrada" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide", map[estado] || "bg-well text-ink", className)}>
      {label[estado] || estado}
    </span>
  );
}

export function PrioridadBadge({ prioridad, className }) {
  const map = {
    CRITICA: "bg-red-600 text-white dark:bg-red-700",
    ALTA:    "bg-orange-500 text-white dark:bg-orange-600",
    MEDIA:   "bg-yellow-400 text-zinc-900 dark:bg-yellow-500 dark:text-zinc-950",
    BAJA:    "bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-200",
  };
  const dot = { CRITICA: "●", ALTA: "●", MEDIA: "●", BAJA: "○" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", map[prioridad] || "bg-well text-ink", className)}>
      <span aria-hidden="true">{dot[prioridad]}</span>{prioridad}
    </span>
  );
}

export function EstadoEquipo({ estado, className }) {
  const map = {
    OPERATIVO:    "bg-emerald-500 text-white",
    AVERIADO:     "bg-red-500 text-white",
    MANTENIMIENTO:"bg-amber-400 text-zinc-900",
    BAJA:         "bg-slate-400 text-white dark:bg-slate-600",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold", map[estado] || "bg-well text-ink", className)}>{estado}</span>;
}

export function EtiquetaBadge({ tag, onRemove, className }) {
  const colors = [
    "bg-violet-500 text-white dark:bg-violet-600",
    "bg-sky-500 text-white dark:bg-sky-600",
    "bg-emerald-500 text-white dark:bg-emerald-600",
    "bg-pink-500 text-white dark:bg-pink-600",
    "bg-amber-400 text-zinc-900 dark:bg-amber-500 dark:text-zinc-950",
    "bg-teal-500 text-white dark:bg-teal-600",
    "bg-orange-500 text-white dark:bg-orange-600",
  ];
  const idx = tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", colors[idx], className)}>
      #{tag}
      {onRemove && (
        <button onClick={() => onRemove(tag)} className="hover:opacity-70 leading-none ml-0.5 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full" aria-label={`Quitar etiqueta ${tag}`}>✕</button>
      )}
    </span>
  );
}

/* ─── TAG INPUT ───────────────────────────────────────────────────────────── */

export function TagInput({ value = [], onChange, suggestions = [], className }) {
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
    <div className={cn("relative", className)}>
      <div className="min-h-[40px] bg-card border border-edge rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5 items-center focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
        {value.map(tag => <EtiquetaBadge key={tag} tag={tag} onRemove={removeTag} />)}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSug(true); }}
          onKeyDown={handleKey}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder={value.length === 0 ? "Añadir etiqueta..." : ""}
          className="bg-transparent text-ink text-sm outline-none flex-1 min-w-20 placeholder-ink3"
        />
      </div>
      {showSug && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-card border border-edge rounded-lg shadow-xl max-h-36 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-hov flex items-center gap-2 transition-colors focus:bg-hov outline-none"
            >
              <span className="text-ink3" aria-hidden="true">#</span>{s}
            </button>
          ))}
        </div>
      )}
      <div className="text-ink3 text-xs mt-1.5" aria-live="polite">Enter o coma para añadir · Backspace para eliminar</div>
    </div>
  );
}

/* ─── LAYOUT HELPERS ──────────────────────────────────────────────────────── */

export function PageHeader({ title, subtitle, actions, className }) {
  return (
    <header className={cn("flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8", className)}>
      <div>
        <h1 className="text-ink text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-ink3 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap sm:ml-auto">{actions}</div>}
    </header>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, loading = false, className, type = "button" }) {
  const variants = {
    primary:   "bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold shadow-sm",
    secondary: "bg-card text-ink hover:bg-hov border border-edge shadow-sm",
    danger:    "bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 dark:border-red-500/30 shadow-sm",
    ghost:     "text-ink2 hover:text-ink hover:bg-well",
    success:   "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:border-emerald-500/30 shadow-sm",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/70",
        variants[variant],
        sizes[size],
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>
        {children}
      </span>
    </button>
  );
}

export function Card({ children, className, as: Component = "article" }) {
  return (
    <Component className={cn("bg-card border border-edge rounded-xl overflow-hidden", className)}>
      {children}
    </Component>
  );
}

export function EmptyState({ icon = "🔍", title = "Sin resultados", message = "No hemos encontrado nada con esos filtros.", className }) {
  return (
    <section className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="text-5xl mb-4 opacity-30 drop-shadow-sm" aria-hidden="true">{icon}</div>
      <h3 className="text-ink font-bold text-base mb-1.5">{title}</h3>
      <p className="text-ink3 text-sm max-w-sm mx-auto leading-relaxed">{message}</p>
    </section>
  );
}

/* ─── FORM FIELDS ─────────────────────────────────────────────────────────── */

export const Input = forwardRef(({ label, error, required, className, containerClassName, ...props }, ref) => {
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <label className="block text-ink3 text-xs font-semibold tracking-wider uppercase">
          {label} {required && <span className="text-red-500" aria-label="requerido">*</span>}
        </label>
      )}
      <input
        {...props}
        ref={ref}
        className={cn(
          "w-full bg-card border rounded-lg px-3 py-2 text-ink text-sm placeholder-ink3 focus:outline-none focus:ring-2 transition-all",
          error ? "border-red-400 focus:ring-red-500/30" : "border-edge focus:border-amber-500/80 focus:ring-amber-500/20",
          className
        )}
      />
      {error && <p role="alert" className="text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

export const Select = forwardRef(({ label, error, required, children, className, containerClassName, ...props }, ref) => {
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <label className="block text-ink3 text-xs font-semibold tracking-wider uppercase">
          {label} {required && <span className="text-red-500" aria-label="requerido">*</span>}
        </label>
      )}
      <select
        {...props}
        ref={ref}
        className={cn(
          "w-full bg-card border rounded-lg px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer",
          error ? "border-red-400 focus:ring-red-500/30" : "border-edge focus:border-amber-500/80 focus:ring-amber-500/20",
          className
        )}
      >
        {children}
      </select>
      {error && <p role="alert" className="text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  );
});
Select.displayName = "Select";

export function StatCard({ label, value, sub, accent = false, color = "", className }) {
  return (
    <Card className={cn("p-5 transition-shadow hover:shadow-sm", accent && "border-amber-400/40 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-900/10", className)}>
      <div className="text-ink3 text-xs mb-2 tracking-wide font-medium">{label}</div>
      <div className={cn("text-3xl font-bold tracking-tight", color || (accent ? "text-amber-600 dark:text-amber-400" : "text-ink"))}>
        {value}
      </div>
      {sub && <div className="text-ink3 text-sm mt-1">{sub}</div>}
    </Card>
  );
}

/* ─── LOADERS ─────────────────────────────────────────────────────────────── */

export function SkeletonIncidencia() {
  return (
    <tr className="animate-pulse border-l-2 border-l-transparent">
      <td className="px-3 py-2.5"><div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-8"></div></td>
      <td className="px-3 py-2.5">
        <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-3/4 mb-1.5"></div>
        <div className="h-3 min-h-[12px] bg-edge2/40 dark:bg-zinc-800/60 rounded w-1/2"></div>
      </td>
      <td className="px-3 py-2.5"><div className="h-5 min-h-[20px] bg-edge2/60 dark:bg-zinc-800 rounded w-16"></div></td>
      <td className="px-3 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-5 min-h-[20px] bg-edge2/60 dark:bg-zinc-800 rounded-full w-12"></div>
          <div className="h-5 min-h-[20px] bg-edge2/60 dark:bg-zinc-800 rounded-full w-10"></div>
        </div>
      </td>
      <td className="px-3 py-2.5"><div className="h-5 min-h-[20px] bg-edge2/60 dark:bg-zinc-800 rounded-full w-20"></div></td>
      <td className="px-3 py-2.5"><div className="h-5 min-h-[20px] bg-edge2/60 dark:bg-zinc-800 rounded-full w-16"></div></td>
      <td className="px-3 py-2.5"><div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-24"></div></td>
    </tr>
  );
}

export function SkeletonDetalle() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-24"></div>
        <div className="text-edge2">/</div>
        <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-16"></div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="border border-edge rounded-xl p-6 bg-card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="h-6 min-h-[24px] bg-edge2/60 dark:bg-zinc-800 rounded w-3/4"></div>
              <div className="h-5 min-h-[20px] bg-edge2/60 dark:bg-zinc-800 rounded-full w-24"></div>
            </div>
            <div className="flex gap-3 mb-5">
              <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-16"></div>
              <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-20"></div>
              <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-16"></div>
            </div>
            <div className="mt-5 pt-4 border-t border-edge space-y-2.5">
              <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-full"></div>
              <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-11/12"></div>
              <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-2/3"></div>
            </div>
          </div>
          <div className="bg-card border border-edge rounded-xl min-h-[250px] p-5">
            <div className="h-4 min-h-[16px] bg-edge2/60 dark:bg-zinc-800 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              <div className="flex gap-3"><div className="h-6 w-6 rounded bg-edge2/60 dark:bg-zinc-800"></div><div className="h-12 flex-1 bg-edge2/40 dark:bg-zinc-800/60 rounded"></div></div>
              <div className="flex gap-3"><div className="h-6 w-6 rounded bg-edge2/60 dark:bg-zinc-800"></div><div className="h-8 flex-1 bg-edge2/40 dark:bg-zinc-800/60 rounded"></div></div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-edge rounded-xl p-5 min-h-[160px]">
             <div className="h-4 bg-edge2/60 dark:bg-zinc-800 rounded w-32 mb-4"></div>
             <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-edge2/40 dark:bg-zinc-800/60 rounded"></div>
                <div className="h-8 bg-edge2/40 dark:bg-zinc-800/60 rounded"></div>
             </div>
          </div>
          <div className="bg-card border border-edge rounded-xl p-5 min-h-[180px]">
             <div className="h-4 bg-edge2/60 dark:bg-zinc-800 rounded w-32 mb-4"></div>
             <div className="space-y-3">
                <div className="h-8 bg-edge2/40 dark:bg-zinc-800/60 rounded w-full"></div>
                <div className="h-8 bg-edge2/40 dark:bg-zinc-800/60 rounded w-full"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL ───────────────────────────────────────────────────────────────── */

export function Modal({ title, onClose, children, wide = false, className }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 transition-opacity"
        style={{ background: "rgba(10,10,20,0.72)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={cn(
            "pointer-events-auto w-full my-auto shadow-2xl transition-all",
            wide ? "max-w-2xl" : "max-w-lg",
            className
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-card border border-edge rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.36)] overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            <header className="flex items-center justify-between px-6 py-4 border-b border-edge bg-well shrink-0">
              <h3 id="modal-title" className="text-ink text-lg font-bold">{title}</h3>
              <button
                onClick={onClose}
                className="text-ink3 hover:text-ink w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hov transition-colors"
                aria-label="Cerrar modal"
              >✕</button>
            </header>
            <div className="px-6 py-6 overflow-y-auto flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
