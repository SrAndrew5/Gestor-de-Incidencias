import { createContext, useContext, useState, useCallback } from "react";
import { mockData, api } from "../services/api";

const DataContext = createContext(null);

/**
 * DataProvider centraliza el estado de la aplicación y expone ACCIONES 
 * en lugar de setters crudos. Esto facilita la integración posterior 
 * con Spring Boot sin tener que modificar cada página individualmente.
 */
export function DataProvider({ children }) {
  // ── Datos globales (Iniciados con mockData) ──────────────────────────
  const [incidencias, setIncidencias] = useState(mockData.incidencias);
  const [inventario,  setInventario]  = useState(mockData.inventario);
  const [plantillas,  setPlantillas]  = useState(mockData.plantillas);
  const [usuarios,    setUsuarios]    = useState(mockData.usuarios);
  const [historialMap, setHistorialMap] = useState({ 2: mockData.historial });

  // ── ACCIONES PARA INCIDENCIAS ──────────────────────────────
  const crearIncidencia = useCallback(async (nueva) => {
    // Aquí iría el api.post('/incidencias')
    // Por ahora simulamos localmente:
    const item = { ...nueva, id: Date.now(), fecha: new Date().toISOString().slice(0, 10), estado: "ABIERTA" };
    setIncidencias(prev => [item, ...prev]);
    return item;
  }, []);

  const actualizarIncidencia = useCallback(async (id, data) => {
    // Aquí iría el api.patch(`/incidencias/${id}`)
    setIncidencias(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  }, []);

  const borrarIncidencia = useCallback(async (id) => {
    // Aquí iría el api.delete(`/incidencias/${id}`)
    setIncidencias(prev => prev.filter(i => i.id !== id));
  }, []);

  const importarIncidencias = useCallback(async (nuevos) => {
    setIncidencias(prev => [...nuevos, ...prev]);
  }, []);

  // ── ACCIONES PARA INVENTARIO ──────────────────────────────
  const guardarEquipo = useCallback(async (equipo) => {
    if (equipo.id) {
      setInventario(prev => prev.map(i => i.id === equipo.id ? equipo : i));
    } else {
      const nuevo = { ...equipo, id: Date.now(), ultima_revision: new Date().toISOString().slice(0, 10) };
      setInventario(prev => [nuevo, ...prev]);
    }
  }, []);

  const borrarEquipo = useCallback(async (id) => {
    setInventario(prev => prev.filter(i => i.id !== id));
  }, []);

  const importarEquipos = useCallback(async (nuevos) => {
    setInventario(prev => [...nuevos, ...prev]);
  }, []);

  // ── ACCIONES PARA USUARIOS ──────────────────────────────
  const guardarUsuario = useCallback(async (user) => {
    if (user.id) {
      setUsuarios(prev => prev.map(u => u.id === user.id ? user : u));
    } else {
      const nuevo = { ...user, id: Date.now() };
      setUsuarios(prev => [nuevo, ...prev]);
    }
  }, []);

  const toggleUsuarioActivo = useCallback(async (id) => {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u));
  }, []);

  const borrarUsuario = useCallback(async (id) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
  }, []);

  const importarUsuarios = useCallback(async (nuevos) => {
    setUsuarios(prev => [...nuevos, ...prev]);
  }, []);

  const tecnicos = mockData.usuarios.filter(u => u.role === "TECNICO");

  // ── ACCIONES PARA PLANTILLAS ──────────────────────────────
  const guardarPlantilla = useCallback(async (p) => {
    if (p.id) {
      setPlantillas(prev => prev.map(x => x.id === p.id ? p : x));
    } else {
      const nueva = { ...p, id: Date.now(), uso: 0 };
      setPlantillas(prev => [...prev, nueva]);
    }
  }, []);

  const borrarPlantilla = useCallback(async (id) => {
    setPlantillas(prev => prev.filter(p => p.id !== id));
  }, []);

  const registrarUsoPlantilla = useCallback((id) => {
    setPlantillas(prev => prev.map(p => p.id === id ? { ...p, uso: p.uso + 1 } : p));
  }, []);

  // ── HISTORIAL ──────────────────────────────
  const addHistorialEntry = useCallback((ticketId, entry) => {
    setHistorialMap(prev => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), entry],
    }));
  }, [setHistorialMap]);

  return (
    <DataContext.Provider value={{
      // Data
      incidencias, inventario, plantillas, usuarios, historialMap,
      // Actions
      crearIncidencia, actualizarIncidencia, borrarIncidencia, importarIncidencias,
      guardarEquipo, borrarEquipo, importarEquipos,
      guardarUsuario, toggleUsuarioActivo, borrarUsuario, importarUsuarios,
      guardarPlantilla, borrarPlantilla, registrarUsoPlantilla,
      addHistorialEntry,
      // Temporales (para no romper el build mientras migramos páginas)
      setIncidencias, setInventario, setPlantillas, setUsuarios
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
