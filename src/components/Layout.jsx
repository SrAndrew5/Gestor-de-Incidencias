import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// Nav items per role
const NAV_ADMIN_TECNICO = [
  { id: "dashboard",  label: "Dashboard",  icon: "⬡" },
  { id: "inventario", label: "Inventario", icon: "◫" },
  { id: "incidencias",label: "Incidencias",icon: "⚠" },
  { id: "plantillas", label: "Plantillas", icon: "▤" },
];
const NAV_ADMIN_ONLY = [
  { id: "usuarios", label: "Usuarios", icon: "◉" },
];
const NAV_USUARIO = [
  { id: "incidencias", label: "Mis Incidencias", icon: "⚠" },
];

export default function Layout({ children, page, navigate }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isUsuario = user.role === "USUARIO";
  const isAdmin   = user.role === "ADMIN";

  const mainNav  = isUsuario ? NAV_USUARIO : NAV_ADMIN_TECNICO;
  const adminNav = isAdmin   ? NAV_ADMIN_ONLY : [];

  const roleColor = {
    ADMIN:   "text-red-400 bg-red-400/10",
    TECNICO: "text-amber-400 bg-amber-400/10",
    USUARIO: "text-sky-400 bg-sky-400/10",
  }[user.role] || "text-zinc-400 bg-zinc-400/10";

  const activeColor = (id) => {
    if (id === "usuarios") return "bg-red-400/10 text-red-400 border-l-2 border-red-400";
    return "bg-amber-400/10 text-amber-400 border-l-2 border-amber-400";
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Sidebar — sticky + h-screen so the user footer never scrolls away */}
      <aside className={`flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex-shrink-0 sticky top-0 h-screen ${collapsed ? "w-16" : "w-56"}`}>
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-400 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-zinc-950 font-bold text-sm">B</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white text-xs font-bold leading-tight">BIBLIOTECAS</div>
              <div className="text-zinc-500 text-xs">GESTIÓN TI</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-zinc-600 hover:text-zinc-300 text-xs flex-shrink-0">
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Nav — overflow-y-auto so many items don't push the footer off screen */}
        <nav className="flex-1 p-2 pt-4 space-y-1 overflow-y-auto">
          {mainNav.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all
                ${page === item.id ? activeColor(item.id) : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-l-2 border-transparent"}`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}

          {adminNav.length > 0 && (
            <>
              {!collapsed && <div className="px-3 pt-4 pb-1 text-zinc-600 text-xs tracking-widest">ADMIN</div>}
              {collapsed && <div className="border-t border-zinc-800 my-2" />}
              {adminNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all
                    ${page === item.id ? activeColor(item.id) : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-l-2 border-transparent"}`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              ))}
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-zinc-800">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold flex-shrink-0">
                {(user.nombre || user.username || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-300 text-xs font-medium truncate">{user.nombre || user.username}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${roleColor}`}>{user.role}</span>
                </div>
              </div>
              <button onClick={logout} className="text-zinc-600 hover:text-red-400 text-xs" title="Cerrar sesión">✕</button>
            </div>
          ) : (
            <button onClick={logout} className="w-full flex justify-center text-zinc-600 hover:text-red-400 text-xs py-1">✕</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
