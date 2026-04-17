import { useState, useMemo, useRef } from "react";
import { mockData, BIBLIOTECAS } from "../services/api";
import { Badge, PageHeader, Btn, Modal, Input, Select, EtiquetaBadge, TagInput, EstadoEquipo, EmptyState } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";

const TIPOS   = ["TODOS", "ORDENADOR", "PORTÁTIL", "TABLET", "IMPRESORA", "PANTALLA", "RED", "PERIFÉRICO", "AV", "SERVIDOR"];
const ESTADOS = ["TODOS", "OPERATIVO", "AVERIADO", "MANTENIMIENTO", "BAJA"];

const EMPTY_FORM = {
  codigoInventario: "", nombre: "", marca: "", modelo: "",
  tipo: "ORDENADOR", biblioteca: BIBLIOTECAS[0], sala: "", puesto: "",
  estado: "OPERATIVO", serie: "", so: "", ram: "", cpu: "", almacenamiento: "", etiquetas: [],
};

function parseExcelCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.replace(/"/g, "").trim().toLowerCase());
  return lines.slice(1).map((line, i) => {
    const cols = line.split(sep).map(c => c.replace(/^"|"$/g, "").trim());
    const obj = {}; headers.forEach((h, idx) => { obj[h] = cols[idx] || ""; });
    return {
      id: Date.now() + i,
      codigoInventario: obj.codigoinventario || obj.codigo || obj.cod || "",
      nombre:           obj.nombre || obj.name || `Equipo ${i + 1}`,
      marca:            obj.marca || obj.brand || "",
      modelo:           obj.modelo || obj.model || "",
      tipo:             (obj.tipo || obj.type || "ORDENADOR").toUpperCase(),
      biblioteca:       obj.biblioteca || obj.library || BIBLIOTECAS[0],
      sala:             obj.sala || obj.room || "",
      puesto:           obj.puesto || obj.desk || "",
      estado:           (obj.estado || obj.status || "OPERATIVO").toUpperCase(),
      serie:            obj.serie || obj.serial || obj["nº serie"] || "",
      so:               obj.so || obj.os || "",
      ram:              obj.ram || "",
      cpu:              obj.cpu || "",
      almacenamiento:   obj.almacenamiento || obj.storage || "",
      ultima_revision:  new Date().toISOString().slice(0, 10),
      etiquetas:        obj.etiquetas ? obj.etiquetas.split("|") : [],
    };
  });
}

export default function Inventario({ navigate }) {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const { addToast } = useToast();
  const { inventario: items, guardarEquipo, importarEquipos } = useData();

  const [search, setSearch]       = useState("");
  const [tipo, setTipo]           = useState("TODOS");
  const [estado, setEstado]       = useState("TODOS");
  const [biblioFilter, setBiblio] = useState("TODAS");
  const [tagFilter, setTagFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [isSaving, setIsSaving]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState({});
  const [showDetail, setShowDetail] = useState(null);
  const [importError, setImportError] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isImporting, setIsImporting]   = useState(false);
  const fileRef = useRef();

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre del equipo es obligatorio";
    if (!form.codigoInventario.trim() && !form.serie.trim()) e.codigoInventario = "Debes indicar código o número de serie";
    if (!form.biblioteca) e.biblioteca = "Asigna una sede al equipo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const allTags = [...new Set(items.flatMap(i => i.etiquetas || []))];

  const filtered = useMemo(() => items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !search || i.nombre.toLowerCase().includes(q) || i.codigoInventario.toLowerCase().includes(q) || (i.serie || "").toLowerCase().includes(q) || (i.marca || "").toLowerCase().includes(q) || (i.modelo || "").toLowerCase().includes(q);
    const matchTipo   = tipo === "TODOS" || i.tipo === tipo;
    const matchEstado = estado === "TODOS" || i.estado === estado;
    const matchBiblio = biblioFilter === "TODAS" || i.biblioteca === biblioFilter;
    const matchTag    = !tagFilter || (i.etiquetas || []).includes(tagFilter);
    return matchSearch && matchTipo && matchEstado && matchBiblio && matchTag;
  }), [items, search, tipo, estado, biblioFilter, tagFilter]);

  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setErrors({}); setShowModal(true); };
  const openNew  = () => { setEditItem(null); setForm({ ...EMPTY_FORM, biblioteca: user.biblioteca || BIBLIOTECAS[0] }); setErrors({}); setShowModal(true); };

  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    setErrors({});
    setTimeout(async () => {
      await guardarEquipo({ ...form, id: editItem ? editItem.id : null });
      addToast(editItem ? "Equipo actualizado correctamente" : "Equipo añadido al inventario", "success");
      setShowModal(false);
      setIsSaving(false);
    }, 600);
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      await guardarEquipo({ ...itemToDelete, estado: "BAJA" });
      addToast("Protección (Soft-Delete) aplicada a equipo en baja.", "warning");
      setItemToDelete(null);
    }
  };

  const isDuplicate = (incoming, existing) => {
    if (incoming.serie && existing.serie && incoming.serie.trim() === existing.serie.trim()) return true;
    if (incoming.codigoInventario && existing.codigoInventario && incoming.codigoInventario.trim() === existing.codigoInventario.trim()) return true;
    return false;
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseExcelCSV(ev.target.result);
        if (parsed.length === 0) {
          setImportError("No se han podido importar los datos. Asegúrate de que tenga cabeceras correctas.");
          addToast("Error de formato", "error");
          return;
        }
        setIsImporting(true);
        setTimeout(async () => {
          const toAdd = parsed.filter(p => !items.some(i => isDuplicate(p, i)));
          const duplicates = parsed.length - toAdd.length;
          if (toAdd.length > 0) { await importarEquipos(toAdd); addToast(`${toAdd.length} nuevos equipos añadidos.`, "success"); }
          if (duplicates > 0) addToast(`${duplicates} equipos ya existían y se han omitido`, "warning");
          setIsImporting(false);
        }, 800);
      } catch (err) {
        setImportError("Error al leer el archivo: " + err.message);
        addToast("Error grave procesando la importación CSV", "error");
        setIsImporting(false);
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const selectCls = "bg-well border border-edge2 rounded px-3 py-2 text-ink text-sm focus:outline-none focus:border-amber-500/60 transition-colors";

  return (
    <div className="p-8">
      <PageHeader
        title="Inventario de Dispositivos"
        subtitle="Control de hardware y equipamiento bibliotecario"
        actions={<>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          {isAdmin && (
            <Btn variant="secondary" onClick={() => fileRef.current.click()} loading={isImporting}>
              {isImporting ? "Importando..." : "Importar CSV"}
            </Btn>
          )}
          <Btn variant="secondary" onClick={() => addToast("Función de exportación PDF próximamente", "ghost")}>Informe PDF</Btn>
          <Btn onClick={openNew}>+ Añadir equipo</Btn>
        </>}
      />

      {importError && (
        <div className="mb-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/40 rounded-lg px-4 py-3 text-red-700 dark:text-red-400 text-xs">{importError}</div>
      )}

      <div className="bg-card border border-edge rounded-lg p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Buscar por nombre, serie, código..." value={search} onChange={e => setSearch(e.target.value)} className={`flex-1 min-w-48 ${selectCls}`} />
          <select value={biblioFilter} onChange={e => setBiblio(e.target.value)} className={selectCls}>
            <option value="TODAS">Todas las bibliotecas</option>
            {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className={selectCls}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={estado} onChange={e => setEstado(e.target.value)} className={selectCls}>
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-ink3 text-xs mr-2 uppercase tracking-widest font-semibold">Etiqueta:</span>
          <button onClick={() => setTagFilter("")} className={`text-xs px-2 py-0.5 rounded transition-colors ${!tagFilter ? "bg-well text-ink" : "text-ink3 hover:text-ink2"}`}>todas</button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}>
              <EtiquetaBadge tag={tag} />
            </button>
          ))}
          {(search || tipo !== "TODOS" || estado !== "TODOS" || biblioFilter !== "TODAS" || tagFilter) && (
            <button onClick={() => { setSearch(""); setTipo("TODOS"); setEstado("TODOS"); setBiblio("TODAS"); setTagFilter(""); }} className="text-amber-600 dark:text-amber-400/60 hover:text-amber-500 text-xs ml-auto transition-colors">
              Limpiar filtros ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-card border border-edge rounded-lg overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: "3.5rem" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "8rem" }} />
            <col style={{ width: "8rem" }} />
            <col style={{ width: "8rem" }} />
            <col style={{ width: "7rem" }} />
            <col style={{ width: "6rem" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-edge">
              {["#", "EQUIPO / CÓDIGO", "TIPO", "BIBLIOTECA", "ESTADO", "ETIQUETAS", ""].map(h => (
                <th key={h} className="text-left text-ink3 text-xs font-semibold tracking-wide uppercase px-3 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {filtered.length === 0 && (
              <tr><td colSpan={7}><EmptyState title="Inventario vacío" icon="📦" message="No hay equipos registrados o los filtros son demasiado estrictos." /></td></tr>
            )}
            {filtered.map((item, idx) => (
              <tr key={item.id} className="hover:bg-well transition-colors group">
                <td className="px-3 py-2.5 text-ink3 font-mono text-xs">{idx + 1}</td>
                <td className="px-3 py-2.5 min-w-0">
                  <div className="text-ink font-medium truncate">{item.nombre}</div>
                  <div className="text-ink3 text-xs font-mono truncate">{item.codigoInventario || item.serie || "SIN CÓDIGO"}</div>
                </td>
                <td className="px-3 py-2.5 text-ink2 text-xs">{item.tipo}</td>
                <td className="px-3 py-2.5 text-ink2 text-xs truncate" title={item.biblioteca}>{item.biblioteca}</td>
                <td className="px-3 py-2.5"><EstadoEquipo estado={item.estado} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(item.etiquetas || []).slice(0, 2).map(t => <EtiquetaBadge key={t} tag={t} />)}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setShowDetail(item)} title="Ver detalle" className="p-1.5 rounded text-ink3 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-well transition-colors text-xs font-mono">◫</button>
                    <button onClick={() => openEdit(item)} title="Editar" className="p-1.5 rounded text-ink3 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-well transition-colors text-xs font-mono">✎</button>
                    {isAdmin && (
                      <button onClick={() => setItemToDelete(item)} title="Baja" className="p-1.5 rounded text-ink3 hover:text-red-600 dark:hover:text-red-400 hover:bg-well transition-colors text-xs font-mono">✕</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetail && (
        <Modal title={showDetail.nombre} onClose={() => setShowDetail(null)} wide>
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ["CÓD. INVENTARIO", showDetail.codigoInventario || "—"],
                ["Nº SERIE",        showDetail.serie || "—"],
                ["MARCA",           showDetail.marca || "—"],
                ["MODELO",          showDetail.modelo || "—"],
                ["BIBLIOTECA",      showDetail.biblioteca],
                ["SALA / PUESTO",   `${showDetail.sala || "—"} / ${showDetail.puesto || "—"}`],
                ["ÚLTIMA REVISIÓN", showDetail.ultima_revision],
              ].map(([k, v]) => (
                <div key={k} className="bg-well border border-edge rounded p-3">
                  <div className="text-ink3 text-xs font-semibold tracking-wide mb-1 uppercase">{k}</div>
                  <div className="text-ink text-sm font-medium">{v}</div>
                </div>
              ))}
            </div>
            {(showDetail.etiquetas || []).length > 0 && (
              <div>
                <div className="text-ink3 text-xs font-semibold tracking-wide mb-2 uppercase">ETIQUETAS DEL EQUIPO</div>
                <div className="flex flex-wrap gap-1">{showDetail.etiquetas.map(t => <EtiquetaBadge key={t} tag={t} />)}</div>
              </div>
            )}
            <div className="flex gap-2 pt-2 border-t border-edge flex-wrap">
              <Btn onClick={() => { setShowDetail(null); navigate("incidencias", null, { _equipoId: showDetail.id, _equipoNombre: showDetail.nombre }); }}>
                Ver incidencias del equipo
              </Btn>
              <Btn variant="secondary" onClick={() => setShowDetail(null)}>Cerrar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal title={editItem ? "Editar Dispositivo" : "Registrar nuevo dispositivo"} onClose={() => setShowModal(false)} wide>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="NOMBRE DEL EQUIPO" value={form.nombre} onChange={e => { setForm(p => ({ ...p, nombre: e.target.value })); if (errors.nombre) setErrors(p => ({ ...p, nombre: null })); }} placeholder="Ej: Dell OptiPlex 7090" required error={errors.nombre} />
              <Input label="CÓDIGO INVENTARIO" value={form.codigoInventario} onChange={e => { setForm(p => ({ ...p, codigoInventario: e.target.value })); if (errors.codigoInventario) setErrors(p => ({ ...p, codigoInventario: null })); }} placeholder="Ej: BCEN-PC-023" error={errors.codigoInventario} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="TIPO" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                {TIPOS.filter(t => t !== "TODOS").map(t => <option key={t}>{t}</option>)}
              </Select>
              <Select label="BIBLIOTECA" value={form.biblioteca} onChange={e => { setForm(p => ({ ...p, biblioteca: e.target.value })); if (errors.biblioteca) setErrors(p => ({ ...p, biblioteca: null })); }} required error={errors.biblioteca}>
                {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="NÚMERO DE SERIE" value={form.serie} onChange={e => setForm(p => ({ ...p, serie: e.target.value }))} placeholder="SN-XXXX-X" />
              <Select label="ESTADO" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                {ESTADOS.filter(s => s !== "TODOS").map(s => <option key={s}>{s}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="MARCA" value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} placeholder="Cisco, Dell, Lenovo..." />
              <Input label="MODELO" value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} placeholder="ThinkCentre M75q..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="SALA" value={form.sala} onChange={e => setForm(p => ({ ...p, sala: e.target.value }))} placeholder="Sala 3, Planta alta..." />
              <Input label="PUESTO / RACK" value={form.puesto} onChange={e => setForm(p => ({ ...p, puesto: e.target.value }))} placeholder="Puesto 03, Rack A2..." />
            </div>
            <div>
              <label className="block text-ink3 text-xs font-semibold tracking-wide uppercase mb-1.5">ETIQUETAS PERSONALIZADAS</label>
              <TagInput value={form.etiquetas} onChange={tags => setForm(p => ({ ...p, etiquetas: tags }))} suggestions={mockData.etiquetasGlobales} />
            </div>
            <div className="flex gap-3 pt-3 border-t border-edge">
              <Btn onClick={handleSave} disabled={!form.nombre || !form.biblioteca} loading={isSaving}>
                {editItem ? (isSaving ? "Guardando..." : "Guardar cambios") : (isSaving ? "Procesando..." : "Registrar equipo")}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {itemToDelete && (
        <Modal title="Confirmar baja del equipo" onClose={() => setItemToDelete(null)}>
          <div className="space-y-4 text-center py-2">
            <div className="text-red-500 text-3xl mb-2">⚠️</div>
            <p className="text-ink text-sm">¿Estás seguro de que deseas dar de baja el equipo <strong>{itemToDelete.nombre}</strong>?</p>
            <p className="text-ink3 text-xs">El equipo pasará a estado BAJA y se conservará su historial por seguridad.</p>
            <div className="flex gap-3 justify-center pt-4">
              <Btn variant="danger" onClick={executeDelete}>Confirmar Baja</Btn>
              <Btn variant="secondary" onClick={() => setItemToDelete(null)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
