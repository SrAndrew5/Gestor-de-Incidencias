import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Incidencias from "./pages/Incidencias";
import DetalleTicket from "./pages/DetalleTicket";
import Plantillas from "./pages/Plantillas";
import GestionUsuarios from "./pages/GestionUsuarios";

function Router() {
  const { user } = useAuth();
  const isUsuario = user.role === "USUARIO";
  const [page, setPage] = useState(isUsuario ? "incidencias" : "dashboard");
  const [ticketId, setTicketId] = useState(null);
  // plantillaActiva: al navegar desde Plantillas → Incidencias, llevar los datos de la plantilla
  const [plantillaActiva, setPlantillaActiva] = useState(null);

  // navigate(page, id?, plantilla?)
  const navigate = (p, id = null, plantilla = null) => {
    if (isUsuario && ["dashboard", "inventario", "usuarios", "plantillas"].includes(p)) return;
    setPage(p);
    setTicketId(id);
    setPlantillaActiva(plantilla);
    window.scrollTo(0, 0);
  };

  if (!user) return <Login />;

  const renderPage = () => {
    if (isUsuario) {
      if (page === "detalle") return <DetalleTicket id={ticketId} navigate={navigate} />;
      return <Incidencias navigate={navigate} plantillaActiva={plantillaActiva} onPlantillaUsada={() => setPlantillaActiva(null)} />;
    }
    switch (page) {
      case "dashboard":   return <Dashboard navigate={navigate} />;
      case "inventario":  return <Inventario navigate={navigate} />;
      case "incidencias": return <Incidencias navigate={navigate} plantillaActiva={plantillaActiva} onPlantillaUsada={() => setPlantillaActiva(null)} />;
      case "detalle":     return <DetalleTicket id={ticketId} navigate={navigate} />;
      case "plantillas":  return <Plantillas navigate={navigate} />;
      case "usuarios":    return user.role === "ADMIN" ? <GestionUsuarios navigate={navigate} /> : <Dashboard navigate={navigate} />;
      default:            return <Dashboard navigate={navigate} />;
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
  return <Router />;
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
