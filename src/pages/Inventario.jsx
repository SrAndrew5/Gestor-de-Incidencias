import { useState, useRef } from "react";
import { mockData, BIBLIOTECAS } from "../services/api";
import { EstadoEquipo, PageHeader, Btn, Input, Select, Modal, EtiquetaBadge, TagInput } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";

const TIPOS = ["TODOS", "ORDENADOR", "IMPRESORA", "AV", "RED", "SERVIDOR", "PERIFÉRICO", "MONITOR"];
const ESTADOS = ["TODOS", "OPERATIVO", "AVERIADO", "MANTENIMIENTO", "BAJA"];

const EMPTY_FORM = {
  nombre: "", marca: "", modelo: "", tipo: "ORDENADOR",
  biblioteca: BIBLIOTECAS[0], sala: "", puesto: "",
  estado: "OPERATIVO", serie: "",
  so: "", ram: "", cpu: "", almacenamiento: "",
  etiquetas: [],
};

function parseExcelCSV(text) {
  // Parse CSV-like export from Excel (comma or semicolon separated)
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map((line, i) => {
    const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx] || ""; });
    return {
      id: Date.now() + i,
      nombre: obj.nombre || obj.name || `Equipo importado ${i + 1}`,
      marca: obj.marca || obj.brand || "",
      modelo: obj.modelo || obj.model || "",
      tipo: (obj.tipo || obj.type || "ORDENADOR").toUpperCase(),
      biblioteca: obj.biblioteca || BIBLIOTECAS[0],
      sala: obj.sala || obj.room || "",
      puesto: obj.puesto || obj.desk || "",
      estado: (obj.estado || obj.status || "OPERATIVO").toUpperCase(),
      serie: obj.serie || obj["número de serie"] || obj.serial || "",
      so: obj.so || obj["sistema operativo"] || "",
      ram: obj.ram || "",
      cpu: obj.cpu || obj.procesador || "",
      almacenamiento: obj.almacenamiento || obj.storage || "",
      ultima_revision: obj["ultima_revision"] || obj["última revisión"] || new Date().toISOString().slice(0, 10),
      etiquetas: obj.etiquetas ? obj.etiquetas.split("|") : [],
    };
  });
}

export default function Inventario({ navigate }) {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";

  const { addToast } = useToast();
  const { inventario: items, setInventario: setItems } = useData();
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [estado, setEstado] = useState("TODOS");
  const [biblioFilter, setBiblio] = useState("TODAS");
  const [tagFilter, setTagFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showDetail, setShowDetail] = useState(null);
  const [importError, setImportError] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const fileRef = useRef();

  // Todas las etiquetas conocidas
  const allTags = [...new Set(items.flatMap(i => i.etiquetas || []))];

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !search || i.nombre.toLowerCase().includes(q) || i.serie.toLowerCase().includes(q)
      || (i.marca || "").toLowerCase().includes(q) || i.sala.toLowerCase().includes(q);
    const matchTipo = tipo === "TODOS" || i.tipo === tipo;
    const matchEstado = estado === "TODOS" || i.estado === estado;
    const matchBiblio = biblioFilter === "TODAS" || i.biblioteca === biblioFilter;
    const matchTag = !tagFilter || (i.etiquetas || []).includes(tagFilter);
    return matchSearch && matchTipo && matchEstado && matchBiblio && matchTag;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSave = () => {
    const record = { ...form, ultima_revision: new Date().toISOString().slice(0, 10) };
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...record } : i));
      addToast("Equipo actualizado correctamente", "success");
    } else {
      setItems(prev => [{ ...record, id: Date.now() }, ...prev]);
      addToast("Equipo añadido al inventario", "success");
    }
    setShowModal(false);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
  };

  const executeDelete = () => {
    if (itemToDelete) {
      setItems(prev => prev.map(i => i.id === itemToDelete.id ? { ...i, estado: "BAJA" } : i));
      addToast(`Protección (Soft-Delete) aplicada a equipo en baja.`, "warning");
      setItemToDelete(null);
    }
  };

  // Excel / CSV export

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseExcelCSV(ev.target.result);
        if (parsed.length === 0) { setImportError("No se han podido importar los datos. Asegúrate de que no esté vacío y tenga cabeceras."); addToast("Error de formato", "error"); return; }
        setItems(prev => [...parsed, ...prev]);
        addToast(`${parsed.length} equipos importados correctamente.`, "success");
      } catch (err) {
        setImportError("Error al leer el archivo: " + err.message);
        addToast("Error grave procesando la importación CSV", "error");
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleExportCSV = () => {
    const dataToExport = filtered.length > 0 ? filtered : items;
    if (dataToExport.length === 0) return;
    
    const headers = ["ID", "Nombre", "Marca", "Modelo", "Tipo", "Biblioteca", "Sala", "Puesto", "Estado", "Serie", "SO", "RAM", "CPU", "Almacenamiento", "Ultima Revision", "Etiquetas"];
    
    const rows = dataToExport.map(i => [
      i.id,
      `"${(i.nombre || "").replace(/"/g, '""')}"`,
      `"${(i.marca || "").replace(/"/g, '""')}"`,
      `"${(i.modelo || "").replace(/"/g, '""')}"`,
      `"${(i.tipo || "").replace(/"/g, '""')}"`,
      `"${(i.biblioteca || "").replace(/"/g, '""')}"`,
      `"${(i.sala || "").replace(/"/g, '""')}"`,
      `"${(i.puesto || "").replace(/"/g, '""')}"`,
      `"${(i.estado || "").replace(/"/g, '""')}"`,
      `"${(i.serie || "").replace(/"/g, '""')}"`,
      `"${(i.so || "").replace(/"/g, '""')}"`,
      `"${(i.ram || "").replace(/"/g, '""')}"`,
      `"${(i.cpu || "").replace(/"/g, '""')}"`,
      `"${(i.almacenamiento || "").replace(/"/g, '""')}"`,
      `"${(i.ultima_revision || "").replace(/"/g, '""')}"`,
      `"${(i.etiquetas || []).join("|")}"`
    ].join(";"));
    
    const csvString = headers.join(";") + "\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    addToast(`Exportado inventario a CSV`, "success");
  };

  const statsOp = items.filter(i => i.estado === "OPERATIVO").length;
  const statsAv = items.filter(i => i.estado === "AVERIADO").length;
  const statsMant = items.filter(i => i.estado === "MANTENIMIENTO").length;

  return (
    <div className="p-8" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <PageHeader
        title="Inventario"
        subtitle={`${items.length} equipos registrados`}
        actions={
          <>
            <Btn variant="secondary" onClick={handleExportCSV} size="sm">⬇ Exportar CSV</Btn>
            {isAdmin && (
              <>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
                <Btn variant="secondary" onClick={() => fileRef.current.click()} size="sm">⬆ Importar CSV/Excel</Btn>
              </>
            )}
            <Btn onClick={openAdd}>+ Añadir equipo</Btn>
          </>
        }
      />

      {importError && (
        <div className="mb-4 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-xs">{importError}</div>
      )}

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { count: statsOp, label: "Operativos", color: "bg-emerald-400/10 text-emerald-400" },
          { count: statsAv, label: "Averiados", color: "bg-red-400/10 text-red-400" },
          { count: statsMant, label: "En mantenimiento", color: "bg-amber-400/10 text-amber-400" },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded flex items-center justify-center text-lg ${s.color}`}>●</div>
            <div><div className="text-2xl font-bold text-white">{s.count}</div><div className="text-zinc-500 text-xs">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar nombre, marca, serie, sala..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400/60"
          />
          <select value={biblioFilter} onChange={e => setBiblio(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60">
            <option value="TODAS">Todas las bibliotecas</option>
            {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60">
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={estado} onChange={e => setEstado(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60">
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-zinc-600 text-xs">Etiquetas:</span>
            <button
              onClick={() => setTagFilter("")}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${!tagFilter ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              todas
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}>
                <EtiquetaBadge tag={tag} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["NOMBRE / MODELO", "TIPO", "BIBLIOTECA", "SALA / PUESTO", "SERIE", "ESTADO", "ETIQUETAS", ""].map(h => (
                  <th key={h} className="text-left text-zinc-500 text-xs tracking-wide px-4 py-3 font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center text-zinc-600 py-12 text-sm">Sin resultados</td></tr>
              )}
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="text-zinc-200 font-medium">{item.nombre}</div>
                    {item.marca && <div className="text-zinc-600 text-xs">{item.marca} {item.modelo}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{item.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{item.biblioteca}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{item.sala}{item.puesto ? ` · ${item.puesto}` : ""}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{item.serie}</td>
                  <td className="px-4 py-3"><EstadoEquipo estado={item.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(item.etiquetas || []).map(t => <EtiquetaBadge key={t} tag={t} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setShowDetail(item)} className="text-zinc-500 hover:text-amber-400 text-xs">detalle</button>
                      <button onClick={() => openEdit(item)} className="text-zinc-500 hover:text-amber-400 text-xs">editar</button>
                      {isAdmin && <button onClick={() => handleDelete(item)} className="text-zinc-500 hover:text-red-400 text-xs">✕</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 text-zinc-600 text-xs">{filtered.length} de {items.length} equipos</div>
      </div>

      {/* Detail modal */}
      {showDetail && (
        <Modal title={showDetail.nombre} onClose={() => setShowDetail(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Biblioteca", showDetail.biblioteca],
                ["Sala / Puesto", `${showDetail.sala} · ${showDetail.puesto}`],
                ["Tipo", showDetail.tipo],
                ["Estado", showDetail.estado],
                ["Marca / Modelo", `${showDetail.marca} ${showDetail.modelo}`],
                ["Nº Serie", showDetail.serie],
                ["Sistema Operativo", showDetail.so || "—"],
                ["RAM", showDetail.ram || "—"],
                ["CPU", showDetail.cpu || "—"],
                ["Almacenamiento", showDetail.almacenamiento || "—"],
                ["Última revisión", showDetail.ultima_revision],
              ].map(([k, v]) => (
                <div key={k} className="bg-zinc-800/50 rounded p-3">
                  <div className="text-zinc-500 mb-1">{k}</div>
                  <div className="text-zinc-200 font-medium">{v}</div>
                </div>
              ))}
            </div>
            {(showDetail.etiquetas || []).length > 0 && (
              <div>
                <div className="text-zinc-500 text-xs mb-2">Etiquetas</div>
                <div className="flex flex-wrap gap-1.5">{showDetail.etiquetas.map(t => <EtiquetaBadge key={t} tag={t} />)}</div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Btn size="sm" onClick={() => { setShowDetail(null); navigate("incidencias"); }}>Ver incidencias</Btn>
              <Btn size="sm" variant="secondary" onClick={() => setShowDetail(null)}>Cerrar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <Modal title={editItem ? "Editar equipo" : "Añadir equipo al inventario"} onClose={() => setShowModal(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="NOMBRE DEL EQUIPO *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Dell OptiPlex 7090" />
              <Input label="NÚMERO DE SERIE *" value={form.serie} onChange={e => setForm(p => ({ ...p, serie: e.target.value }))} placeholder="SN-XXXX-X" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="MARCA" value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} placeholder="Dell, HP, Cisco..." />
              <Input label="MODELO" value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} placeholder="OptiPlex 7090" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="TIPO *" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                {TIPOS.filter(t => t !== "TODOS").map(t => <option key={t}>{t}</option>)}
              </Select>
              <Select label="ESTADO *" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                {ESTADOS.filter(s => s !== "TODOS").map(s => <option key={s}>{s}</option>)}
              </Select>
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <div className="text-zinc-400 text-xs mb-3 tracking-wide">UBICACIÓN</div>
              <div className="grid grid-cols-3 gap-4">
                <Select label="BIBLIOTECA *" value={form.biblioteca} onChange={e => setForm(p => ({ ...p, biblioteca: e.target.value }))}>
                  {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
                </Select>
                <Input label="SALA" value={form.sala} onChange={e => setForm(p => ({ ...p, sala: e.target.value }))} placeholder="Sala 1, Planta 2..." />
                <Input label="PUESTO / RACK" value={form.puesto} onChange={e => setForm(p => ({ ...p, puesto: e.target.value }))} placeholder="Puesto 01, U4..." />
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <div className="text-zinc-400 text-xs mb-3 tracking-wide">ESPECIFICACIONES TÉCNICAS (opcional)</div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="SISTEMA OPERATIVO" value={form.so} onChange={e => setForm(p => ({ ...p, so: e.target.value }))} placeholder="Windows 11 Pro..." />
                <Input label="RAM" value={form.ram} onChange={e => setForm(p => ({ ...p, ram: e.target.value }))} placeholder="16 GB" />
                <Input label="CPU / PROCESADOR" value={form.cpu} onChange={e => setForm(p => ({ ...p, cpu: e.target.value }))} placeholder="Intel i5-10500" />
                <Input label="ALMACENAMIENTO" value={form.almacenamiento} onChange={e => setForm(p => ({ ...p, almacenamiento: e.target.value }))} placeholder="SSD 512GB" />
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <div className="text-zinc-400 text-xs mb-2">ETIQUETAS PERSONALIZADAS</div>
              <TagInput
                value={form.etiquetas}
                onChange={tags => setForm(p => ({ ...p, etiquetas: tags }))}
                suggestions={mockData.etiquetasGlobales}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Btn onClick={handleSave} disabled={!form.nombre || !form.serie || !form.biblioteca}>
                {editItem ? "Guardar cambios" : "Añadir equipo"}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {itemToDelete && (
        <Modal title="Dar de baja equipo" onClose={() => setItemToDelete(null)}>
          <div className="space-y-4">
            <div className="flex gap-4 items-center bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
              <span className="text-amber-400 text-2xl">⚠️</span>
              <p className="text-zinc-300 text-sm leading-relaxed">
                ¿Desactivar el equipo <strong>{itemToDelete.nombre}</strong>?<br/>
                <span className="text-amber-400/80 mt-1 inline-block">Pasará a estado 'BAJA' (Soft-delete) para mantener protegido el histórico de incidencias.</span>
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Btn variant="secondary" onClick={() => setItemToDelete(null)}>Cancelar</Btn>
              <Btn onClick={executeDelete}>Confirmar Baja</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
