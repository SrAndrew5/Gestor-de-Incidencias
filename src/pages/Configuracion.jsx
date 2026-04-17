import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/UI";

export default function Configuracion() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="p-8">
      <PageHeader title="Configuración" subtitle="Preferencias de la aplicación" />

      <div className="max-w-2xl space-y-6">
        {/* Apariencia */}
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-ink font-semibold text-sm mb-1">Apariencia</h2>
          <p className="text-ink3 text-xs mb-5">
            Elige el tema visual. La preferencia se guarda por usuario — al iniciar sesión volverá tu elección.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Tema claro */}
            <button
              onClick={() => setTheme("light")}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === "light"
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-400/10"
                  : "border-edge hover:border-edge2"
              }`}
            >
              <div className="w-full h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex flex-col gap-1 p-2">
                <div className="h-3 bg-white rounded border border-slate-200 w-full" />
                <div className="flex gap-1 flex-1">
                  <div className="w-8 bg-white rounded border border-slate-200" />
                  <div className="flex-1 bg-white rounded border border-slate-200" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-ink">☀ Claro</div>
                <div className="text-xs text-ink3">Recomendado para oficina</div>
              </div>
              {theme === "light" && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-zinc-950 text-xs font-bold">✓</div>
              )}
            </button>

            {/* Tema oscuro */}
            <button
              onClick={() => setTheme("dark")}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === "dark"
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-400/10"
                  : "border-edge hover:border-edge2"
              }`}
            >
              <div className="w-full h-20 rounded-lg bg-zinc-900 border border-zinc-700 overflow-hidden flex flex-col gap-1 p-2">
                <div className="h-3 bg-zinc-800 rounded border border-zinc-700 w-full" />
                <div className="flex gap-1 flex-1">
                  <div className="w-8 bg-zinc-800 rounded border border-zinc-700" />
                  <div className="flex-1 bg-zinc-800 rounded border border-zinc-700" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-ink">☾ Oscuro</div>
                <div className="text-xs text-ink3">Reduce el brillo de pantalla</div>
              </div>
              {theme === "dark" && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-zinc-950 text-xs font-bold">✓</div>
              )}
            </button>
          </div>
        </div>

        {/* Info de cuenta */}
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-ink font-semibold text-sm mb-4">Tu cuenta</h2>
          <dl className="space-y-3">
            {[
              ["Nombre",     user.nombre || user.username],
              ["Usuario",    user.username],
              ["Rol",        user.role],
              ["Biblioteca", user.biblioteca || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <dt className="text-ink3">{k}</dt>
                <dd className="text-ink font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
