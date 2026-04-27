import { useState, useMemo, useRef, useEffect } from "react";
import { mockData } from "../services/api";
import { Badge, PrioridadBadge, PageHeader, Btn, Modal, Input, Select, EtiquetaBadge, TagInput, EmptyState, SkeletonIncidencia } from "../components/UI";
import RoleGuard from "../components/RoleGuard";
import { useAuth } from "../context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { procesarTriggers } from "../utils/businessRules";

const ESTADOS    = ["TODOS", "ABIERTA", "EN_PROGRESO", "PENDIENTE_TERCEROS", "RESUELTA", "CERRADA", "REABIERTA"];
const PRIORIDADES = ["TODAS", "SIN_CLASIFICAR", "CRITICA", "ALTA", "MEDIA", "BAJA"];

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

function parseImportCSV(text, ctx) {
  const { bibliotecas, categoriasByCodigo } = ctx;
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.replace(/"/g, "").trim().toLowerCase());
  return lines.slice(1).map((line, i) => {
    const cols = line.split(sep).map(c => c.replace(/^"|"$/g, "").trim());
    const obj = {}; headers.forEach((h, idx) => { obj[h] = cols[idx] || ""; });
    const categoriaCodigo = (obj.categoría || obj.categoria || "HARDWARE").toUpperCase();
    const bibliotecaNombre = obj.biblioteca || "";
    return {
      id: crypto.randomUUID(),
      titulo: obj.título || obj.titulo || obj.title || `Incidencia importada ${i + 1}`,
      estado: (obj.estado || "ABIERTA").toUpperCase(),
      prioridad: obj.prioridad ? obj.prioridad.toUpperCase() : null,
      categoriaId: categoriasByCodigo[categoriaCodigo]?.id ?? 1,
      asignadoId: null,
      fecha: obj.fecha || new Date().toISOString().slice(0, 10),
      bibliotecaId: bibliotecas.find(b => b.nombre === bibliotecaNombre)?.id ?? bibliotecas[0]?.id ?? 1,
      creadoPorId: 0,
      equipoId: null,
      etiquetas: obj.etiquetas ? obj.etiquetas.split("|") : [],
      descripcion: obj.descripcion || "",
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
  categoriaId: z.coerce.number().int().positive("Debes seleccionar una categoría."),
  equipoId: z.coerce.number().int().nullable().optional().or(z.literal("").transform(() => null)),
  urgencia: z.string().min(1, "Selecciona una urgencia"),
  impacto: z.string().min(1, "Selecciona un impacto"),
  bibliotecaId: z.coerce.number().int().positive("Necesitamos saber a qué biblioteca pertenece esta incidencia."),
  etiquetas: z.array(z.string()).default([]),
});

export default function Incidencias({ navigate, plantillaActiva = null, onPlantillaUsada = null, filtrosIniciales = null }) {
  const { user } = useAuth();
  const isUsuario = user.role === "USUARIO";

  const { addToast } = useToast();
  const {
    inventarioView: equipos,
    incidenciasView: baseInc,
    bibliotecas, categorias, categoriasByCodigo,
    crearIncidencia, importarIncidencias,
  } = useData();

  const [search, setSearch]       = useState(filtrosIniciales?.search || "");
  const [estado, setEstado]       = useState("TODOS");
  const [prioridad, setPrioridad] = useState("TODAS");
  // categoriaFilterId / biblioFilterId: null = "Todas", number = id concreto
  const [categoriaFilterId, setCategoriaFilterId] = useState(null);
  const [biblioFilterId, setBiblioFilterId]   = useState(isUsuario ? (user.bibliotecaId ?? null) : null);
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
  }, [search, estado, prioridad, categoriaFilterId, biblioFilterId, tagFilter, equipoFilterId]);

  const defaultBibliotecaId = bibliotecas[0]?.id ?? 1;
  const defaultCategoriaId  = categorias[0]?.id ?? 1;

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(incidenciaSchema),
    defaultValues: {
      titulo: "", categoriaId: defaultCategoriaId, urgencia: "", impacto: "", descripcion: "", equipoId: "", etiquetas: [],
      bibliotecaId: isUsuario ? (user.bibliotecaId ?? defaultBibliotecaId) : defaultBibliotecaId,
    },
    mode: "onBlur"
  });

  const bibliotecaIdWatch = Number(watch("bibliotecaId"));

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
        setBiblioFilterId(null);
        if (onPlantillaUsada) onPlantillaUsada();
      } else {
        const catId = plantillaActiva.categoriaId
          ?? categoriasByCodigo[plantillaActiva.categoria]?.id
          ?? defaultCategoriaId;
        reset({
          titulo: plantillaActiva.titulo || "",
          categoriaId: catId,
          descripcion: plantillaActiva.descripcion || "",
          urgencia: "",
          impacto: "",
          equipoId: "",
          etiquetas: [],
          bibliotecaId: isUsuario ? (user.bibliotecaId ?? defaultBibliotecaId) : defaultBibliotecaId,
        });
        setPlantillaNombre(plantillaActiva.plantillaNombre || "");
        setShowModal(true);
      }
    }
  }, [plantillaActiva, onPlantillaUsada, reset, isUsuario, user?.bibliotecaId, defaultBibliotecaId, defaultCategoriaId, categoriasByCodigo]);

  const clearFilters = () => {
    setSearch(""); setEstado("TODOS"); setPrioridad("TODAS"); setCategoriaFilterId(null);
    setBiblioFilterId(isUsuario ? (user.bibliotecaId ?? null) : null); setTagFilter("");
    setEquipoFilterId(null); setEquipoFilterNombre("");
  };

  const filtered = useMemo(() => {
    return baseInc.filter(i => {
      const q = search.toLowerCase();
      const matchSearch  = !search || i.titulo.toLowerCase().includes(q) || (i.creadoPor || "").toLowerCase().includes(q) || (i.biblioteca || "").toLowerCase().includes(q);
      const matchEstado  = estado === "TODOS" || i.estado === estado;
      const matchPrioridad = prioridad === "TODAS" || (prioridad === "SIN_CLASIFICAR" ? !i.prioridad : i.prioridad === prioridad);
      const matchCate    = !categoriaFilterId || i.categoriaId === categoriaFilterId;
      const matchBiblio  = !biblioFilterId || i.bibliotecaId === biblioFilterId;
      const matchTag     = !tagFilter || (i.etiquetas || []).includes(tagFilter);
      const matchEquipo  = !equipoFilterId || i.equipoId === equipoFilterId;
      return matchSearch && matchEstado && matchPrioridad && matchCate && matchBiblio && matchTag && matchEquipo;
    });
  }, [baseInc, search, estado, prioridad, categoriaFilterId, biblioFilterId, tagFilter, equipoFilterId]);

  const onSubmit = async (data) => {
    return new Promise((resolve) => setTimeout(async () => {
      // El payload solo lleva FKs. El backend (o el hydrator) resuelve nombres.
      const ticket = {
        ...data,
        categoriaId: Number(data.categoriaId),
        bibliotecaId: Number(data.bibliotecaId),
        equipoId: data.equipoId ? Number(data.equipoId) : null,
        id: crypto.randomUUID(),
        creadoPorId: user.id || 1,
        asignadoId: null,
        fecha: new Date().toISOString().slice(0, 10),
        estado: "ABIERTA",
      };
      const itemCreado = await crearIncidencia(ticket);
      onCloseModal();
      if (onPlantillaUsada) onPlantillaUsada();
      addToast("Incidencia creada correctamente", "success");
      
      // Simulador de Triggers del Backend
      procesarTriggers("NUEVA_INCIDENCIA", itemCreado, addToast);
      
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
          const parsed = parseImportCSV(ev.target.result, { bibliotecas, categoriasByCodigo });
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

  const defaultBiblioFilter = isUsuario ? (user.bibliotecaId ?? null) : null;
  const hasFilters = estado !== "TODOS" || prioridad !== "TODAS" || categoriaFilterId !== null || search || tagFilter || biblioFilterId !== defaultBiblioFilter;
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
            <select
              value={biblioFilterId ?? ""}
              onChange={e => setBiblioFilterId(e.target.value ? Number(e.target.value) : null)}
              className={selectCls}
            >
              <option value="">Todas las bibliotecas</option>
              {bibliotecas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
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
          <select
            value={categoriaFilterId ?? ""}
            onChange={e => setCategoriaFilterId(e.target.value ? Number(e.target.value) : null)}
            className={selectCls}
          >
            <option value="">TODAS</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.codigo}</option>)}
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
            {[
              estado !== "TODOS" && estado,
              prioridad !== "TODAS" && prioridad,
              categoriaFilterId && categorias.find(c => c.id === categoriaFilterId)?.codigo,
              tagFilter && `#${tagFilter}`,
            ].filter(Boolean).map(f => (
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
              <Select label="CATEGORÍA" error={errors.categoriaId?.message} {...register("categoriaId")}>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.codigo}</option>)}
              </Select>
              <Select label="EQUIPO AFECTADO" error={errors.equipoId?.message} {...register("equipoId")}>
                <option value="">— Ninguno / General —</option>
                {equipos.filter(eq => eq.bibliotecaId === bibliotecaIdWatch).map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                ))}
              </Select>
              <RoleGuard allowed={["ADMIN", "TECNICO"]}>
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <Select label="URGENCIA" required error={errors.urgencia?.message} {...register("urgencia")}>
                    <option value="">— Seleccionar</option>
                    <option value="ALTA">Alta (Afecta sistema crítico)</option>
                    <option value="MEDIA">Media (Afecta tarea principal)</option>
                    <option value="BAJA">Baja (Puede esperar)</option>
                  </Select>
                  <Select label="IMPACTO" required error={errors.impacto?.message} {...register("impacto")}>
                    <option value="">— Seleccionar</option>
                    <option value="ALTA">Alto (Toda la biblioteca)</option>
                    <option value="MEDIA">Medio (Un grupo/sala)</option>
                    <option value="BAJA">Bajo (Un usuario/equipo)</option>
                  </Select>
                </div>
              </RoleGuard>
            </div>
            <RoleGuard allowed={["ADMIN", "TECNICO"]}>
              <Select
                label="BIBLIOTECA"
                required
                error={errors.bibliotecaId?.message}
                {...register("bibliotecaId")}
              >
                {bibliotecas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
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
