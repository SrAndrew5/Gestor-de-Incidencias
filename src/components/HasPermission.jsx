import { useAuth } from "../context/AuthContext";
import { Unauthorized } from "./RoleGuard";

/**
 * HasPermission: Componente HOC para control de acceso basado en Capabilities/Permisos (RBAC avanzado).
 * Reemplaza al clásico chequeo plano por roles ("ADMIN", "TECNICO").
 * 
 * @param {string} permission - El permiso requerido, ej: "tickets:delete" o "inventory:edit"
 * @param {boolean} isRoute - Si es true, renderiza la pantalla de "Acceso Denegado". Si es false, simplemente oculta el componente.
 * @param {function} navigate - Función opcional de navegación para rutas.
 */
export default function HasPermission({ permission, isRoute = false, navigate = null, children }) {
  const { user } = useAuth();
  
  // Si el usuario no existe o no tiene el permiso exacto en su array de capabilities
  if (!user || !user.permissions?.includes(permission)) {
    if (isRoute) {
      return <Unauthorized navigate={navigate} />;
    }
    // Para botones y secciones, simplemente no lo renderiza en el DOM
    return null; 
  }
  
  return children;
}
