import { useState, useMemo, useRef, useEffect } from "react";
import { mockData, BIBLIOTECAS } from "../services/api";
import { Badge, PrioridadBadge, PageHeader, Btn, Modal, Input, Select, EtiquetaBadge, TagInput, EmptyState, SkeletonIncidencia } from "../components/UI";
import RoleGuard from "../components/RoleGuard";
import { useAuth } from "../context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";

const ESTADOS    = ["TODOS", "ABIERTA", "EN_PROGRESO", "RESUELTA", "CERRADA"];
const PRIORIDADES = ["TODAS", "SIN_CLASIFICAR", "CRITICA", "ALTA", "MEDIA", "BAJA"];
const CATEGORIAS  = ["TODAS", "HARDWARE", "SOFTWARE", "RED", "AV", "SEGURIDAD"];

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
      id: crypto.randomUUID(),
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

function SinClasificarBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-dashed border-amber-400 text-amber-800 bg-amber-100 animate-pulse dark:border-zinc-600 dark:text-zinc-500 dark:bg-zinc-800/40">
      ○ Sin clasificar
    </span>
  );
}

const incidenciaSchema = z.object({
  titulo: z.string()
    .min(5, "El título es muy breve. Por favor, sé un poco más descriptivo (mínimo 5 letras).")
    .max(100, "El título es demasiado largo."),
  descripcion: z.string()
    .min(10, "Describe con algo más de detalle qué está pasando para poder ayudarte mejor (mínimo 10 caracteres)."),
  categoria: z.string().min(1, "Debes seleccionar una categoría."),
  equipoId: z.coerce.number().nullable().optional().or(z.literal("").transform(() => null)),
  prioridad: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  biblioteca: z.string().min(1, "Necesitamos saber a qué biblioteca pertenece esta incidencia."),
  etiquetas: z.array(z.string()).default([]),
});

export default function Incidencias({ navigate, plantillaActiva = null, onPlantillaUsada = null, filtrosIniciales = null }) {
  const { user } = useAuth();
  const isUsuario = user.role === "USUARIO";

  const { addToast } = useToast();
  const { inventario: equipos, incidencias: baseInc, crearIncidencia, importarIncidencias } = useData();

  const [search, setSearch]       = useState(filtrosIniciales?.search || "");
  const [estado, setEstado]       = useState("TODOS");
  const [prioridad, setPrioridad] = useState("TODAS");
  const [categoria, setCategoria] = useState("TODAS");
  const [biblioFilter, setBiblio] = useState(isUsuario ? user.biblioteca : "TODAS");
  const [tagFilter, setTagFilter] = useState("");
  const [equipoFilterId, setEquipoFilterId]       = useState(null);
  const [equipoFilterNombre, setEquipoFilterNombre] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [plantillaNombre, setPlantillaNombre] = useState("");
  
  // Skeleton / Loading Simulation
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [search, estado, prioridad, categoria, biblioFilter, tagFilter, equipoFilterId]);

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(incidenciaSchema),
    defaultValues: {
      titulo: "", categoria: "HARDWARE", prioridad: "", descripcion: "", equipoId: "", etiquetas: [],
      biblioteca: isUsuario ? user.biblioteca : BIBLIOTECAS[0],
    },
    mode: "onBlur"
  });

  const bibliotecaWatch = watch("biblioteca");

  const onCloseModal = () => {
    setShowModal(false);
    reset();
    setPlantillaNombre("");
  };

  useEffect(() => {
    if (plantillaActiva) {
      if (plantillaActiva._equipoId) {
        setEquipoFilterId(plantillaActiva._equipoId);
        setEquipoFilterNombre(plantillaActiva._equipoNombre || "Equipo");
        setBiblio("TODAS");
        if (onPlantillaUsada) onPlantillaUsada();
      } else {
        reset({
          titulo: plantillaActiva.titulo || "",
          categoria: plantillaActiva.categoria || "HARDWARE",
          descripcion: plantillaActiva.descripcion || "",
          prioridad: "",
          equipoId: "",
          etiquetas: [],
          biblioteca: isUsuario ? user.biblioteca : BIBLIOTECAS[0],
        });
        setPlantillaNombre(plantillaActiva.plantillaNombre || "");
        setShowModal(true);
      }
    }
  }, [plantillaActiva, onPlantillaUsada, reset, isUsuario, user?.biblioteca]);

  const clearFilters = () => {
    setSearch(""); setEstado("TODOS"); setPrioridad("TODAS"); setCategoria("TODAS");
    setBiblio(isUsuario ? user.biblioteca : "TODAS"); setTagFilter("");
    setEquipoFilterId(null); setEquipoFilterNombre("");
  };

  const filtered = useMemo(() => {
    return baseInc.filter(i => {
      const q = search.toLowerCase();
      const matchSearch  = !search || i.titulo.toLowerCase().includes(q) || (i.creadoPor || "").toLowerCase().includes(q) || i.biblioteca.toLowerCase().includes(q);
      const matchEstado  = estado === "TODOS" || i.estado === estado;
      const matchPrioridad = prioridad === "TODAS" || (prioridad === "SIN_CLASIFICAR" ? !i.prioridad : i.prioridad === prioridad);
      const matchCate    = categoria === "TODAS" || i.categoria === categoria;
      const matchBiblio  = biblioFilter === "TODAS" || i.biblioteca === biblioFilter;
      const matchTag     = !tagFilter || (i.etiquetas || []).includes(tagFilter);
      const matchEquipo  = !equipoFilterId || i.equipoId === equipoFilterId;
      return matchSearch && matchEstado && matchPrioridad && matchCate && matchBiblio && matchTag && matchEquipo;
    });
  }, [baseInc, search, estado, prioridad, categoria, biblioFilter, tagFilter, equipoFilterId]);

  const onSubmit = async (data) => {
    return new Promise((resolve) => setTimeout(async () => {
      const ticket = {
        ...data,
        id: crypto.randomUUID(),
        creadoPor: user.nombre || user.username,
        creadoPorId: user.id || 1,
        fecha: new Date().toISOString().slice(0, 10),
        estado: "ABIERTA",
        asignado: null,
      };
      await crearIncidencia(ticket);
      onCloseModal();
      if (onPlantillaUsada) onPlantillaUsada();
      addToast("Incidencia creada correctamente", "success");
      resolve();
    }, 600));
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setImportError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTimeout(async () => {
        try {
          const parsed = parseImportCSV(ev.target.result);
          if (parsed.length > 0) {
            await importarIncidencias(parsed);
            addToast(`${parsed.length} incidencias importadas`, "success");
          } else {
            setImportError("El archivo no contiene incidencias válidas.");
          }
        } catch {
          addToast("Error al importar el archivo CSV", "error");
          setImportError("Error de formato en el CSV.");
        }
        setIsImporting(false);
      }, 800);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const hasFilters = estado !== "TODOS" || prioridad !== "TODAS" || categoria !== "TODAS" || search || tagFilter || biblioFilter !== (isUsuario ? user.biblioteca : "TODAS");
  const sinClasificarCount = baseInc.filter(i => !i.prioridad).length;
  const allTags = [...new Set(baseInc.flatMap(i => i.etiquetas || []))];

  const selectCls = "bg-well border border-edge2 rounded px-3 py-2 text-ink text-sm focus:outline-none focus:border-amber-500/60";

  return (
    <div className="p-8">
      <PageHeader
        title={isUsuario ? "Mis Incidencias" : "Gestión de Incidencias"}
        subtitle="Seguimiento y resolución de reportes"
        actions={<>
          <input type="file" id="import-csv" accept=".csv" className="hidden" onChange={handleImport} />
          <RoleGuard allowed={["ADMIN", "TECNICO"]}>
            <Btn variant="secondary" onClick={() => document.getElementById("import-csv").click()} loading={isImporting}>
              {isImporting ? "Importando..." : "Importar CSV"}
            </Btn>
          </RoleGuard>
          <Btn variant="secondary" onClick={() => exportCSV(filtered, addToast)}>Exportar</Btn>
          <Btn onClick={() => { reset(); setShowModal(true); }}>+ Crear incidencia</Btn>
        </>}
      />

      {importError && (
        <div className="mb-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/40 rounded-lg px-4 py-3 text-red-700 dark:text-red-400 text-xs">{importError}</div>
      )}

      <div className="bg-card border border-edge rounded-lg p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar incidencia, biblioteca, creador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`flex-1 min-w-48 ${selectCls}`}
          />
          <RoleGuard allowed={["ADMIN", "TECNICO"]}>
            <select value={biblioFilter} onChange={e => setBiblio(e.target.value)} className={selectCls}>
              <option value="TODAS">Todas las bibliotecas</option>
              {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
            </select>
          </RoleGuard>
          <select value={estado} onChange={e => setEstado(e.target.value)} className={selectCls}>
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className={selectCls}>
            {PRIORIDADES.map(p => (
              <option key={p} value={p}>
                {p === "SIN_CLASIFICAR" ? `Sin clasificar (${sinClasificarCount})` : p}
              </option>
            ))}
          </select>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className={selectCls}>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            <span className="text-ink3 text-xs">Etiqueta:</span>
            <button onClick={() => setTagFilter("")} className={`text-xs px-2 py-0.5 rounded transition-colors ${!tagFilter ? "bg-well text-ink" : "text-ink3 hover:text-ink2"}`}>todas</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}>
                <EtiquetaBadge tag={tag} />
              </button>
            ))}
          </div>
        )}

        {(hasFilters || equipoFilterId) && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-well border border-edge rounded-lg">
            <span className="text-ink3 text-xs">Filtros activos:</span>
            {equipoFilterId && <span className="bg-amber-200 text-amber-800 dark:bg-amber-400/10 dark:text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-300 dark:border-amber-400/20">Equipo: {equipoFilterNombre}</span>}
            {[estado !== "TODOS" && estado, prioridad !== "TODAS" && prioridad, categoria !== "TODAS" && categoria, tagFilter && `#${tagFilter}`].filter(Boolean).map(f => (
              <span key={f} className="bg-amber-200 text-amber-800 dark:bg-amber-400/10 dark:text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-300 dark:border-amber-400/20">{f}</span>
            ))}
            <button onClick={clearFilters} className="text-ink3 hover:text-ink2 text-xs ml-auto transition-colors">Limpiar ✕</button>
          </div>
        )}
      </div>

      <div className="bg-card border border-edge rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm table-fixed">
            <colgroup>
            <col style={{ width: "5rem" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "6rem" }} />
            <col style={{ width: "10rem" }} />
            <col style={{ width: "8rem" }} />
            <col style={{ width: "9rem" }} />
            <col style={{ width: "9rem" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-edge">
              {["#", "TÍTULO / BIBLIOTECA", "CAT.", "ETIQUETAS", "PRIORIDAD", "ESTADO", "ASIGNADO"].map(h => (
                <th key={h} className="text-left text-ink3 text-xs tracking-wide px-3 py-2.5 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonIncidencia key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="Sin incidencias" icon="📋" message="No se han encontrado reportes con los filtros seleccionados o la tabla está vacía." />
                </td>
              </tr>
            ) : (
              filtered.map(inc => (
              <tr
                key={inc.id}
                onClick={() => navigate("detalle", inc.id)}
                className={`cursor-pointer transition-colors border-l-2 ${
                  !inc.prioridad
                    ? "bg-amber-50 dark:bg-amber-400/8 border-l-amber-400 hover:bg-amber-100 dark:hover:bg-amber-400/15"
                    : "hover:bg-well border-l-transparent"
                }`}
              >
                <td className="px-3 py-2.5 text-ink3 font-mono text-xs overflow-hidden">
                  <span title={String(inc.id)}>#{String(inc.id).slice(-5)}</span>
                </td>
                <td className="px-3 py-2.5 min-w-0">
                  <div className="text-ink font-medium truncate">{inc.titulo}</div>
                  <div className="text-ink3 text-xs truncate">{inc.biblioteca} · {inc.creadoPor} · {inc.fecha}</div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-xs bg-well text-ink font-medium px-1.5 py-0.5 rounded border border-edge2">{inc.categoria}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(inc.etiquetas || []).slice(0, 2).map(t => <EtiquetaBadge key={t} tag={t} />)}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {inc.prioridad ? <PrioridadBadge prioridad={inc.prioridad} /> : <SinClasificarBadge />}
                </td>
                <td className="px-3 py-2.5"><Badge estado={inc.estado} /></td>
                <td className="px-3 py-2.5 text-ink2 text-xs truncate">{inc.asignado || "—"}</td>
              </tr>
            )))}
          </tbody>
        </table>
        </div>
        <div className="px-4 py-3 border-t border-edge text-ink3 text-xs">
          {filtered.length} resultados · {baseInc.filter(i => i.estado === "ABIERTA").length} abiertas
        </div>
      </div>

      {showModal && (
        <Modal title="Nueva incidencia" onClose={onCloseModal} wide>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {plantillaNombre && (
              <div className="bg-amber-50 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/20 text-amber-700 dark:text-amber-500 p-3 rounded text-xs flex justify-between items-center">
                <span>Plantilla activa: <strong>{plantillaNombre}</strong></span>
                <button type="button" onClick={() => setPlantillaNombre("")} className="hover:opacity-70">✕</button>
              </div>
            )}
            <Input
              label="TÍTULO"
              placeholder="Ej: El sistema no arranca..."
              required
              error={errors.titulo?.message}
              {...register("titulo")}
            />
            <div>
              <label className="block text-ink3 text-xs font-semibold tracking-wider uppercase mb-1.5">
                DESCRIPCIÓN <span className="text-red-500" aria-label="requerido">*</span>
              </label>
              <textarea
                className={`w-full bg-card border rounded-lg px-3 py-2.5 text-ink text-sm placeholder-ink3 focus:outline-none focus:ring-2 transition-all ${errors.descripcion ? "border-red-400 focus:ring-red-500/30" : "border-edge focus:border-amber-500 focus:ring-amber-500/20"}`}
                rows={4}
                placeholder="Por favor, da tantos detalles como puedas..."
                {...register("descripcion")}
              />
              {errors.descripcion && <p role="alert" className="text-red-600 dark:text-red-400 text-xs font-medium mt-1 animate-in fade-in slide-in-from-top-1">{errors.descripcion.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="CATEGORÍA" error={errors.categoria?.message} {...register("categoria")}>
                {CATEGORIAS.filter(c => c !== "TODAS").map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="EQUIPO AFECTADO" error={errors.equipoId?.message} {...register("equipoId")}>
                <option value="">— Ninguno / General —</option>
                {equipos.filter(eq => eq.biblioteca === bibliotecaWatch).map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                ))}
              </Select>
              <RoleGuard allowed={["ADMIN", "TECNICO"]}>
                <Select label="PRIORIDAD" error={errors.prioridad?.message} {...register("prioridad")}>
                  <option value="">— Sin clasificar</option>
                  {PRIORIDADES.filter(p => p !== "TODAS" && p !== "SIN_CLASIFICAR").map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
              </RoleGuard>
            </div>
            <RoleGuard allowed={["ADMIN", "TECNICO"]}>
              <Select
                label="BIBLIOTECA"
                required
                error={errors.biblioteca?.message}
                {...register("biblioteca")}
              >
                {BIBLIOTECAS.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </RoleGuard>
            <div>
              <label className="block text-ink3 text-xs mb-1.5 font-medium">ETIQUETAS</label>
              <Controller
                name="etiquetas"
                control={control}
                render={({ field }) => (
                  <TagInput value={field.value} onChange={field.onChange} suggestions={mockData.etiquetasGlobales} />
                )}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" loading={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Crear incidencia"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={onCloseModal} disabled={isSubmitting}>Cancelar</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
