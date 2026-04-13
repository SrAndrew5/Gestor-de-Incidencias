import { useState, useMemo, useRef, useEffect } from "react";
import { mockData, BIBLIOTECAS } from "../services/api";
import { Badge, PrioridadBadge, PageHeader, Btn, Modal, Input, Select, EtiquetaBadge, TagInput } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";

const ESTADOS = ["TODOS", "ABIERTA", "EN_PROGRESO", "RESUELTA", "CERRADA"];
const PRIORIDADES = ["TODAS", "SIN_CLASIFICAR", "CRITICA", "ALTA", "MEDIA", "BAJA"];
const CATEGORIAS = ["TODAS", "HARDWARE", "SOFTWARE", "RED", "AV", "SEGURIDAD"];

function exportCSV(data, addToast) {
  const headers = ["ID", "Título", "Estado", "Prioridad", "Categoría", "Asignado", "Fecha", "Biblioteca", "CreadoPor", "Etiquetas"];
  const rows = data.map(i => [
    i.id, i.titulo, i.estado, i.prioridad || "SIN_CLASIFICAR", i.categoria,
    i.asignado || "Sin asignar", i.fecha, i.biblioteca, i.creadoPor,
    (i.etiquetas || []).join("|"),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `incidencias_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
  if (addToast) addToast("Exportación de incidencias completada", "success");
}

function parseImportCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.replace(/"/g, "").trim().toLowerCase());
  return lines.slice(1).map((line, i) => {
    const cols = line.split(sep).map(c => c.replace(/^"|"$/g, "").trim());
    const obj = {}; headers.forEach((h, idx) => { obj[h] = cols[idx] || ""; });
    return {
      id: Date.now() + i,
      titulo: obj.título || obj.titulo || obj.title || `Incidencia importada ${i + 1}`,
      estado: (obj.estado || "ABIERTA").toUpperCase(),
      prioridad: obj.prioridad ? obj.prioridad.toUpperCase() : null,
      categoria: (obj.categoría || obj.categoria || "HARDWARE").toUpperCase(),
      asignado: obj.asignado || null,
      fecha: obj.fecha || new Date().toISOString().slice(0, 10),
      biblioteca: obj.biblioteca || BIBLIOTECAS[0],
      creadoPor: obj.creadopor || obj["creado por"] || "Importado",
      creadoPorId: 0,
      equipoId: null,
      etiquetas: obj.etiquetas ? obj.etiquetas.split("|") : [],
    };
  });
}

// Badge for unclassified priority — shown in the table
function SinClasificarBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-dashed border-zinc-600 text-zinc-500 bg-zinc-800/40 animate-pulse">
      ○ Sin clasificar
    </span>
  );
}

export default function Incidencias({ navigate, plantillaActiva = null, onPlantillaUsada = null }) {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const isTecnico = user.role === "TECNICO";
  const isUsuario = user.role === "USUARIO";
  const canSetPriority = isAdmin || isTecnico;

  const { addToast } = useToast();
  const { inventario: equipos, incidencias, setIncidencias: setInc } = useData();
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [prioridad, setPrio] = useState("TODAS");
  const [categoria, setCat] = useState("TODAS");
  const [tagFilter, setTagF] = useState("");
  const [biblioFilter, setBibF] = useState("TODAS");
  const [showModal, setShowModal] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef();

  const userBiblioteca = mockData.usuarios.find(u => u.id === user.id)?.biblioteca || BIBLIOTECAS[0];
  const baseInc = isUsuario ? incidencias.filter(i => i.creadoPorId === user.id) : incidencias;
  const equiposDisponibles = isUsuario ? equipos.filter(eq => eq.biblioteca === userBiblioteca) : equipos;
  const allTags = [...new Set(baseInc.flatMap(i => i.etiquetas || []))];
  const sinClasificarCount = baseInc.filter(i => !i.prioridad).length;

  // Al llegar de Plantillas con una plantilla preseleccionada, se abre el modal automáticamente
  const [plantillaUsada, setPlantillaUsada] = useState(null);

  const filtered = useMemo(() => baseInc.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !search || i.titulo.toLowerCase().includes(q) || i.biblioteca.toLowerCase().includes(q) || i.creadoPor.toLowerCase().includes(q);
    const matchEstado = estado === "TODOS" || i.estado === estado;
    const matchPrio = prioridad === "TODAS"
      ? true
      : prioridad === "SIN_CLASIFICAR"
        ? !i.prioridad
        : i.prioridad === prioridad;
    const matchCat = categoria === "TODAS" || i.categoria === categoria;
    const matchTag = !tagFilter || (i.etiquetas || []).includes(tagFilter);
    const matchBiblio = biblioFilter === "TODAS" || i.biblioteca === biblioFilter;
    return matchSearch && matchEstado && matchPrio && matchCat && matchTag && matchBiblio;
  }), [baseInc, search, estado, prioridad, categoria, tagFilter, biblioFilter]);

  // Modal para nueva incidencia — campo de prioridad oculto para USUARIO
  const emptyForm = {
    titulo: "", descripcion: "", categoria: "HARDWARE",
    biblioteca: isUsuario ? userBiblioteca : BIBLIOTECAS[0],
    equipoId: "", etiquetas: [], prioridad: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (plantillaActiva) {
      setForm({
        titulo: plantillaActiva.titulo || "",
        descripcion: plantillaActiva.descripcion || "",
        categoria: plantillaActiva.categoria || "HARDWARE",
        biblioteca: isUsuario ? userBiblioteca : BIBLIOTECAS[0],
        equipoId: "",
        etiquetas: [],
        prioridad: "",
      });
      setPlantillaUsada(plantillaActiva.plantillaNombre);
      setShowModal(true);
    }
  }, [plantillaActiva, isUsuario, userBiblioteca]);

  const closeModal = () => {
    setShowModal(false);
    setPlantillaUsada(null);
    if (onPlantillaUsada) onPlantillaUsada();
  };

  const handleCreate = () => {
    const equipo = equiposDisponibles.find(e => e.id === parseInt(form.equipoId));
    const item = {
      ...form,
      id: Date.now(),
      estado: "ABIERTA",
      asignado: null,
      fecha: new Date().toISOString().slice(0, 10),
      creadoPor: user.nombre || user.username,
      creadoPorId: user.id,
      equipoId: equipo ? equipo.id : null,
      biblioteca: isUsuario ? userBiblioteca : form.biblioteca,
      prioridad: canSetPriority && form.prioridad ? form.prioridad : null,
    };
    setInc(prev => [item, ...prev]);
    closeModal();
    setForm(emptyForm);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseImportCSV(ev.target.result);
        if (!parsed.length) { setImportError("Sin datos válidos."); addToast("Error: Fichero sin formato válido", "error"); return; }
        setInc(prev => [...parsed, ...prev]);
        addToast(`${parsed.length} incidencias importadas con éxito.`, "success");
      } catch (err) { setImportError("Error: " + err.message); addToast("Excepción tratando de procesar el archivo CSV", "error"); }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const clearFilters = () => { setEstado("TODOS"); setPrio("TODAS"); setCat("TODAS"); setSearch(""); setTagF(""); setBibF("TODAS"); };
  const hasFilters = estado !== "TODOS" || prioridad !== "TODAS" || categoria !== "TODAS" || search || tagFilter || biblioFilter !== "TODAS";

  const allPlaceholdersKeys = showModal ? [...(form.titulo || "").matchAll(/\[(.*?)\]/g), ...(form.descripcion || "").matchAll(/\[(.*?)\]/g)].map(m => m[0]) : [];

  return (
    <div className="p-8" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <PageHeader
        title={isUsuario ? "Mis Incidencias" : "Incidencias"}
        subtitle={`${filtered.length} incidencias${isUsuario ? " creadas por ti" : ""}${sinClasificarCount > 0 && !isUsuario ? ` · ${sinClasificarCount} sin clasificar` : ""}`}
        actions={
          <>
            {!isUsuario && <Btn variant="secondary" onClick={() => exportCSV(filtered, addToast)} size="sm">⬇ Exportar CSV</Btn>}
            {isAdmin && (
              <>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
                <Btn variant="secondary" onClick={() => fileRef.current.click()} size="sm">⬆ Importar</Btn>
              </>
            )}
            <Btn onClick={() => setShowModal(true)}>+ Nueva incidencia</Btn>
          </>
        }
      />

      {importError && (
        <div className="mb-4 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-xs">{importError}</div>
      )}

      {/* Alert banner for tecnico/admin when there are unclassified tickets */}
      {!isUsuario && sinClasificarCount > 0 && (
        <div
          className="mb-5 flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 cursor-pointer hover:bg-zinc-800 transition-colors"
          onClick={() => setPrio("SIN_CLASIFICAR")}
        >
          <span className="text-amber-400 text-base">◐</span>
          <span className="text-zinc-300 text-sm flex-1">
            <span className="font-bold text-amber-400">{sinClasificarCount}</span> incidencia{sinClasificarCount !== 1 ? "s" : ""} sin clasificar esperan tu revisión de prioridad
          </span>
          <span className="text-amber-400 text-xs font-medium">Ver ahora →</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar incidencia, biblioteca, creador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400/60"
          />
          {!isUsuario && (
            <select value={biblioFilter} onChange={e => setBibF(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60">
              <option value="TODAS">Todas las bibliotecas</option>
              {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
            </select>
          )}
          <select value={estado} onChange={e => setEstado(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60">
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={prioridad} onChange={e => setPrio(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60">
            {PRIORIDADES.map(p => (
              <option key={p} value={p}>
                {p === "SIN_CLASIFICAR" ? `Sin clasificar${sinClasificarCount > 0 ? ` (${sinClasificarCount})` : ""}` : p}
              </option>
            ))}
          </select>
          <select value={categoria} onChange={e => setCat(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60">
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            <span className="text-zinc-600 text-xs">Etiqueta:</span>
            <button onClick={() => setTagF("")} className={`text-xs px-2 py-0.5 rounded ${!tagFilter ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}>todas</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setTagF(tagFilter === tag ? "" : tag)} className={tagFilter === tag ? "ring-1 ring-amber-400/50 rounded-full" : ""}>
                <EtiquetaBadge tag={tag} />
              </button>
            ))}
          </div>
        )}

        {hasFilters && (
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
            <span className="text-zinc-600 text-xs">Activos:</span>
            {[estado !== "TODOS" && estado, prioridad !== "TODAS" && prioridad, categoria !== "TODAS" && categoria, tagFilter && `#${tagFilter}`].filter(Boolean).map(f => (
              <span key={f} className="bg-amber-400/10 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-400/20">{f}</span>
            ))}
            <button onClick={clearFilters} className="text-zinc-500 hover:text-zinc-300 text-xs ml-auto">Limpiar ✕</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["#", "TÍTULO", "CAT.", "ETIQUETAS", "PRIORIDAD", "ESTADO", "ASIGNADO", "FECHA"].map(h => (
                  <th key={h} className="text-left text-zinc-500 text-xs tracking-wide px-4 py-3 font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center text-zinc-600 py-16 text-sm">Sin incidencias{hasFilters ? " con estos filtros" : ""}</td></tr>
              )}
              {filtered.map(inc => {
                const sinClasificar = !inc.prioridad;
                return (
                  <tr
                    key={inc.id}
                    onClick={() => navigate("detalle", inc.id)}
                    className={`
                      transition-all cursor-pointer group
                      ${sinClasificar
                        ? "bg-amber-400/[0.03] border-l-2 border-l-amber-400/40 hover:bg-amber-400/[0.07]"
                        : "hover:bg-zinc-800/50 border-l-2 border-l-transparent"
                      }
                    `}
                  >
                    <td className="px-4 py-3.5 text-zinc-600 text-xs font-mono">#{inc.id}</td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex items-center gap-2">
                        {sinClasificar && (
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Sin clasificar" />
                        )}
                        <div className="min-w-0">
                          <div className={`font-medium truncate ${sinClasificar ? "text-white" : "text-zinc-200"}`}>{inc.titulo}</div>
                          <div className="text-zinc-600 text-xs mt-0.5 truncate">{inc.biblioteca} · {inc.creadoPor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{inc.categoria}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(inc.etiquetas || []).slice(0, 2).map(t => <EtiquetaBadge key={t} tag={t} />)}
                        {(inc.etiquetas || []).length > 2 && <span className="text-zinc-600 text-xs">+{inc.etiquetas.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {sinClasificar ? <SinClasificarBadge /> : <PrioridadBadge prioridad={inc.prioridad} />}
                    </td>
                    <td className="px-4 py-3.5"><Badge estado={inc.estado} /></td>
                    <td className="px-4 py-3.5 text-zinc-400 text-xs">{inc.asignado || <span className="text-zinc-600">—</span>}</td>
                    <td className="px-4 py-3.5 text-zinc-500 text-xs whitespace-nowrap">{inc.fecha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 text-zinc-600 text-xs">
          {filtered.length} resultados · {baseInc.filter(i => i.estado === "ABIERTA").length} abiertas · {baseInc.filter(i => i.estado === "EN_PROGRESO").length} en progreso
          {sinClasificarCount > 0 && !isUsuario && (
            <span className="ml-2 text-amber-400/60">· {sinClasificarCount} sin clasificar</span>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <Modal title="Nueva incidencia" onClose={closeModal} wide>
          <div className="space-y-4">
            {/* Plantilla origin banner */}
            {plantillaUsada && (
              <div className="flex items-center gap-3 bg-amber-400/5 border border-amber-400/20 rounded-lg px-4 py-2.5">
                <span className="text-amber-400 text-sm">▤</span>
                <div className="flex-1 text-xs text-zinc-400">
                  Formulario pre-rellenado desde la plantilla <span className="text-amber-400 font-medium">"{plantillaUsada}"</span>
                </div>
                <button onClick={() => setPlantillaUsada(null)} className="text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
              </div>
            )}

            {allPlaceholdersKeys.length > 0 && (
              <div className="bg-amber-400/10 border border-amber-400/40 rounded p-3 text-xs mb-2">
                <div className="text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                  <span className="animate-pulse">⚠</span>
                  Quedan campos de la plantilla por rellenar en el título o descripción:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allPlaceholdersKeys.map((p, i) => (
                    <span key={i} className="bg-amber-400/20 text-amber-500 px-2 py-0.5 rounded border border-amber-400/30 font-medium tracking-wide">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Input
              label="TÍTULO *"
              value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              placeholder="Describe brevemente el problema..."
            />
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5">DESCRIPCIÓN</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Detalla el problema, cuándo ocurre, qué estabas haciendo..."
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400/60 resize-none"
              />
            </div>

            <div className={`grid gap-4 ${canSetPriority ? "grid-cols-2" : "grid-cols-1"}`}>
              <Select label="CATEGORÍA" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value, equipoId: "" }))}>
                {["HARDWARE", "SOFTWARE", "RED", "AV", "SEGURIDAD"].map(c => <option key={c}>{c}</option>)}
              </Select>
              {["HARDWARE", "RED", "AV"].includes(form.categoria) && (
                <Select label="EQUIPO AFECTADO" value={form.equipoId} onChange={e => setForm(p => ({ ...p, equipoId: parseInt(e.target.value) || "" }))}>
                  <option value="">No listado / No aplica</option>
                  {equiposDisponibles.filter(e => e.biblioteca === form.biblioteca && e.estado !== "BAJA").map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} ({e.serie || "Sin serie"})</option>
                  ))}
                </Select>
              )}
              {/* Solo ADMIN y TECNICO ven prioridad — USUARIO nunca ve las incidencias */}
              {canSetPriority && (
                <Select label="PRIORIDAD (opcional)" value={form.prioridad} onChange={e => setForm(p => ({ ...p, prioridad: e.target.value }))}>
                  <option value="">— Asignar después</option>
                  {["BAJA", "MEDIA", "ALTA", "CRITICA"].map(p => <option key={p}>{p}</option>)}
                </Select>
              )}
            </div>

            {/* Info notice for users */}
            {isUsuario && (
              <div className="flex items-start gap-2 bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-4 py-3 text-xs text-zinc-500">
                <span className="text-zinc-500 mt-0.5">ℹ</span>
                <span>El técnico asignará la prioridad tras revisar tu incidencia.</span>
              </div>
            )}

            {/* Biblioteca */}
            {isUsuario ? (
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded px-3 py-2.5 flex items-center justify-between">
                <span className="text-zinc-500 text-xs">BIBLIOTECA</span>
                <span className="text-zinc-300 text-sm font-medium">{userBiblioteca}</span>
              </div>
            ) : (
              <Select label="BIBLIOTECA *" value={form.biblioteca} onChange={e => setForm(p => ({ ...p, biblioteca: e.target.value }))}>
                {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
              </Select>
            )}

            {/* Equipo */}
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5">EQUIPO RELACIONADO (opcional)</label>
              <select
                value={form.equipoId}
                onChange={e => setForm(p => ({ ...p, equipoId: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60"
              >
                <option value="">Sin equipo específico</option>
                {equiposDisponibles.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nombre} — {eq.sala} ({eq.biblioteca})</option>
                ))}
              </select>
              {isUsuario && <div className="text-zinc-600 text-xs mt-1">Solo se muestran equipos de {userBiblioteca}</div>}
            </div>

            {/* Etiquetas */}
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5">ETIQUETAS</label>
              <TagInput
                value={form.etiquetas}
                onChange={tags => setForm(p => ({ ...p, etiquetas: tags }))}
                suggestions={mockData.etiquetasGlobales}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Btn onClick={handleCreate} disabled={!form.titulo || allPlaceholdersKeys.length > 0}>
                {allPlaceholdersKeys.length > 0 ? "Rellena los corchetes vacíos" : "Crear incidencia"}
              </Btn>
              <Btn variant="secondary" onClick={closeModal}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
