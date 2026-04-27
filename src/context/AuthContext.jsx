import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { catalogIndex } from "../services/mock";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sanitiza el DTO del usuario logueado.
  // Fuente de verdad: bibliotecaId y roleId. El nombre y código se
  // resuelven leyendo los catálogos para mostrar en la UI.
  const sanitizeUserDTO = (raw) => {
    const bibliotecaId = raw?.bibliotecaId ?? 1;
    const roleId       = raw?.roleId ?? catalogIndex.rolesByCodigo[raw?.role || "USUARIO"]?.id ?? 3;
    const biblioteca   = catalogIndex.bibliotecas[bibliotecaId];
    const role         = catalogIndex.roles[roleId];
    return {
      id: raw?.id || 0,
      nombre: raw?.nombre || "Anónimo",
      username: raw?.username || "anon",
      // IDs (FKs) — se envían al backend
      bibliotecaId,
      roleId,
      // Strings derivados — solo para la UI / RoleGuard
      biblioteca: biblioteca?.nombre ?? "—",
      role: role?.codigo ?? "USUARIO",
      // RBAC: Array de permisos inyectados desde el rol
      permissions: role?.permisos || [],
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        setUser(sanitizeUserDTO(JSON.parse(savedUser)));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const safeUser = sanitizeUserDTO(res.user);
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(safeUser));
    setUser(safeUser);
    return safeUser;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
