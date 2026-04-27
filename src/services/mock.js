// ─────────────────────────────────────────────────────────────────────
// CATÁLOGOS NORMALIZADOS (futuras tablas BD con PK propia)
// ─────────────────────────────────────────────────────────────────────

export const bibliotecas = [
  { id: 1, nombre: "Biblioteca Central", direccion: "Plaza Mayor, 1" },
  { id: 2, nombre: "Biblioteca Norte",   direccion: "Av. del Norte, 12" },
  { id: 3, nombre: "Biblioteca Sur",     direccion: "C/ del Sur, 45" },
  { id: 4, nombre: "Biblioteca Este",    direccion: "C/ Este, 8" },
  { id: 5, nombre: "Biblioteca Oeste",   direccion: "C/ Oeste, 3" },
];

export const categorias = [
  { id: 1, codigo: "HARDWARE",  nombre: "Hardware" },
  { id: 2, codigo: "SOFTWARE",  nombre: "Software" },
  { id: 3, codigo: "RED",       nombre: "Red" },
  { id: 4, codigo: "AV",        nombre: "Audiovisual" },
  { id: 5, codigo: "SEGURIDAD", nombre: "Seguridad" },
];

export const roles = [
  { id: 1, codigo: "ADMIN",   nombre: "Administrador", permisos: ["tickets:view", "tickets:create", "tickets:edit", "tickets:delete", "inventory:view", "inventory:edit", "users:view", "users:manage", "templates:manage", "config:manage", "reports:view"] },
  { id: 2, codigo: "TECNICO", nombre: "Técnico", permisos: ["tickets:view", "tickets:create", "tickets:edit", "inventory:view"] },
  { id: 3, codigo: "USUARIO", nombre: "Usuario", permisos: ["tickets:view_own", "tickets:create"] },
];

// Compatibilidad transitoria: array de NOMBRES (string) derivado del catálogo.
// Permite que pantallas aún no migradas sigan compilando.
// Eliminar cuando todas lean `bibliotecas` (objetos con id).
export const BIBLIOTECAS = bibliotecas.map(b => b.nombre);

// ─────────────────────────────────────────────────────────────────────
// DATOS TRANSACCIONALES (FKs por id, sin nombres hardcoded)
// ─────────────────────────────────────────────────────────────────────

export const mockData = {
  stats: { totalIncidencias: 142, abiertas: 38, enProgreso: 21, resueltas: 83, criticas: 5, avgResolucion: 2.4 },

  usuarios: [
    { id: 1, nombre: "María García",    email: "m.garcia@biblioteca.es",    roleId: 1, activo: true,  departamento: "Dirección",   bibliotecaId: 1 },
    { id: 2, nombre: "Juan Técnico",    email: "j.tecnico@biblioteca.es",   roleId: 2, activo: true,  departamento: "Informática", bibliotecaId: 1 },
    { id: 3, nombre: "Ana Soto",        email: "a.soto@biblioteca.es",      roleId: 2, activo: true,  departamento: "Informática", bibliotecaId: 2 },
    { id: 4, nombre: "Carlos R.",       email: "c.rodriguez@biblioteca.es", roleId: 2, activo: false, departamento: "Informática", bibliotecaId: 3 },
    { id: 5, nombre: "Lucía Fernández", email: "l.fernandez@biblioteca.es", roleId: 3, activo: true,  departamento: "Referencia",  bibliotecaId: 1 },
    { id: 6, nombre: "Pedro Molina",    email: "p.molina@biblioteca.es",    roleId: 3, activo: true,  departamento: "Infantil",    bibliotecaId: 2 },
  ],

  inventario: [
    { id: 1, codigoInventario: "BCEN-PC-001",  nombre: "Dell OptiPlex 7090",      tipo: "ORDENADOR",  bibliotecaId: 1, sala: "Sala 1",          puesto: "Puesto 01", estado: "OPERATIVO",     serie: "SN-4821-A", marca: "Dell",     modelo: "OptiPlex 7090",   so: "Windows 11 Pro", ram: "16 GB", cpu: "Intel i5-10500", almacenamiento: "SSD 512GB", ultima_revision: "2024-11-15", etiquetas: ["renovado-2023"] },
    { id: 2, codigoInventario: "BCEN-IMP-001", nombre: "HP LaserJet Pro M404",    tipo: "IMPRESORA",  bibliotecaId: 1, sala: "Planta 2",        puesto: "Pasillo B", estado: "AVERIADO",      serie: "SN-9932-B", marca: "HP",       modelo: "LaserJet Pro M404", so: "",               ram: "",      cpu: "",              almacenamiento: "",          ultima_revision: "2024-12-01", etiquetas: ["lento", "pendiente-revisión"] },
    { id: 3, codigoInventario: "BCEN-AV-001",  nombre: "Epson EB-X51 Proyector",  tipo: "AV",         bibliotecaId: 1, sala: "Sala Conferencias", puesto: "Techo",     estado: "AVERIADO",      serie: "SN-1123-C", marca: "Epson",    modelo: "EB-X51",          so: "",               ram: "",      cpu: "",              almacenamiento: "",          ultima_revision: "2024-10-20", etiquetas: ["evento-próximo"] },
    { id: 4, codigoInventario: "BNOR-RED-001", nombre: "Cisco Switch 24p",        tipo: "RED",        bibliotecaId: 2, sala: "Rack Principal",  puesto: "U4",        estado: "OPERATIVO",     serie: "SN-5577-D", marca: "Cisco",    modelo: "Catalyst 2960",   so: "IOS 15.2",       ram: "",      cpu: "",              almacenamiento: "",          ultima_revision: "2024-12-10", etiquetas: [] },
    { id: 5, codigoInventario: "BSUR-PC-001",  nombre: "Lenovo ThinkCentre M75q", tipo: "ORDENADOR",  bibliotecaId: 3, sala: "Sala Infantil",   puesto: "Puesto 03", estado: "OPERATIVO",     serie: "SN-2234-E", marca: "Lenovo",   modelo: "ThinkCentre M75q",so: "Windows 10 Pro", ram: "8 GB",  cpu: "AMD Ryzen 5",   almacenamiento: "SSD 256GB", ultima_revision: "2024-11-28", etiquetas: ["lento"] },
    { id: 6, codigoInventario: "BNOR-SRV-001", nombre: "NAS Synology DS223",      tipo: "SERVIDOR",   bibliotecaId: 2, sala: "Cuarto Técnico",  puesto: "Rack B1",   estado: "OPERATIVO",     serie: "SN-8801-F", marca: "Synology", modelo: "DS223",           so: "DSM 7.2",        ram: "2 GB",  cpu: "Realtek RTD1619B", almacenamiento: "2x4TB HDD", ultima_revision: "2025-01-02", etiquetas: [] },
    { id: 7, codigoInventario: "BEST-PER-001", nombre: "Scanner Fujitsu fi-7160", tipo: "PERIFÉRICO", bibliotecaId: 4, sala: "Mostrador",       puesto: "Principal", estado: "MANTENIMIENTO", serie: "SN-3390-G", marca: "Fujitsu",  modelo: "fi-7160",         so: "",               ram: "",      cpu: "",              almacenamiento: "",          ultima_revision: "2024-12-15", etiquetas: ["pendiente-revisión"] },
    { id: 8, codigoInventario: "BSUR-MON-001", nombre: "Monitor LG 27'' 4K",      tipo: "MONITOR",    bibliotecaId: 3, sala: "Sala 3",          puesto: "Puesto 08", estado: "OPERATIVO",     serie: "SN-6641-H", marca: "LG",       modelo: "27UK850-W",       so: "",               ram: "",      cpu: "",              almacenamiento: "",          ultima_revision: "2024-11-05", etiquetas: [] },
  ],

  incidencias: [
    { id: 1, titulo: "Ordenador sala 3 no arranca",        estado: "ABIERTA",     prioridad: "ALTA",    categoriaId: 1, asignadoId: 2,    creadoPorId: 5, bibliotecaId: 1, equipoId: 1,    fecha: "2025-01-08", etiquetas: ["urgente", "hardware-crítico"], descripcion: "" },
    { id: 2, titulo: "Sistema de préstamos caído",         estado: "EN_PROGRESO", prioridad: "CRITICA", categoriaId: 2, asignadoId: 3,    creadoPorId: 6, bibliotecaId: 2, equipoId: null, fecha: "2025-01-07", etiquetas: ["SIGB", "producción"],          descripcion: "El sistema de préstamos de la biblioteca ha dejado de responder." },
    { id: 3, titulo: "Impresora atascada planta 2",        estado: "ABIERTA",     prioridad: "MEDIA",   categoriaId: 1, asignadoId: null, creadoPorId: 5, bibliotecaId: 1, equipoId: 2,    fecha: "2025-01-09", etiquetas: ["lento"],                       descripcion: "" },
    { id: 4, titulo: "Fallo de conexión WiFi sala infantil", estado: "RESUELTA",  prioridad: "BAJA",    categoriaId: 3, asignadoId: 4,    creadoPorId: 5, bibliotecaId: 3, equipoId: null, fecha: "2025-01-05", etiquetas: [],                              descripcion: "" },
    { id: 5, titulo: "Actualización SIGB pendiente",       estado: "EN_PROGRESO", prioridad: "MEDIA",   categoriaId: 2, asignadoId: 3,    creadoPorId: 6, bibliotecaId: 4, equipoId: null, fecha: "2025-01-06", etiquetas: ["SIGB", "planificado"],         descripcion: "" },
    { id: 6, titulo: "Proyector sala conferencias dañado", estado: "ABIERTA",     prioridad: "ALTA",    categoriaId: 4, asignadoId: null, creadoPorId: 6, bibliotecaId: 1, equipoId: 3,    fecha: "2025-01-09", etiquetas: ["evento-próximo"],              descripcion: "" },
    { id: 7, titulo: "Cámara de seguridad offline",        estado: "CERRADA",     prioridad: "ALTA",    categoriaId: 5, asignadoId: 4,    creadoPorId: 5, bibliotecaId: 2, equipoId: null, fecha: "2025-01-02", etiquetas: [],                              descripcion: "" },
    { id: 8, titulo: "Teclado roto puesto 12",             estado: "RESUELTA",    prioridad: "BAJA",    categoriaId: 1, asignadoId: 2,    creadoPorId: 6, bibliotecaId: 3, equipoId: null, fecha: "2025-01-04", etiquetas: ["lento"],                       descripcion: "" },
  ],

  plantillas: [
    { id: 1, nombre: "Avería Hardware Estándar",    categoriaId: 1, uso: 34, descripcion: "Plantilla para reportar averías en equipos físicos. Incluye campos de diagnóstico inicial." },
    { id: 2, nombre: "Incidencia Software/Sistema", categoriaId: 2, uso: 28, descripcion: "Para problemas con aplicaciones, SIGB, o sistema operativo." },
    { id: 3, nombre: "Fallo de Red/Conectividad",   categoriaId: 3, uso: 19, descripcion: "Incidencias de red local, WiFi o acceso a internet." },
    { id: 4, nombre: "Equipamiento AV",             categoriaId: 4, uso: 11, descripcion: "Proyectores, pantallas, sistemas de audio y videoconferencia." },
    { id: 5, nombre: "Seguridad y Accesos",         categoriaId: 5, uso: 8,  descripcion: "Cámaras, control de acceso, alarmas y sistemas de seguridad." },
  ],

  historial: [
    { id: 1, tipo: "CREACION",   texto: "Incidencia creada por Lucía Fernández", fecha: "2025-01-07 09:15", autorId: 5 },
    { id: 2, tipo: "ASIGNACION", texto: "Asignada a Ana Soto (Técnico de Informática)", fecha: "2025-01-07 09:32", autorId: null },
    { id: 3, tipo: "COMENTARIO", texto: "Revisado el servidor de préstamos. Parece ser un fallo en el servicio de base de datos. Reiniciando instancia.", fecha: "2025-01-07 10:45", autorId: 3 },
    { id: 4, tipo: "ESTADO",     texto: "Estado cambiado a EN PROGRESO", fecha: "2025-01-07 10:46", autorId: 3 },
    { id: 5, tipo: "COMENTARIO", texto: "El servicio ha vuelto a caer. Necesito acceso al servidor físico para revisión más detallada.", fecha: "2025-01-07 14:22", autorId: 3 },
  ],

  etiquetasGlobales: ["urgente", "lento", "hardware-crítico", "SIGB", "producción", "planificado", "evento-próximo", "pendiente-revisión", "renovado-2023"],
};

// ─────────────────────────────────────────────────────────────────────
// LOOKUP HELPERS (puros, sin React) — útiles fuera de componentes
// ─────────────────────────────────────────────────────────────────────

const indexBy = (arr, key = "id") =>
  arr.reduce((acc, x) => { acc[x[key]] = x; return acc; }, {});

export const catalogIndex = {
  bibliotecas: indexBy(bibliotecas),
  categorias:  indexBy(categorias),
  categoriasByCodigo: indexBy(categorias, "codigo"),
  roles:       indexBy(roles),
  rolesByCodigo: indexBy(roles, "codigo"),
};

export const lookup = {
  bibliotecaNombre: (id) => catalogIndex.bibliotecas[id]?.nombre ?? "—",
  categoriaCodigo:  (id) => catalogIndex.categorias[id]?.codigo  ?? "SIN_CATEGORIA",
  categoriaIdByCodigo: (codigo) => catalogIndex.categoriasByCodigo[codigo]?.id ?? null,
  roleCodigo:       (id) => catalogIndex.roles[id]?.codigo ?? "USUARIO",
  roleIdByCodigo:   (codigo) => catalogIndex.rolesByCodigo[codigo]?.id ?? null,
};
