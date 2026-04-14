import { useState, useRef } from "react";
import { mockData } from "../services/api";
import { Badge, PrioridadBadge, Btn, EtiquetaBadge, Modal, TagInput } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Paperclip, Image as ImageIcon, FileText, Download } from "lucide-react";

const tipoIcono = {
  CREACION:    { icon: "◎", color: "text-sky-400" },
  ASIGNACION:  { icon: "→", color: "text-violet-400" },
  COMENTARIO:  { icon: "▤", color: "text-zinc-400" },
  ESTADO:      { icon: "◈", color: "text-amber-400" },
  PRIORIDAD:   { icon: "▲", color: "text-orange-400" },
};

const PRIORIDADES = ["BAJA", "MEDIA", "ALTA", "CRITICA"];
const ESTADOS_FLOW = ["ABIERTA", "EN_PROGRESO", "RESUELTA", "CERRADA"];

export default function DetalleTicket({ id, navigate }) {
  const { user } = useAuth();
  const canClassify = user.role === "ADMIN" || user.role === "TECNICO";
  const isUsuario   = user.role === "USUARIO";

  const { addToast } = useToast();
  const { incidencias, setIncidencias, inventario, historialMap, addHistorialEntry } = useData();
  const inc = incidencias.find(i => i.id === id) || incidencias[0];
  const isCerrada = inc.estado === "CERRADA";
  const equipoRelacionado = inc.equipoId ? inventario.find(e => parseInt(e.id) === parseInt(inc.equipoId)) : null;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // ✅ Historial en DataContext — persiste al navegar entre tickets
  const historial = historialMap[inc.id] || [];
  const [comentario, setComentario] = useState("");
  const [adjuntos, setAdjuntos]     = useState(inc.adjuntos || []);
  const [estado, setEstado]         = useState(inc.estado);
  const [prioridad, setPrioridad]   = useState(inc.prioridad || null);
  const fileInputRef = useRef(null);
  const [asignado, setAsignado]     = useState(inc.asignado || "");
  // ✅ Etiquetas ahora con setter para poder editarlas
  const [etiquetas, setEtiquetas]   = useState(inc.etiquetas || []);

  const sinClasificar = !prioridad;

  const addToHistorial = (tipo, texto) => {
    const entry = {
      id: Date.now(), tipo, texto,
      fecha: new Date().toLocaleString("es-ES", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      }).replace(",", ""),
      autor: user.nombre || user.username,
    };
    // ✅ Persiste en DataContext keyed by ticketId
    addHistorialEntry(inc.id, entry);
  };

  const agregarComentario = () => {
    if (!comentario.trim()) return;
    addToHistorial("COMENTARIO", comentario);
    setComentario("");
    addToast("Comentario añadido correctamente");
  };

  // ✅ Bug corregido: acepta el evento del onChange del input
  const handleAgregarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) {
      addToast("Selecciona un archivo válido antes de adjuntar", "error");
      return;
    }
    const newFile = {
      id: Date.now(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      type: file.type,
      url: URL.createObjectURL(file)
    };
    setAdjuntos(prev => [...prev, newFile]);
    addToHistorial("COMENTARIO", `Ha adjuntado un documento: ${file.name}`);
    addToast(`Archivo adjunto: ${file.name}`, "success");
    e.target.value = "";
  };

  const cambiarEstado = (nuevoEstado) => {
    setEstado(nuevoEstado);
    setIncidencias(prev => prev.map(i => i.id === inc.id ? { ...i, estado: nuevoEstado } : i));
    addToHistorial("ESTADO", `Estado cambiado a ${nuevoEstado.replace("_", " ")}`);
    addToast(`Estado actualizado a ${nuevoEstado.replace("_", " ")}`);
  };

  const asignarPrioridad = (p) => {
    const anterior = prioridad;
    setPrioridad(p);
    setIncidencias(prev => prev.map(i => i.id === inc.id ? { ...i, prioridad: p } : i));
    addToHistorial(
      "PRIORIDAD",
      anterior
        ? `Prioridad actualizada: ${anterior} → ${p}`
        : `Prioridad asignada: ${p}`
    );
    addToast(`Prioridad ${p} asignada`);
  };

  const handleExportTicket = () => {
    const csvContent = 
      `"ID","${inc.id}"\n` +
      `"Título","${inc.titulo.replace(/"/g, '""')}"\n` +
      `"Descripción","${(inc.descripcion || "").replace(/"/g, '""')}"\n` +
      `"Estado","${estado}"\n` +
      `"Prioridad","${prioridad || "SIN CLASIFICAR"}"\n` +
      `"Categoría","${inc.categoria}"\n` +
      `"Asignado","${asignado || "—"}"\n` +
      `"Biblioteca","${inc.biblioteca}"\n` +
      `"Autor","${inc.creadoPor}"\n` +
      `"Fecha","${inc.fecha}"\n` +
      `"Etiquetas","${etiquetas.join(" | ")}"`;
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket_${inc.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Exportación de ticket completada", "success");
  };

  const handleDeleteTicket = () => {
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    setIncidencias(prev => prev.filter(i => i.id !== inc.id));
    addToast(`Ticket #${inc.id} ha sido borrado del sistema`, "warning");
    navigate("incidencias");
  };

  const tecnicos = mockData.usuarios.filter(u => u.rol === "TECNICO");

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("incidencias")} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← {isUsuario ? "Mis Incidencias" : "Incidencias"}
        </button>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-500 text-sm font-mono">#{inc.id}</span>
        {sinClasificar && !isUsuario && (
          <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/30 border-dashed animate-pulse">
            ◐ Pendiente de clasificar
          </span>
        )}
      </div>

      {/* Banner for tecnico/admin on unclassified tickets */}
      {sinClasificar && canClassify && (
        <div className="mb-6 flex items-center gap-4 bg-amber-400/5 border border-amber-400/20 border-dashed rounded-xl px-5 py-4">
          <div className="w-9 h-9 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 text-lg flex-shrink-0">▲</div>
          <div className="flex-1">
            <div className="text-amber-300 text-sm font-medium mb-0.5">Esta incidencia no tiene prioridad asignada</div>
            <div className="text-zinc-500 text-xs">Revisa la descripción y asigna una prioridad desde el panel lateral para que el equipo pueda organizarse.</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {PRIORIDADES.map(p => (
              <button
                key={p}
                onClick={() => asignarPrioridad(p)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                  p === "CRITICA" ? "border-red-500/50 text-red-300 hover:bg-red-500/20" :
                  p === "ALTA"    ? "border-orange-500/50 text-orange-300 hover:bg-orange-500/20" :
                  p === "MEDIA"   ? "border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20" :
                                    "border-zinc-600 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title card */}
          <div className={`border rounded-xl p-6 transition-colors ${sinClasificar && !isUsuario ? "bg-zinc-900 border-amber-400/20" : "bg-zinc-900 border-zinc-800"}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-white text-xl font-bold leading-snug flex-1">{inc.titulo}</h1>
              {prioridad
                ? <PrioridadBadge prioridad={prioridad} />
                : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border border-dashed border-zinc-600 text-zinc-500 bg-zinc-800/40">
                    ○ Sin prioridad
                  </span>
                )
              }
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <Badge estado={estado} />
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-400">{inc.biblioteca}</span>
              <span className="text-zinc-700">·</span>
              <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{inc.categoria}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500">{inc.fecha}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500">por {inc.creadoPor}</span>
            </div>
            {etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {etiquetas.map(t => <EtiquetaBadge key={t} tag={t} />)}
              </div>
            )}
            {/* ✅ Edición de etiquetas habilitada */}
            {!isCerrada && !isUsuario && (
              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <div className="text-zinc-500 text-xs mb-2">ETIQUETAS</div>
                <TagInput
                  value={etiquetas}
                  onChange={(tags) => {
                    setEtiquetas(tags);
                    setIncidencias(prev => prev.map(i => i.id === inc.id ? { ...i, etiquetas: tags } : i));
                  }}
                  suggestions={mockData.etiquetasGlobales}
                />
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-zinc-800">
              <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                {inc.descripcion || "El sistema de préstamos de la biblioteca ha dejado de responder. Los usuarios no pueden realizar préstamos ni devoluciones. Se ha comprobado que el servicio web devuelve error 503. La incidencia afecta a todos los puestos de trabajo y al módulo de autoservicio."}
              </p>
            </div>
            
            {/* Adjuntos Viewer */}
            {adjuntos.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-800/50">
                <div className="text-zinc-500 text-xs tracking-wide mb-3 flex items-center gap-2">
                  <Paperclip size={14} /> ARCHIVOS ADJUNTOS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {adjuntos.map(a => (
                    <a key={a.id} href={a.url} download={a.name} className="flex items-center gap-3 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors border border-zinc-700/50 rounded-lg p-2.5 cursor-pointer group">
                      <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500 flex-shrink-0 group-hover:text-amber-400 transition-colors">
                        {a.type.startsWith("image/") ? <ImageIcon size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-zinc-300 text-xs font-medium truncate group-hover:text-amber-400 transition-colors" title={a.name}>{a.name}</div>
                        <div className="text-zinc-600 text-[10px] mt-0.5">{a.size}</div>
                      </div>
                      <div className="text-zinc-500 hover:text-amber-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download size={16} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="px-5 py-4 border-b border-zinc-800">
              <div className="text-zinc-400 text-xs tracking-wide">HISTORIAL DE ACTIVIDAD</div>
            </div>
            <div className="p-5 space-y-4">
              {historial.map((h, i) => {
                const meta = tipoIcono[h.tipo] || tipoIcono.COMENTARIO;
                return (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded bg-zinc-800 flex items-center justify-center text-xs ${meta.color} flex-shrink-0`}>
                        {meta.icon}
                      </div>
                      {i < historial.length - 1 && <div className="w-px flex-1 bg-zinc-800/80 my-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-zinc-300 text-xs font-medium">{h.autor}</span>
                        <span className="text-zinc-600 text-xs">{h.fecha}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded bg-zinc-800 ${meta.color} opacity-70`}>{h.tipo}</span>
                      </div>
                      {h.tipo === "COMENTARIO" ? (
                        <div className="bg-zinc-800/60 rounded-lg px-4 py-3 text-zinc-300 text-sm leading-relaxed border border-zinc-700/40">
                          {h.texto}
                        </div>
                      ) : (
                        <div className="text-zinc-400 text-sm">{h.texto}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comment box */}
            {!isCerrada ? (
            <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-3">
              <div className="text-zinc-500 text-xs tracking-wide">AÑADIR COMENTARIO O ADJUNTO</div>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) agregarComentario(); }}
                placeholder="Escribe un comentario o actualización... (⌘Enter para enviar)"
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400/60 resize-none"
              />
              <div className="flex items-center gap-3">
                <Btn onClick={agregarComentario} disabled={!comentario.trim()} size="sm">
                  Publicar comentario
                </Btn>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleAgregarArchivo} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-zinc-400 hover:text-amber-400 flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors"
                >
                  <Paperclip size={14} /> Adjuntar archivo
                </button>
              </div>
            </div>
            ) : (
              <div className="px-5 pb-5 border-t border-zinc-800 pt-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-sm">
                  <span>🔒</span> Este ticket está cerrado y es de solo lectura.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Priority assignment — tecnico/admin only */}
          {canClassify && !isCerrada && (
            <div className={`border rounded-xl p-5 transition-colors ${sinClasificar ? "bg-zinc-900 border-amber-400/20" : "bg-zinc-900 border-zinc-800"}`}>
              <div className={`text-xs tracking-wide mb-3 ${sinClasificar ? "text-amber-400/70" : "text-zinc-500"}`}>
                {sinClasificar ? "▲ ASIGNAR PRIORIDAD" : "PRIORIDAD"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRIORIDADES.map(p => {
                  const colors = {
                    CRITICA: prioridad === p ? "bg-red-500/20 border-red-500/60 text-red-300" : "border-zinc-700 text-zinc-500 hover:border-red-500/40 hover:text-red-400",
                    ALTA:    prioridad === p ? "bg-orange-500/20 border-orange-500/60 text-orange-300" : "border-zinc-700 text-zinc-500 hover:border-orange-500/40 hover:text-orange-400",
                    MEDIA:   prioridad === p ? "bg-yellow-500/20 border-yellow-500/60 text-yellow-300" : "border-zinc-700 text-zinc-500 hover:border-yellow-500/40 hover:text-yellow-400",
                    BAJA:    prioridad === p ? "bg-zinc-600/40 border-zinc-500 text-zinc-300" : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-400",
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
                    setPrioridad(null); 
                    setIncidencias(prev => prev.map(i => i.id === inc.id ? { ...i, prioridad: null } : i));
                    addToHistorial("PRIORIDAD", "Prioridad eliminada — pendiente de clasificar"); 
                    addToast("Prioridad eliminada", "warning");
                  }}
                  className="mt-2 text-zinc-600 hover:text-zinc-400 text-xs w-full text-center transition-colors"
                >
                  Quitar prioridad
                </button>
              )}
            </div>
          )}

          {/* Estado */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-zinc-500 text-xs tracking-wide mb-3">CAMBIAR ESTADO</div>
            <div className="space-y-2">
              {ESTADOS_FLOW.map(s => (
                <button
                  key={s}
                  onClick={() => !isUsuario && !isCerrada && cambiarEstado(s)}
                  disabled={isUsuario || (isCerrada && s !== "CERRADA")}
                  className={`w-full text-left px-3 py-2.5 rounded text-sm transition-all border ${
                    estado === s
                      ? "bg-amber-400/10 border-amber-400/40 text-amber-400 font-medium"
                      : isUsuario
                        ? "bg-zinc-800/20 border-zinc-800 text-zinc-600 cursor-default"
                        : "bg-zinc-800/40 border-zinc-700/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <span className="mr-2">{estado === s ? "◉" : "○"}</span>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Asignación */}
          {canClassify && !isCerrada && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-zinc-500 text-xs tracking-wide mb-3">ASIGNAR TÉCNICO</div>
              <select
                value={asignado}
                onChange={e => {
                  const nuevo = e.target.value;
                  const anterior = asignado;
                  setAsignado(nuevo);
                  setIncidencias(prev => prev.map(i => i.id === inc.id ? { ...i, asignado: nuevo || null } : i));
                  addToHistorial("ASIGNACION", nuevo
                    ? `Asignada a ${nuevo}${anterior ? ` (antes: ${anterior})` : ""}`
                    : "Asignación eliminada");
                  addToast(nuevo ? `Ticket asignado a ${nuevo}` : "Asignación eliminada");
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60"
              >
                <option value="">Sin asignar</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.nombre}>{t.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Detalles */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-zinc-500 text-xs tracking-wide mb-3">DETALLES</div>
            <dl className="space-y-3">
              {[
                ["ID",         `#${inc.id}`],
                ...(equipoRelacionado ? [["Equipo AF.", `${equipoRelacionado.nombre}`]] : []),
                ["Biblioteca", inc.biblioteca],
                ["Categoría",  inc.categoria],
                ["Asignado",   asignado || "—"],
                ["Creado por", inc.creadoPor],
                ["Fecha",      inc.fecha],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs gap-2">
                  <dt className="text-zinc-500 flex-shrink-0">{k}</dt>
                  <dd className="text-zinc-300 text-right truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Actions */}
          {!isUsuario && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
              <div className="text-zinc-500 text-xs tracking-wide mb-3">ACCIONES</div>
              <Btn variant="secondary" size="sm" className="w-full justify-center" onClick={handleExportTicket}>⬇ Exportar ticket</Btn>
              {user.role === "ADMIN" && (
                <Btn variant="danger" size="sm" className="w-full justify-center" onClick={handleDeleteTicket}>✕ Eliminar incidencia</Btn>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <Modal title="Confirmar eliminación" onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <div className="flex gap-4 items-center bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <span className="text-red-400 text-2xl">⚠️</span>
              <p className="text-zinc-300 text-sm leading-relaxed">
                ¿Está seguro de que desea eliminar permanentemente este ticket (<strong>#{inc.id}</strong>)?<br/>
                <span className="text-red-400 mt-1 inline-block">Esta acción no se puede deshacer y su historial desaparecerá.</span>
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
