import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Modal, Btn } from "../components/UI";

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isUsuario = user.role === "USUARIO";
  const isAdmin   = user.role === "ADMIN";

  const mainNav  = isUsuario ? NAV_USUARIO : NAV_ADMIN_TECNICO;
  const adminNav = isAdmin   ? NAV_ADMIN_ONLY : [];

  const roleColor = {
    ADMIN:   "text-red-800 bg-red-200 dark:text-red-400 dark:bg-red-400/10",
    TECNICO: "text-amber-800 bg-amber-200 dark:text-amber-400 dark:bg-amber-400/10",
    USUARIO: "text-sky-800 bg-sky-200 dark:text-sky-400 dark:bg-sky-400/10",
  }[user.role] || "text-ink2 bg-well";

  const activeColor = (id) => {
    if (id === "usuarios") return "bg-red-200 text-red-800 border-l-2 border-red-500 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400";
    return "bg-amber-200 text-amber-800 border-l-2 border-amber-500 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400";
  };

  const navItemClass = (id) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all relative group/nav ${
      page === id
        ? activeColor(id)
        : "text-ink2 hover:text-ink hover:bg-well border-l-2 border-transparent"
    }`;

  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-card border-r border-edge transition-all duration-300 flex-shrink-0 sticky top-0 h-screen ${collapsed ? "w-16" : "w-56"}`}>
        {/* Logo */}
        <div className="p-4 border-b border-edge flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-400 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-zinc-950 font-bold text-sm">B</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-ink text-xs font-bold leading-tight">BIBLIOTECAS</div>
              <div className="text-ink3 text-xs">GESTIÓN TI</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-ink3 hover:text-ink text-xs flex-shrink-0"
            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 pt-4 space-y-1 overflow-y-auto">
          {mainNav.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={navItemClass(item.id)}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  {item.label}
                </span>
              )}
            </button>
          ))}

          {adminNav.length > 0 && (
            <>
              {!collapsed && <div className="px-3 pt-4 pb-1 text-ink3 text-xs tracking-widest">ADMIN</div>}
              {collapsed && <div className="border-t border-edge my-2" />}
              {adminNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={navItemClass(item.id)}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                  {collapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Configuración — todos los roles */}
          <div className="border-t border-edge my-2" />
          <button
            onClick={() => navigate("configuracion")}
            title={collapsed ? "Configuración" : undefined}
            className={navItemClass("configuracion")}
          >
            <span className="text-base flex-shrink-0">⚙</span>
            {!collapsed && <span>Configuración</span>}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                Configuración
              </span>
            )}
          </button>
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-edge">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-well flex items-center justify-center text-ink2 text-xs font-bold flex-shrink-0">
                {(user.nombre || user.username || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-ink text-xs font-medium truncate">{user.nombre || user.username}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${roleColor}`}>{user.role}</span>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="text-ink3 hover:text-red-500 text-xs p-1 rounded hover:bg-well transition-colors"
                title="Cerrar sesión"
              >
                ⏻
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex justify-center text-ink3 hover:text-red-500 text-xs py-1 transition-colors relative group/logout"
              title="Cerrar sesión"
            >
              ⏻
              <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 whitespace-nowrap opacity-0 group-hover/logout:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                Cerrar sesión
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>

      {showLogoutConfirm && (
        <Modal title="Cerrar sesión" onClose={() => setShowLogoutConfirm(false)}>
          <div className="space-y-4">
            <div className="flex gap-4 items-center bg-well border border-edge2 p-4 rounded-lg">
              <span className="text-2xl">⏻</span>
              <p className="text-ink text-sm leading-relaxed">
                ¿Cerrar la sesión de <strong>{user.nombre || user.username}</strong>?<br />
                <span className="text-ink3 text-xs mt-1 inline-block">Perderás los cambios no guardados.</span>
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Btn variant="secondary" onClick={() => setShowLogoutConfirm(false)}>Cancelar</Btn>
              <Btn variant="danger" onClick={logout}>Cerrar sesión</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
