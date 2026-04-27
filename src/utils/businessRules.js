// src/utils/businessRules.js

// ─────────────────────────────────────────────────────────────────────────────
// 1. MATRIZ DE PRIORIDAD (Basado en ITIL)
// ─────────────────────────────────────────────────────────────────────────────
export const NIVELES = { ALTA: 3, MEDIA: 2, BAJA: 1 };

/**
 * Calcula la prioridad basada en la urgencia y el impacto.
 */
export function calcularPrioridad(urgencia, impacto) {
  if (!urgencia || !impacto) return null;
  const score = NIVELES[urgencia] * NIVELES[impacto];
  
  if (score >= 6) return "CRITICA"; // Alta * Alta (9) o Alta * Media (6)
  if (score >= 4) return "ALTA";    // Media * Media (4)
  if (score >= 2) return "MEDIA";   // Baja * Media (2) o Media * Baja (2)
  return "BAJA";                    // Baja * Baja (1)
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MOTOR DE SLAs (Service Level Agreements)
// ─────────────────────────────────────────────────────────────────────────────
export const SLA_HOURS = {
  CRITICA: 2,   // 2 horas
  ALTA: 8,      // 8 horas (1 jornada)
  MEDIA: 48,    // 48 horas
  BAJA: 120,    // 5 días
};

/**
 * Calcula el estado del SLA de un ticket.
 * En producción usaría horas laborables (Business Hours), aquí usamos horas naturales.
 */
export function calcularSLA(incidencia) {
  if (!incidencia.prioridad) return { status: "NONE", label: "Sin SLA" };
  if (incidencia.estado === "RESUELTA" || incidencia.estado === "CERRADA") {
    return { status: "OK", label: "En SLA (Cerrado)" };
  }
  
  const created = new Date(incidencia.fecha);
  const now = new Date();
  const diffHours = (now - created) / (1000 * 60 * 60);
  const limit = SLA_HOURS[incidencia.prioridad] || 24;

  if (diffHours > limit) {
    return { status: "BREACHED", label: "SLA Vencido" };
  } else if (diffHours > limit * 0.75) {
    return { status: "WARNING", label: "SLA en riesgo" };
  }
  return { status: "OK", label: "SLA en plazo" };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ASIGNACIÓN AUTOMÁTICA (Round Robin / Menor carga)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Encuentra al técnico con menos carga de trabajo en la misma biblioteca.
 */
export function asignarAutomaticamente(nuevaIncidencia, usuarios, todasLasIncidencias) {
  // Buscar técnicos de la misma biblioteca
  const tecnicos = usuarios.filter(u => 
    u.roleId === 2 && // 2 = TECNICO
    u.bibliotecaId === nuevaIncidencia.bibliotecaId && 
    u.activo
  );

  if (tecnicos.length === 0) return null;

  // Contar tickets activos por técnico
  const cargaDeTrabajo = tecnicos.map(tec => {
    const tickets = todasLasIncidencias.filter(i => 
      i.asignadoId === tec.id && 
      i.estado !== "RESUELTA" && 
      i.estado !== "CERRADA"
    ).length;
    return { tecnicoId: tec.id, tickets };
  });

  // Ordenar por el que tiene menos tickets
  cargaDeTrabajo.sort((a, b) => a.tickets - b.tickets);
  
  return cargaDeTrabajo[0].tecnicoId;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. VALIDACIÓN DE INTEGRIDAD
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Valida si un ticket puede ser cerrado o resuelto.
 */
export function validarCierre(incidenciaEstado, historial) {
  if (incidenciaEstado === "RESUELTA" || incidenciaEstado === "CERRADA") {
    const tieneComentarios = historial.some(h => h.tipo === "COMENTARIO");
    if (!tieneComentarios) {
      throw new Error("No puedes resolver una incidencia sin añadir un comentario detallando la solución.");
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TRIGGERS (Simulador de notificaciones backend)
// ─────────────────────────────────────────────────────────────────────────────
export function procesarTriggers(evento, payload, addToast) {
  switch (evento) {
    case "NUEVA_INCIDENCIA":
      if (payload.prioridad === "CRITICA") {
         addToast("¡ALERTA! Ticket crítico creado. Se ha notificado a Dirección.", "warning");
      }
      if (payload.asignadoId) {
         addToast(`Sistema: Ticket auto-asignado al técnico disponible`, "info");
      }
      break;
    case "CAMBIO_ESTADO":
      if (payload.estado === "RESUELTA") {
         addToast("Se ha enviado un email al usuario para que confirme la resolución.", "info");
      }
      break;
  }
}
