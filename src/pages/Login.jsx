import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// Prueba Login sin backend
const DEMO_USERS = {
  admin: { id: 1, nombre: "María García", username: "admin", role: "ADMIN", token: "demo-admin-token" },
  tecnico: { id: 2, nombre: "Juan Técnico", username: "tecnico", role: "TECNICO", token: "demo-tech-token" },
  usuario: { id: 3, nombre: "Lucía Fernández", username: "usuario", role: "USUARIO", token: "demo-user-token" },
};

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch {
      // Fallback demo login
      const demo = DEMO_USERS[form.username];
      if (demo && form.password === "demo") {
        localStorage.setItem("token", demo.token);
        localStorage.setItem("user", JSON.stringify({ id: demo.id, nombre: demo.nombre, username: demo.username, role: demo.role }));
        window.location.reload();
      } else {
        setError("Credenciales incorrectas. Demo: admin/demo, tecnico/demo, usuario/demo");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-zinc-900 border-r border-zinc-800 p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-zinc-950 font-bold">B</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide">BIBLIOTECAS TI</div>
              <div className="text-zinc-500 text-xs">Sistema de Incidencias</div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="text-amber-400 text-xs tracking-widest mb-3">SISTEMA DE GESTIÓN</div>
              <h2 className="text-white text-3xl font-bold leading-tight">
                Control total<br />de tu infraestructura
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["⬡", "Dashboard", "Métricas en tiempo real"],
                ["◫", "Inventario", "Gestión de equipos"],
                ["⚠", "Incidencias", "Seguimiento de tickets"],
                ["◉", "Usuarios", "Control de accesos"],
              ].map(([icon, title, desc]) => (
                <div key={title} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/30">
                  <div className="text-amber-400 text-lg mb-2">{icon}</div>
                  <div className="text-zinc-200 text-xs font-bold">{title}</div>
                  <div className="text-zinc-500 text-xs">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-zinc-600 text-xs">v1.0.0 · RED DE BIBLIOTECAS PUBLICAS MUNICOPALES DE BADAJOZ</div>
      </div>

      {/* Panel Derecho - Formulario de login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-sm">B</span>
            </div>
            <div className="text-white font-bold text-sm">BIBLIOTECAS TI</div>
          </div>

          <div className="mb-8">
            <h1 className="text-white text-xl font-bold mb-1">Iniciar sesión</h1>
            <p className="text-zinc-500 text-sm">Accede con tus credenciales corporativas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs mb-2">USUARIO</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="usuario@biblioteca.es"
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs mb-2">CONTRASEÑA</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400/60 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Autenticando..." : "Entrar"}
            </button>
          </form>

          {/* Credenciales DEMO */}
          <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-zinc-500 text-xs mb-3 tracking-wide">ACCESOS DEMO (pass: demo)</div>
            <div className="space-y-2">
              {[
                ["admin", "ADMIN", "text-red-400"],
                ["tecnico", "TÉCNICO", "text-amber-400"],
                ["usuario", "USUARIO", "text-sky-400"],
              ].map(([u, r, c]) => (
                <button
                  key={u}
                  onClick={() => setForm({ username: u, password: "demo" })}
                  className="w-full flex items-center justify-between bg-zinc-800/50 hover:bg-zinc-800 rounded px-3 py-2 text-xs transition-colors"
                >
                  <span className="text-zinc-400">{u}</span>
                  <span className={`font-bold ${c}`}>{r}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
