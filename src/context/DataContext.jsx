import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { mockData, bibliotecas as bibliotecasCatalog, categorias as categoriasCatalog, roles as rolesCatalog } from "../services/mock";
import { calcularPrioridad, asignarAutomaticamente } from "../utils/businessRules";

const DataContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────
// HYDRATATION — reglas para enriquecer entidades crudas con nombres.
// La fuente de verdad es siempre el ID (FK). Los campos string son
// derivados, NUNCA se persisten ni se envían al backend.
// ─────────────────────────────────────────────────────────────────────

const indexBy = (arr, key = "id") =>
  arr.reduce((acc, x) => { acc[x[key]] = x; return acc; }, {});

export function DataProvider({ children }) {
  // ── Catálogos (en producción vendrán de /catalogos/* del backend) ────
  const [bibliotecas] = useState(bibliotecasCatalog);
  const [categorias]  = useState(categoriasCatalog);
  const [roles]       = useState(rolesCatalog);

  // ── Datos transaccionales ────────────────────────────────────────────
  const [incidencias, setIncidencias] = useState(mockData.incidencias);
  const [inventario,  setInventario]  = useState(mockData.inventario);
  const [plantillas,  setPlantillas]  = useState(mockData.plantillas);
  const [usuarios,    setUsuarios]    = useState(mockData.usuarios);
  const [historialMap, setHistorialMap] = useState({ 2: mockData.historial });

  // ── Lookup maps memoizados — O(1) para hidratación ───────────────────
  const bibliotecasById = useMemo(() => indexBy(bibliotecas), [bibliotecas]);
  const categoriasById  = useMemo(() => indexBy(categorias),  [categorias]);
  const rolesById       = useMemo(() => indexBy(roles),       [roles]);
  const usuariosById    = useMemo(() => indexBy(usuarios),    [usuarios]);
  const equiposById     = useMemo(() => indexBy(inventario),  [inventario]);

  // Versiones por código para selects/filtros legacy
  const categoriasByCodigo = useMemo(() => indexBy(categorias, "codigo"), [categorias]);
  const rolesByCodigo      = useMemo(() => indexBy(roles, "codigo"),      [roles]);

  // ── HYDRATORS — convierten una entidad cruda (FK) en una "view" ──────
  const hydrateUsuario = useCallback((u) => u && ({
    ...u,
    // Campos derivados (display): mismos nombres que usaba la versión legacy.
    biblioteca: bibliotecasById[u.bibliotecaId]?.nombre ?? "—",
    role:       rolesById[u.roleId]?.codigo ?? "USUARIO",
    // Objetos completos por si la UI necesita más campos:
    _biblioteca: bibliotecasById[u.bibliotecaId] ?? null,
    _role:       rolesById[u.roleId] ?? null,
  }), [bibliotecasById, rolesById]);

  const hydrateEquipo = useCallback((e) => e && ({
    ...e,
    biblioteca: bibliotecasById[e.bibliotecaId]?.nombre ?? "—",
    _biblioteca: bibliotecasById[e.bibliotecaId] ?? null,
  }), [bibliotecasById]);

  const hydrateIncidencia = useCallback((i) => i && ({
    ...i,
    biblioteca: bibliotecasById[i.bibliotecaId]?.nombre ?? "—",
    categoria:  categoriasById[i.categoriaId]?.codigo  ?? "SIN_CATEGORIA",
    asignado:   usuariosById[i.asignadoId]?.nombre     ?? null,
    creadoPor:  usuariosById[i.creadoPorId]?.nombre    ?? "Desconocido",
    _biblioteca: bibliotecasById[i.bibliotecaId] ?? null,
    _categoria:  categoriasById[i.categoriaId] ?? null,
    _asignado:   usuariosById[i.asignadoId] ?? null,
    _creadoPor:  usuariosById[i.creadoPorId] ?? null,
    _equipo:     equiposById[i.equipoId] ?? null,
  }), [bibliotecasById, categoriasById, usuariosById, equiposById]);

  const hydratePlantilla = useCallback((p) => p && ({
    ...p,
    categoria: categoriasById[p.categoriaId]?.codigo ?? "SIN_CATEGORIA",
    _categoria: categoriasById[p.categoriaId] ?? null,
  }), [categoriasById]);

  const hydrateHistorialEntry = useCallback((h) => h && ({
    ...h,
    autor: usuariosById[h.autorId]?.nombre ?? "Sistema",
    _autor: usuariosById[h.autorId] ?? null,
  }), [usuariosById]);

  // ── Vistas hidratadas (memoizadas) ───────────────────────────────────
  const incidenciasView = useMemo(
    () => incidencias.map(hydrateIncidencia),
    [incidencias, hydrateIncidencia]
  );
  const usuariosView = useMemo(
    () => usuarios.map(hydrateUsuario),
    [usuarios, hydrateUsuario]
  );
  const inventarioView = useMemo(
    () => inventario.map(hydrateEquipo),
    [inventario, hydrateEquipo]
  );
  const plantillasView = useMemo(
    () => plantillas.map(hydratePlantilla),
    [plantillas, hydratePlantilla]
  );

  // ── ACCIONES PARA INCIDENCIAS ──────────────────────────────
  const crearIncidencia = useCallback(async (nueva) => {
    // Regla de Negocio: Calcular Prioridad
    let prioridadCalc = nueva.prioridad || null;
    if (nueva.urgencia && nueva.impacto) {
      prioridadCalc = calcularPrioridad(nueva.urgencia, nueva.impacto);
    }

    // Regla de Negocio: Auto-asignación
    const asignadoIdCalc = nueva.asignadoId || asignarAutomaticamente(nueva, usuarios, incidencias);

    const item = {
      ...nueva,
      id: crypto.randomUUID(),
      fecha: new Date().toISOString().slice(0, 10),
      estado: "ABIERTA",
      prioridad: prioridadCalc,
      asignadoId: asignadoIdCalc,
    };
    
    // Limpiamos campos temporales
    delete item.urgencia;
    delete item.impacto;

    setIncidencias(prev => [item, ...prev]);
    return item;
  }, [usuarios, incidencias]);

  const actualizarIncidencia = useCallback(async (id, data) => {
    setIncidencias(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  }, []);

  const borrarIncidencia = useCallback(async (id) => {
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
      const nuevo = { ...equipo, id: crypto.randomUUID(), ultima_revision: new Date().toISOString().slice(0, 10) };
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
      const nuevo = { ...user, id: crypto.randomUUID() };
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

  // ── ACCIONES PARA PLANTILLAS ──────────────────────────────
  const guardarPlantilla = useCallback(async (p) => {
    if (p.id) {
      setPlantillas(prev => prev.map(x => x.id === p.id ? p : x));
    } else {
      const nueva = { ...p, id: crypto.randomUUID(), uso: 0 };
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

  // ── HELPERS DE LOOKUP EXPUESTOS ─────────────────────────────────────
  const getBibliotecaNombre = useCallback((id) => bibliotecasById[id]?.nombre ?? "—", [bibliotecasById]);
  const getCategoriaCodigo  = useCallback((id) => categoriasById[id]?.codigo  ?? null, [categoriasById]);
  const getCategoriaIdByCodigo = useCallback((codigo) => categoriasByCodigo[codigo]?.id ?? null, [categoriasByCodigo]);
  const getRoleCodigo       = useCallback((id) => rolesById[id]?.codigo ?? "USUARIO", [rolesById]);
  const getRoleIdByCodigo   = useCallback((codigo) => rolesByCodigo[codigo]?.id ?? null, [rolesByCodigo]);
  const getUsuarioNombre    = useCallback((id) => usuariosById[id]?.nombre ?? "—", [usuariosById]);
  const getEquipo           = useCallback((id) => equiposById[id] ?? null, [equiposById]);

  const contextValue = useMemo(() => ({
    // Catálogos
    bibliotecas, categorias, roles,
    // Maps lookup (acceso O(1) a entidad por id)
    bibliotecasById, categoriasById, rolesById, usuariosById, equiposById,
    categoriasByCodigo, rolesByCodigo,
    // Datos crudos (con FKs — para mutaciones, envío al backend)
    incidencias, inventario, plantillas, usuarios, historialMap,
    // Vistas hidratadas (con strings derivados — para display)
    incidenciasView, inventarioView, plantillasView, usuariosView,
    // Hydrators puntuales (un solo elemento)
    hydrateIncidencia, hydrateEquipo, hydrateUsuario, hydratePlantilla, hydrateHistorialEntry,
    // Helpers de lookup (para escribir lógica sin importar maps)
    getBibliotecaNombre, getCategoriaCodigo, getCategoriaIdByCodigo,
    getRoleCodigo, getRoleIdByCodigo, getUsuarioNombre, getEquipo,
    // Acciones
    crearIncidencia, actualizarIncidencia, borrarIncidencia, importarIncidencias,
    guardarEquipo, borrarEquipo, importarEquipos,
    guardarUsuario, toggleUsuarioActivo, borrarUsuario, importarUsuarios,
    guardarPlantilla, borrarPlantilla, registrarUsoPlantilla,
    addHistorialEntry,
  }), [
    bibliotecas, categorias, roles,
    bibliotecasById, categoriasById, rolesById, usuariosById, equiposById,
    categoriasByCodigo, rolesByCodigo,
    incidencias, inventario, plantillas, usuarios, historialMap,
    incidenciasView, inventarioView, plantillasView, usuariosView,
    hydrateIncidencia, hydrateEquipo, hydrateUsuario, hydratePlantilla, hydrateHistorialEntry,
    getBibliotecaNombre, getCategoriaCodigo, getCategoriaIdByCodigo,
    getRoleCodigo, getRoleIdByCodigo, getUsuarioNombre, getEquipo,
    crearIncidencia, actualizarIncidencia, borrarIncidencia, importarIncidencias,
    guardarEquipo, borrarEquipo, importarEquipos,
    guardarUsuario, toggleUsuarioActivo, borrarUsuario, importarUsuarios,
    guardarPlantilla, borrarPlantilla, registrarUsoPlantilla,
    addHistorialEntry,
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
