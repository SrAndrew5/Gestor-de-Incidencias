import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import RoleGuard, { Unauthorized } from "./components/RoleGuard";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Incidencias from "./pages/Incidencias";
import DetalleTicket from "./pages/DetalleTicket";
import Plantillas from "./pages/Plantillas";
import GestionUsuarios from "./pages/GestionUsuarios";
import Configuracion from "./pages/Configuracion";
import Perfil from "./pages/Perfil";
import HasPermission from "./components/HasPermission";

function Router() {
  const { user } = useAuth();
  const isUsuario = user.role === "USUARIO";
  const [page, setPage] = useState(isUsuario ? "incidencias" : "dashboard");
  const [ticketId, setTicketId] = useState(null);
  const [plantillaActiva, setPlantillaActiva] = useState(null);
  const [filtrosIniciales, setFiltrosIniciales] = useState(null);

  const navigate = (p, id = null, plantilla = null, filtros = null) => {
    setPage(p);
    setTicketId(id);
    setPlantillaActiva(plantilla);
    setFiltrosIniciales(filtros);
    window.scrollTo(0, 0);
  };

  if (!user) return <Login />;

  const renderPage = () => {
    switch (page) {
      case "dashboard":      return <HasPermission permission="reports:view" isRoute navigate={navigate}><Dashboard navigate={navigate} /></HasPermission>;
      case "inventario":     return <HasPermission permission="inventory:view" isRoute navigate={navigate}><Inventario navigate={navigate} /></HasPermission>;
      case "incidencias":    return <Incidencias navigate={navigate} plantillaActiva={plantillaActiva} onPlantillaUsada={() => { setPlantillaActiva(null); setFiltrosIniciales(null); }} filtrosIniciales={filtrosIniciales} />;
      case "detalle":        return <DetalleTicket id={ticketId} navigate={navigate} />;
      case "plantillas":     return <HasPermission permission="templates:manage" isRoute navigate={navigate}><Plantillas navigate={navigate} /></HasPermission>;
      case "configuracion":  return <HasPermission permission="config:manage" isRoute navigate={navigate}><Configuracion /></HasPermission>;
      case "usuarios":       return <HasPermission permission="users:manage" isRoute navigate={navigate}><GestionUsuarios navigate={navigate} /></HasPermission>;
      case "perfil":         return <Perfil />;
      case "unauthorized":   return <Unauthorized navigate={navigate} />;
      default:               return <Incidencias navigate={navigate} />;
    }
  };

  return (
    <Layout page={page} navigate={navigate}>
      {renderPage()}
    </Layout>
  );
}

function Gate() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    <ThemeProvider key={user.id} userId={user.id}>
      <Router />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <Gate />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
