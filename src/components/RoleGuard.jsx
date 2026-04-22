import { useAuth } from "../context/AuthContext";

export function Unauthorized({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center fade-in">
      <div className="text-red-500 text-6xl mb-4">⛔</div>
      <h2 className="text-ink text-2xl font-bold mb-2">Acceso Denegado</h2>
      <p className="text-ink3 text-sm mb-6 max-w-sm">
        Tu rol actual no tiene privilegios para acceder a este módulo. Si crees que se trata de un error, por favor contacta con gerencia.
      </p>
      {navigate && (
        <button 
          onClick={() => navigate("incidencias")}
          className="bg-well border border-edge hover:bg-hov text-ink2 px-4 py-2 rounded-lg text-sm transition-colors font-medium cursor-pointer"
        >
          ← Volver a lugar seguro
        </button>
      )}
    </div>
  );
}

/**
 * RoleGuard: Componente de Orden Superior (HOC) para control de acceso RBAC.
 * @param {string[]} allowed - Array de roles permitidos ej: ['ADMIN', 'TECNICO']
 * @param {boolean} isRoute - Determina si está protegiendo una ruta entera (página) o un elemento JSX.
 * @param {function} navigate - Función opcional de navegación para el botoncito de volver en rutas.
 */
export default function RoleGuard({ allowed, isRoute = false, navigate = null, children }) {
  const { user } = useAuth();
  
  if (!user || !allowed.includes(user.role)) {
    if (isRoute) {
      return <Unauthorized navigate={navigate} />;
    }
    return null; // Oculta componentes de UI específicos si no es ruta (botones, divs)
  }
  
  return children;
}
