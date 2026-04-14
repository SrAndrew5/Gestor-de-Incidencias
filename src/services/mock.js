export const BIBLIOTECAS = [
  "Biblioteca Central",
  "Biblioteca Norte",
  "Biblioteca Sur",
  "Biblioteca Este",
  "Biblioteca Oeste",
];

export const mockData = {
  stats: { totalIncidencias: 142, abiertas: 38, enProgreso: 21, resueltas: 83, criticas: 5, avgResolucion: 2.4 },
  incidencias: [
    { id: 1, titulo: "Ordenador sala 3 no arranca", estado: "ABIERTA", prioridad: "ALTA", categoria: "HARDWARE", asignado: "Juan Técnico", fecha: "2025-01-08", biblioteca: "Biblioteca Central", creadoPor: "Lucía Fernández", creadoPorId: 5, equipoId: 1, etiquetas: ["urgente", "hardware-crítico"] },
    { id: 2, titulo: "Sistema de préstamos caído", estado: "EN_PROGRESO", prioridad: "CRITICA", categoria: "SOFTWARE", asignado: "Ana Soto", fecha: "2025-01-07", biblioteca: "Biblioteca Norte", creadoPor: "Pedro Molina", creadoPorId: 6, equipoId: null, etiquetas: ["SIGB", "producción"] },
    { id: 3, titulo: "Impresora atascada planta 2", estado: "ABIERTA", prioridad: "MEDIA", categoria: "HARDWARE", asignado: null, fecha: "2025-01-09", biblioteca: "Biblioteca Central", creadoPor: "Lucía Fernández", creadoPorId: 5, equipoId: 2, etiquetas: ["lento"] },
    { id: 4, titulo: "Fallo de conexión WiFi sala infantil", estado: "RESUELTA", prioridad: "BAJA", categoria: "RED", asignado: "Carlos R.", fecha: "2025-01-05", biblioteca: "Biblioteca Sur", creadoPor: "Lucía Fernández", creadoPorId: 5, equipoId: null, etiquetas: [] },
    { id: 5, titulo: "Actualización SIGB pendiente", estado: "EN_PROGRESO", prioridad: "MEDIA", categoria: "SOFTWARE", asignado: "Ana Soto", fecha: "2025-01-06", biblioteca: "Biblioteca Este", creadoPor: "Pedro Molina", creadoPorId: 6, equipoId: null, etiquetas: ["SIGB", "planificado"] },
    { id: 6, titulo: "Proyector sala conferencias dañado", estado: "ABIERTA", prioridad: "ALTA", categoria: "AV", asignado: null, fecha: "2025-01-09", biblioteca: "Biblioteca Central", creadoPor: "Pedro Molina", creadoPorId: 6, equipoId: 3, etiquetas: ["evento-próximo"] },
    { id: 7, titulo: "Cámara de seguridad offline", estado: "CERRADA", prioridad: "ALTA", categoria: "SEGURIDAD", asignado: "Carlos R.", fecha: "2025-01-02", biblioteca: "Biblioteca Norte", creadoPor: "Lucía Fernández", creadoPorId: 5, equipoId: null, etiquetas: [] },
    { id: 8, titulo: "Teclado roto puesto 12", estado: "RESUELTA", prioridad: "BAJA", categoria: "HARDWARE", asignado: "Juan Técnico", fecha: "2025-01-04", biblioteca: "Biblioteca Sur", creadoPor: "Pedro Molina", creadoPorId: 6, equipoId: null, etiquetas: ["lento"] },
  ],
  inventario: [
    { id: 1, codigoInventario: "BCEN-PC-001", nombre: "Dell OptiPlex 7090", tipo: "ORDENADOR", biblioteca: "Biblioteca Central", sala: "Sala 1", puesto: "Puesto 01", estado: "OPERATIVO", serie: "SN-4821-A", marca: "Dell", modelo: "OptiPlex 7090", so: "Windows 11 Pro", ram: "16 GB", cpu: "Intel i5-10500", almacenamiento: "SSD 512GB", ultima_revision: "2024-11-15", etiquetas: ["renovado-2023"] },
    { id: 2, codigoInventario: "BCEN-IMP-001", nombre: "HP LaserJet Pro M404", tipo: "IMPRESORA", biblioteca: "Biblioteca Central", sala: "Planta 2", puesto: "Pasillo B", estado: "AVERIADO", serie: "SN-9932-B", marca: "HP", modelo: "LaserJet Pro M404", so: "", ram: "", cpu: "", almacenamiento: "", ultima_revision: "2024-12-01", etiquetas: ["lento", "pendiente-revisión"] },
    { id: 3, codigoInventario: "BCEN-AV-001", nombre: "Epson EB-X51 Proyector", tipo: "AV", biblioteca: "Biblioteca Central", sala: "Sala Conferencias", puesto: "Techo", estado: "AVERIADO", serie: "SN-1123-C", marca: "Epson", modelo: "EB-X51", so: "", ram: "", cpu: "", almacenamiento: "", ultima_revision: "2024-10-20", etiquetas: ["evento-próximo"] },
    { id: 4, codigoInventario: "BNOR-RED-001", nombre: "Cisco Switch 24p", tipo: "RED", biblioteca: "Biblioteca Norte", sala: "Rack Principal", puesto: "U4", estado: "OPERATIVO", serie: "SN-5577-D", marca: "Cisco", modelo: "Catalyst 2960", so: "IOS 15.2", ram: "", cpu: "", almacenamiento: "", ultima_revision: "2024-12-10", etiquetas: [] },
    { id: 5, codigoInventario: "BSUR-PC-001", nombre: "Lenovo ThinkCentre M75q", tipo: "ORDENADOR", biblioteca: "Biblioteca Sur", sala: "Sala Infantil", puesto: "Puesto 03", estado: "OPERATIVO", serie: "SN-2234-E", marca: "Lenovo", modelo: "ThinkCentre M75q", so: "Windows 10 Pro", ram: "8 GB", cpu: "AMD Ryzen 5", almacenamiento: "SSD 256GB", ultima_revision: "2024-11-28", etiquetas: ["lento"] },
    { id: 6, codigoInventario: "BNOR-SRV-001", nombre: "NAS Synology DS223", tipo: "SERVIDOR", biblioteca: "Biblioteca Norte", sala: "Cuarto Técnico", puesto: "Rack B1", estado: "OPERATIVO", serie: "SN-8801-F", marca: "Synology", modelo: "DS223", so: "DSM 7.2", ram: "2 GB", cpu: "Realtek RTD1619B", almacenamiento: "2x4TB HDD", ultima_revision: "2025-01-02", etiquetas: [] },
    { id: 7, codigoInventario: "BEST-PER-001", nombre: "Scanner Fujitsu fi-7160", tipo: "PERIFÉRICO", biblioteca: "Biblioteca Este", sala: "Mostrador", puesto: "Principal", estado: "MANTENIMIENTO", serie: "SN-3390-G", marca: "Fujitsu", modelo: "fi-7160", so: "", ram: "", cpu: "", almacenamiento: "", ultima_revision: "2024-12-15", etiquetas: ["pendiente-revisión"] },
    { id: 8, codigoInventario: "BSUR-MON-001", nombre: "Monitor LG 27'' 4K", tipo: "MONITOR", biblioteca: "Biblioteca Sur", sala: "Sala 3", puesto: "Puesto 08", estado: "OPERATIVO", serie: "SN-6641-H", marca: "LG", modelo: "27UK850-W", so: "", ram: "", cpu: "", almacenamiento: "", ultima_revision: "2024-11-05", etiquetas: [] },
  ],
  usuarios: [
    { id: 1, nombre: "María García",   email: "m.garcia@biblioteca.es",    rol: "ADMIN",   activo: true,  departamento: "Dirección",   biblioteca: "Biblioteca Central" },
    { id: 2, nombre: "Juan Técnico",   email: "j.tecnico@biblioteca.es",   rol: "TECNICO", activo: true,  departamento: "Informática", biblioteca: "Biblioteca Central" },
    { id: 3, nombre: "Ana Soto",       email: "a.soto@biblioteca.es",      rol: "TECNICO", activo: true,  departamento: "Informática", biblioteca: "Biblioteca Norte" },
    { id: 4, nombre: "Carlos R.",      email: "c.rodriguez@biblioteca.es", rol: "TECNICO", activo: false, departamento: "Informática", biblioteca: "Biblioteca Sur" },
    { id: 5, nombre: "Lucía Fernández",email: "l.fernandez@biblioteca.es", rol: "USUARIO", activo: true,  departamento: "Referencia",  biblioteca: "Biblioteca Central" },
    { id: 6, nombre: "Pedro Molina",   email: "p.molina@biblioteca.es",    rol: "USUARIO", activo: true,  departamento: "Infantil",    biblioteca: "Biblioteca Norte" },
  ],
  plantillas: [
    { id: 1, nombre: "Avería Hardware Estándar",    categoria: "HARDWARE",  uso: 34, descripcion: "Plantilla para reportar averías en equipos físicos. Incluye campos de diagnóstico inicial." },
    { id: 2, nombre: "Incidencia Software/Sistema", categoria: "SOFTWARE",  uso: 28, descripcion: "Para problemas con aplicaciones, SIGB, o sistema operativo." },
    { id: 3, nombre: "Fallo de Red/Conectividad",   categoria: "RED",       uso: 19, descripcion: "Incidencias de red local, WiFi o acceso a internet." },
    { id: 4, nombre: "Equipamiento AV",             categoria: "AV",        uso: 11, descripcion: "Proyectores, pantallas, sistemas de audio y videoconferencia." },
    { id: 5, nombre: "Seguridad y Accesos",         categoria: "SEGURIDAD", uso: 8,  descripcion: "Cámaras, control de acceso, alarmas y sistemas de seguridad." },
  ],
  historial: [
    { id: 1, tipo: "CREACION",   texto: "Incidencia creada por Lucía Fernández", fecha: "2025-01-07 09:15", autor: "Lucía Fernández" },
    { id: 2, tipo: "ASIGNACION", texto: "Asignada a Ana Soto (Técnico de Informática)", fecha: "2025-01-07 09:32", autor: "Sistema" },
    { id: 3, tipo: "COMENTARIO", texto: "Revisado el servidor de préstamos. Parece ser un fallo en el servicio de base de datos. Reiniciando instancia.", fecha: "2025-01-07 10:45", autor: "Ana Soto" },
    { id: 4, tipo: "ESTADO",     texto: "Estado cambiado a EN PROGRESO", fecha: "2025-01-07 10:46", autor: "Ana Soto" },
    { id: 5, tipo: "COMENTARIO", texto: "El servicio ha vuelto a caer. Necesito acceso al servidor físico para revisión más detallada.", fecha: "2025-01-07 14:22", autor: "Ana Soto" },
  ],
  etiquetasGlobales: ["urgente", "lento", "hardware-crítico", "SIGB", "producción", "planificado", "evento-próximo", "pendiente-revisión", "renovado-2023"],
};
