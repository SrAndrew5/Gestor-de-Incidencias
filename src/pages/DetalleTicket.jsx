import { useState, useRef, useEffect } from "react";
import { mockData } from "../services/api";
import { Badge, PrioridadBadge, Btn, EtiquetaBadge, Modal, TagInput, SkeletonDetalle } from "../components/UI";
import RoleGuard from "../components/RoleGuard";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Paperclip, Image as ImageIcon, FileText, Download, Clock } from "lucide-react";
import { calcularSLA, validarCierre, procesarTriggers } from "../utils/businessRules";

const tipoIcono = {
  CREACION:   { icon: "◎", color: "text-sky-600 dark:text-sky-400" },
  ASIGNACION: { icon: "→", color: "text-violet-600 dark:text-violet-400" },
  COMENTARIO: { icon: "▤", color: "text-ink2" },
  ESTADO:     { icon: "◈", color: "text-amber-600 dark:text-amber-400" },
  PRIORIDAD:  { icon: "▲", color: "text-orange-600 dark:text-orange-400" },
};

const PRIORIDADES    = ["BAJA", "MEDIA", "ALTA", "CRITICA"];
const ESTADOS_FLOW   = ["ABIERTA", "EN_PROGRESO", "PENDIENTE_TERCEROS", "RESUELTA", "CERRADA", "REABIERTA"];

export default function DetalleTicket({ id, navigate }) {
  const { user } = useAuth();
  const isUsuario   = user.role === "USUARIO";

  const { addToast } = useToast();
  const {
    incidenciasView, actualizarIncidencia, borrarIncidencia,
    usuariosView, historialMap, addHistorialEntry, hydrateHistorialEntry,
    getUsuarioNombre,
  } = useData();
  const tecnicos = usuariosView.filter(u => u.role === "TECNICO");
  const inc = incidenciasView.find(i => i.id === id) || incidenciasView[0];
  const isCerrada = inc.estado === "CERRADA";
  // _equipo viene pre-resuelto por el hydrator en DataContext
  const equipoRelacionado = inc._equipo;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const historialCrudo  = historialMap[inc.id] || [];
  const historial = historialCrudo.map(hydrateHistorialEntry);
  const [comentario, setComentario] = useState("");
  const fileInputRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, [id]);

  const estado = inc.estado;
  const prioridad = inc.prioridad || null;
  // FK (raw) y string derivado (hydrated) — usa cada uno según necesidad
  const asignadoId = inc.asignadoId ?? null;
  const asignadoNombre = inc.asignado || "";
  const etiquetas = inc.etiquetas || [];
  const adjuntos = inc.adjuntos || [];

  const sinClasificar = !prioridad;
  
  const slaInfo = calcularSLA(inc);

  const addToHistorial = (tipo, texto) => {
    const entry = {
      id: crypto.randomUUID(), tipo, texto,
      fecha: new Date().toLocaleString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", ""),
      autorId: user.id,
    };
    addHistorialEntry(inc.id, entry);
  };

  const agregarComentario = () => {
    if (!comentario.trim()) return;
    addToHistorial("COMENTARIO", comentario);
    setComentario("");
    addToast("Comentario añadido correctamente");
  };

  const handleAgregarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) { addToast("Selecciona un archivo válido antes de adjuntar", "error"); return; }
    const newFile = { id: crypto.randomUUID(), name: file.name, size: (file.size / 1024).toFixed(1) + " KB", type: file.type, url: URL.createObjectURL(file) };
    actualizarIncidencia(inc.id, { adjuntos: [...adjuntos, newFile] });
    addToHistorial("COMENTARIO", `Ha adjuntado un documento: ${file.name}`);
    addToast(`Archivo adjunto: ${file.name}`, "success");
    e.target.value = "";
  };

  const cambiarEstado = (nuevoEstado) => {
    try {
      validarCierre(nuevoEstado, historial);
    } catch (err) {
      addToast(err.message, "error");
      return;
    }
    
    actualizarIncidencia(inc.id, { estado: nuevoEstado });
    addToHistorial("ESTADO", `Estado cambiado a ${nuevoEstado.replace("_", " ")}`);
    addToast(`Estado actualizado a ${nuevoEstado.replace("_", " ")}`);
    procesarTriggers("CAMBIO_ESTADO", { ...inc, estado: nuevoEstado }, addToast);
  };

  const asignarPrioridad = (p) => {
    const anterior = inc.prioridad;
    actualizarIncidencia(inc.id, { prioridad: p });
    addToHistorial("PRIORIDAD", anterior ? `Prioridad actualizada: ${anterior} → ${p}` : `Prioridad asignada: ${p}`);
    addToast(`Prioridad ${p} asignada`);
  };

  const handleExportTicket = () => {
    const csv =
      `"ID","${inc.id}"\n` +
      `"Título","${inc.titulo.replace(/"/g, '""')}"\n` +
      `"Descripción","${(inc.descripcion || "").replace(/"/g, '""')}"\n` +
      `"Estado","${estado}"\n` +
      `"Prioridad","${prioridad || "SIN CLASIFICAR"}"\n` +
      `"Categoría","${inc.categoria}"\n` +
      `"Asignado","${asignadoNombre || "—"}"\n` +
      `"Biblioteca","${inc.biblioteca}"\n` +
      `"Autor","${inc.creadoPor}"\n` +
      `"Fecha","${inc.fecha}"\n` +
      `"Etiquetas","${etiquetas.join(" | ")}"`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `ticket_${inc.id}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast("Exportación de ticket completada", "success");
  };

  const executeDelete = () => {
    borrarIncidencia(inc.id);
    addToast(`Ticket #${inc.id} ha sido borrado del sistema`, "warning");
    navigate("incidencias");
  };

  if (isLoading) return <SkeletonDetalle />;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("incidencias")} className="text-ink3 hover:text-ink2 text-sm transition-colors">
          ← {isUsuario ? "Mis Incidencias" : "Incidencias"}
        </button>
        <span className="text-edge2">/</span>
        <span className="text-ink3 text-sm font-mono" title={String(inc.id)}>#{String(inc.id).slice(-5)}</span>
        {sinClasificar && !isUsuario && (
          <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800 border border-amber-400 border-dashed animate-pulse dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/30">
            ◐ Pendiente de clasificar
          </span>
        )}
      </div>

      {/* Banner sin clasificar */}
      <RoleGuard allowed={["ADMIN", "TECNICO"]}>
        {sinClasificar && (
          <div className="mb-6 flex items-center gap-4 bg-amber-50 border border-amber-200 border-dashed rounded-xl px-5 py-4 dark:bg-amber-400/5 dark:border-amber-400/20">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 text-lg flex-shrink-0">▲</div>
            <div className="flex-1">
              <div className="text-amber-700 dark:text-amber-300 text-sm font-medium mb-0.5">Esta incidencia no tiene prioridad asignada</div>
              <div className="text-ink3 text-xs">Revisa la descripción y asigna una prioridad desde el panel lateral.</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {PRIORIDADES.map(p => (
                <button
                  key={p}
                  onClick={() => asignarPrioridad(p)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    p === "CRITICA" ? "border-red-300 text-red-700 hover:bg-red-100 dark:border-red-500/50 dark:text-red-300 dark:hover:bg-red-500/20" :
                    p === "ALTA"    ? "border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-500/50 dark:text-orange-300 dark:hover:bg-orange-500/20" :
                    p === "MEDIA"   ? "border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500/50 dark:text-yellow-300 dark:hover:bg-yellow-500/20" :
                                      "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </RoleGuard>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title card */}
          <div className={`border rounded-xl p-6 transition-colors bg-card ${sinClasificar && !isUsuario ? "border-amber-300 dark:border-amber-400/20" : "border-edge"}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-ink text-xl font-bold leading-snug flex-1">{inc.titulo}</h1>
              {prioridad
                ? <PrioridadBadge prioridad={prioridad} />
                : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border border-dashed border-slate-300 text-slate-500 bg-slate-50 dark:border-zinc-600 dark:text-zinc-500 dark:bg-zinc-800/40">
                    ○ Sin prioridad
                  </span>
                )
              }
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <Badge estado={estado} />
              <span className="text-edge2">·</span>
              <span className="text-ink2">{inc.biblioteca}</span>
              <span className="text-edge2">·</span>
              <span className="text-xs bg-well text-ink2 px-2 py-0.5 rounded">{inc.categoria}</span>
              <span className="text-edge2">·</span>
              <span className="text-ink3">{inc.fecha}</span>
              <span className="text-edge2">·</span>
              <span className="text-ink3">por {inc.creadoPor}</span>
              
              {!isCerrada && inc.prioridad && (
                <>
                  <span className="text-edge2">·</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${
                    slaInfo.status === "BREACHED" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                    slaInfo.status === "WARNING" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                  }`}>
                    <Clock size={12} /> {slaInfo.label}
                  </span>
                </>
              )}
            </div>
            {etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {etiquetas.map(t => <EtiquetaBadge key={t} tag={t} />)}
              </div>
            )}
            {!isCerrada && (
              <RoleGuard allowed={["ADMIN", "TECNICO"]}>
                <div className="mt-4 pt-4 border-t border-edge">
                  <div className="text-ink3 text-xs mb-2 font-medium">ETIQUETAS</div>
                  <TagInput
                    value={etiquetas}
                    onChange={(tags) => {
                      actualizarIncidencia(inc.id, { etiquetas: tags });
                    }}
                    suggestions={mockData.etiquetasGlobales}
                  />
                </div>
              </RoleGuard>
            )}
            <div className="mt-5 pt-4 border-t border-edge">
              <p className="text-ink2 text-sm leading-relaxed whitespace-pre-wrap">
                {inc.descripcion || "El sistema de préstamos de la biblioteca ha dejado de responder."}
              </p>
            </div>

            {adjuntos.length > 0 && (
              <div className="mt-5 pt-4 border-t border-edge">
                <div className="text-ink3 text-xs tracking-wide mb-3 flex items-center gap-2">
                  <Paperclip size={14} /> ARCHIVOS ADJUNTOS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {adjuntos.map(a => (
                    <a key={a.id} href={a.url} download={a.name} className="flex items-center gap-3 bg-well hover:bg-hov border border-edge rounded-lg p-2.5 cursor-pointer group transition-colors">
                      <div className="w-10 h-10 rounded bg-card border border-edge flex items-center justify-center text-ink3 flex-shrink-0 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {a.type.startsWith("image/") ? <ImageIcon size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-ink text-xs font-medium truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" title={a.name}>{a.name}</div>
                        <div className="text-ink3 text-xs mt-0.5">{a.size}</div>
                      </div>
                      <div className="text-ink3 hover:text-amber-500 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download size={16} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="bg-card border border-edge rounded-xl">
            <div className="px-5 py-4 border-b border-edge">
              <div className="text-ink3 text-xs tracking-wide font-semibold">HISTORIAL DE ACTIVIDAD</div>
            </div>
            <div className="p-5 space-y-4">
              {historial.map((h, i) => {
                const meta = tipoIcono[h.tipo] || tipoIcono.COMENTARIO;
                return (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded bg-well flex items-center justify-center text-xs ${meta.color} flex-shrink-0`}>
                        {meta.icon}
                      </div>
                      {i < historial.length - 1 && <div className="w-px flex-1 bg-edge my-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-ink text-xs font-medium">{h.autor}</span>
                        <span className="text-ink3 text-xs">{h.fecha}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded bg-well ${meta.color} opacity-80`}>{h.tipo}</span>
                      </div>
                      {h.tipo === "COMENTARIO" ? (
                        <div className="bg-well rounded-lg px-4 py-3 text-ink text-sm leading-relaxed border border-edge">
                          {h.texto}
                        </div>
                      ) : (
                        <div className="text-ink2 text-sm">{h.texto}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isCerrada ? (
              <div className="px-5 pb-5 border-t border-edge pt-4 space-y-3">
                <div className="text-ink3 text-xs tracking-wide font-semibold">AÑADIR COMENTARIO O ADJUNTO</div>
                <textarea
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && e.metaKey) agregarComentario(); }}
                  placeholder="Escribe un comentario o actualización... (⌘Enter para enviar)"
                  rows={3}
                  className="w-full bg-well border border-edge2 rounded-lg px-4 py-3 text-ink text-sm placeholder-ink3 focus:outline-none focus:border-amber-500/60 resize-none"
                />
                <div className="flex items-center gap-3">
                  <Btn onClick={agregarComentario} disabled={!comentario.trim()} size="sm">Publicar comentario</Btn>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleAgregarArchivo} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-ink2 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded hover:bg-well transition-colors"
                  >
                    <Paperclip size={14} /> Adjuntar archivo
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5 border-t border-edge pt-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-well border border-edge text-ink2 text-sm">
                  <span>🔒</span> Este ticket está cerrado y es de solo lectura.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Prioridad */}
          {!isCerrada && (
            <RoleGuard allowed={["ADMIN", "TECNICO"]}>
              <div className={`border rounded-xl p-5 bg-card transition-colors ${sinClasificar ? "border-amber-300 dark:border-amber-400/20" : "border-edge"}`}>
                <div className={`text-xs tracking-wide mb-3 font-semibold ${sinClasificar ? "text-amber-700 dark:text-amber-400/70" : "text-ink3"}`}>
                  {sinClasificar ? "▲ ASIGNAR PRIORIDAD" : "PRIORIDAD"}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORIDADES.map(p => {
                    const colors = {
                      CRITICA: prioridad === p ? "bg-red-200 border-red-400 text-red-800 dark:bg-red-500/20 dark:border-red-500/60 dark:text-red-300" : "border-edge2 text-ink2 hover:border-red-400 hover:text-red-800 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-red-500/40 dark:hover:text-red-400",
                      ALTA:    prioridad === p ? "bg-orange-200 border-orange-400 text-orange-800 dark:bg-orange-500/20 dark:border-orange-500/60 dark:text-orange-300" : "border-edge2 text-ink2 hover:border-orange-400 hover:text-orange-800 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-orange-500/40 dark:hover:text-orange-400",
                      MEDIA:   prioridad === p ? "bg-yellow-200 border-yellow-400 text-yellow-800 dark:bg-yellow-500/20 dark:border-yellow-500/60 dark:text-yellow-300" : "border-edge2 text-ink2 hover:border-yellow-400 hover:text-yellow-800 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-yellow-500/40 dark:hover:text-yellow-400",
                      BAJA:    prioridad === p ? "bg-well border-edge2 text-ink dark:bg-zinc-600/40 dark:border-zinc-500 dark:text-zinc-300" : "border-edge2 text-ink2 hover:border-edge dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-zinc-500 dark:hover:text-zinc-400",
                    };
                    return (
                      <button
                        key={p}
                        onClick={() => asignarPrioridad(p)}
                        className={`px-3 py-2 rounded border text-xs font-bold transition-all ${colors[p]}`}
                      >
                        {prioridad === p && "◉ "}{p}
                      </button>
                    );
                  })}
                </div>
                {prioridad && (
                  <button
                    onClick={() => {
                      actualizarIncidencia(inc.id, { prioridad: null });
                      addToHistorial("PRIORIDAD", "Prioridad eliminada — pendiente de clasificar");
                      addToast("Prioridad eliminada", "warning");
                    }}
                    className="mt-2 text-ink3 hover:text-ink2 text-xs w-full text-center transition-colors"
                  >
                    Quitar prioridad
                  </button>
                )}
              </div>
            </RoleGuard>
          )}

          {/* Estado */}
          <RoleGuard allowed={["ADMIN", "TECNICO"]}>
            <div className="bg-card border border-edge rounded-xl p-5">
              <div className="text-ink3 text-xs tracking-wide mb-3 font-semibold">CAMBIAR ESTADO</div>
              <div className="space-y-2">
                {ESTADOS_FLOW.map(s => (
                  <button
                    key={s}
                    onClick={() => (!isCerrada || s === "REABIERTA") && cambiarEstado(s)}
                    disabled={isCerrada && s !== "CERRADA" && s !== "REABIERTA"}
                    className={`w-full text-left px-3 py-2.5 rounded text-sm transition-all border ${
                      estado === s
                        ? "bg-amber-200 border-amber-400 text-amber-800 font-medium dark:bg-amber-400/10 dark:border-amber-400/40 dark:text-amber-400"
                        : "bg-well/40 border-edge text-ink2 hover:bg-well hover:text-ink"
                    }`}
                  >
                    <span className="mr-2">{estado === s ? "◉" : "○"}</span>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </RoleGuard>
          <RoleGuard allowed={["USUARIO"]}>
            <div className="bg-card border border-edge rounded-xl p-5">
              <div className="text-ink3 text-xs tracking-wide mb-3 font-semibold">ESTADO ACTUAL</div>
              <div className="w-full text-left px-3 py-2.5 rounded text-sm border bg-amber-200 border-amber-400 text-amber-800 font-medium dark:bg-amber-400/10 dark:border-amber-400/40 dark:text-amber-400">
                <span className="mr-2">◉</span>
                {estado.replace("_", " ")}
              </div>
            </div>
          </RoleGuard>

          {/* Asignación */}
          {!isCerrada && (
            <RoleGuard allowed={["ADMIN", "TECNICO"]}>
              <div className="bg-card border border-edge rounded-xl p-5">
                <div className="text-ink3 text-xs tracking-wide mb-3 font-semibold">ASIGNAR TÉCNICO</div>
                <select
                  value={asignadoId ?? ""}
                  onChange={e => {
                    // Persistimos el ID (FK). El nombre se resuelve en el hydrator.
                    const nuevoId = e.target.value ? Number(e.target.value) : null;
                    const anteriorNombre = asignadoNombre;
                    const nuevoNombre = nuevoId ? getUsuarioNombre(nuevoId) : null;
                    actualizarIncidencia(inc.id, { asignadoId: nuevoId });
                    addToHistorial("ASIGNACION", nuevoNombre ? `Asignada a ${nuevoNombre}${anteriorNombre ? ` (antes: ${anteriorNombre})` : ""}` : "Asignación eliminada");
                    addToast(nuevoNombre ? `Ticket asignado a ${nuevoNombre}` : "Asignación eliminada");
                  }}
                  className="w-full bg-well border border-edge2 rounded px-3 py-2 text-ink text-sm focus:outline-none focus:border-amber-500/60"
                >
                  <option value="">Sin asignar</option>
                  {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            </RoleGuard>
          )}

          {/* Detalles */}
          <div className="bg-card border border-edge rounded-xl p-5">
            <div className="text-ink3 text-xs tracking-wide mb-3 font-semibold">DETALLES</div>
            <dl className="space-y-3">
              {[
                ["ID",         `#${inc.id}`],
                ...(equipoRelacionado ? [["Equipo AF.", equipoRelacionado.nombre]] : []),
                ["Biblioteca", inc.biblioteca],
                ["Categoría",  inc.categoria],
                ["Asignado",   asignadoNombre || "—"],
                ["Creado por", inc.creadoPor],
                ["Fecha",      inc.fecha],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs gap-2">
                  <dt className="text-ink3 flex-shrink-0">{k}</dt>
                  <dd className="text-ink text-right truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Acciones */}
          <RoleGuard allowed={["ADMIN", "TECNICO"]}>
            <div className="bg-card border border-edge rounded-xl p-5 space-y-2">
              <div className="text-ink3 text-xs tracking-wide mb-3 font-semibold">ACCIONES</div>
              <Btn variant="secondary" size="sm" className="w-full justify-center" onClick={handleExportTicket}>⬇ Exportar ticket</Btn>
              <RoleGuard allowed={["ADMIN"]}>
                <Btn variant="danger" size="sm" className="w-full justify-center" onClick={() => setShowDeleteConfirm(true)}>✕ Eliminar incidencia</Btn>
              </RoleGuard>
            </div>
          </RoleGuard>
        </div>
      </div>

      {showDeleteConfirm && (
        <Modal title="Confirmar eliminación" onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <div className="flex gap-4 items-center bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 p-4 rounded-lg">
              <span className="text-red-500 text-2xl">⚠️</span>
              <p className="text-ink text-sm leading-relaxed">
                ¿Está seguro de eliminar permanentemente el ticket <strong>#{inc.id}</strong>?<br />
                <span className="text-red-600 dark:text-red-400 mt-1 inline-block">Esta acción no se puede deshacer.</span>
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Btn variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Btn>
              <Btn variant="danger" onClick={executeDelete}>ELIMINAR TICKET</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
