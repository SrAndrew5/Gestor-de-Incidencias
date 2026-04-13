import { useState, useRef } from "react";
import { mockData, BIBLIOTECAS } from "../services/api";
import { PageHeader, Btn, Modal, Input, Select } from "../components/UI";

const rolColor = {
  ADMIN:   "bg-red-400/15 text-red-400 border border-red-400/30",
  TECNICO: "bg-amber-400/15 text-amber-400 border border-amber-400/30",
  USUARIO: "bg-sky-400/15 text-sky-400 border border-sky-400/30",
};

const EMPTY = { nombre: "", email: "", rol: "USUARIO", departamento: "", biblioteca: BIBLIOTECAS[0], activo: true };

function parseUserCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.replace(/"/g, "").trim().toLowerCase());
  return lines.slice(1).map((line, i) => {
    const cols = line.split(sep).map(c => c.replace(/^"|"$/g, "").trim());
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx] || ""; });
    return {
      id:          Date.now() + i,
      nombre:      obj.nombre || obj.name || `Usuario ${i + 1}`,
      email:       obj.email || "",
      rol:         (obj.rol || obj.role || "USUARIO").toUpperCase(),
      departamento:obj.departamento || obj.department || "",
      biblioteca:  obj.biblioteca || BIBLIOTECAS[0],
      activo:      obj.activo !== "No" && obj.activo !== "false" && obj.activo !== "0",
    };
  });
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios]  = useState(mockData.usuarios);
  const [search, setSearch]      = useState("");
  const [rolFiltro, setRolF]     = useState("TODOS");
  const [biblioF, setBiblioF]    = useState("TODAS");
  const [showModal, setShowModal]= useState(false);
  const [editando, setEditando]  = useState(null);
  const [form, setForm]          = useState(EMPTY);
  const [importError, setImportError] = useState("");
  const fileRef = useRef();

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRol    = rolFiltro === "TODOS" || u.rol === rolFiltro;
    const matchBiblio = biblioF === "TODAS" || u.biblioteca === biblioF;
    return matchSearch && matchRol && matchBiblio;
  });

  const openEdit = (u) => { setEditando(u); setForm({ ...u }); setShowModal(true); };
  const openNew  = () => { setEditando(null); setForm(EMPTY); setShowModal(true); };

  const handleSave = () => {
    if (editando) setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, ...form } : u));
    else setUsuarios(prev => [...prev, { ...form, id: Date.now() }]);
    setShowModal(false);
  };

  const toggleActivo = (id) => setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u));
  const handleDelete = (id) => { if (confirm("¿Eliminar este usuario?")) setUsuarios(prev => prev.filter(u => u.id !== id)); };

  const exportCSV = () => {
    const headers = ["Nombre", "Email", "Rol", "Departamento", "Biblioteca", "Activo"];
    const rows = usuarios.map(u => [u.nombre, u.email, u.rol, u.departamento, u.biblioteca, u.activo ? "Sí" : "No"]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "usuarios.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseUserCSV(ev.target.result);
        if (!parsed.length) { setImportError("No se encontraron datos."); return; }
        setUsuarios(prev => [...parsed, ...prev]);
        alert(`✓ ${parsed.length} usuarios importados.`);
      } catch (err) { setImportError("Error: " + err.message); }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  return (
    <div className="p-8" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <PageHeader
        title="Gestión de Usuarios"
        subtitle={`${usuarios.length} usuarios · ${usuarios.filter(u => u.activo).length} activos`}
        actions={
          <>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
            <Btn variant="secondary" onClick={() => fileRef.current.click()} size="sm">⬆ Importar CSV</Btn>
            <Btn variant="secondary" onClick={exportCSV} size="sm">⬇ Exportar</Btn>
            <Btn onClick={openNew}>+ Nuevo usuario</Btn>
          </>
        }
      />

      {importError && (
        <div className="mb-4 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-xs">{importError}</div>
      )}

      {/* Role stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {["ADMIN", "TECNICO", "USUARIO"].map(rol => (
          <div key={rol} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-2xl font-bold text-white">{usuarios.filter(u => u.rol === rol).length}</div>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold mt-1 ${rolColor[rol]}`}>{rol}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400/60"
        />
        <select value={biblioF} onChange={e => setBiblioF(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-400/60">
          <option value="TODAS">Todas las bibliotecas</option>
          {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
        </select>
        <div className="flex gap-1">
          {["TODOS", "ADMIN", "TECNICO", "USUARIO"].map(r => (
            <button
              key={r}
              onClick={() => setRolF(r)}
              className={`px-3 py-2 rounded text-xs transition-colors ${rolFiltro === r ? "bg-amber-400/10 text-amber-400 border border-amber-400/30" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["USUARIO", "EMAIL", "ROL", "DEPARTAMENTO", "BIBLIOTECA", "ESTADO", ""].map(h => (
                <th key={h} className="text-left text-zinc-500 text-xs tracking-wide px-4 py-3 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-zinc-600 py-12 text-sm">Sin usuarios</td></tr>}
            {filtered.map(u => (
              <tr key={u.id} className={`hover:bg-zinc-800/30 transition-colors ${!u.activo ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold flex-shrink-0">
                      {u.nombre[0]}
                    </div>
                    <span className="text-zinc-200 font-medium">{u.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${rolColor[u.rol]}`}>{u.rol}</span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{u.departamento}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{u.biblioteca}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActivo(u.id)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors ${u.activo ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-700/40 text-zinc-500"}`}
                  >
                    <span>{u.activo ? "●" : "○"}</span>{u.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-zinc-600 hover:text-amber-400 text-xs transition-colors">editar</button>
                    <button onClick={() => handleDelete(u.id)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-zinc-800 text-zinc-600 text-xs">{filtered.length} de {usuarios.length} usuarios</div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editando ? "Editar usuario" : "Nuevo usuario"} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="NOMBRE COMPLETO *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="María García..." />
            <Input label="EMAIL *" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="usuario@biblioteca.es" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="ROL" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
                {["ADMIN", "TECNICO", "USUARIO"].map(r => <option key={r}>{r}</option>)}
              </Select>
              <Input label="DEPARTAMENTO" value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} placeholder="Informática..." />
            </div>
            {/* BIBLIOTECA: clave para determinar qué equipos ve el usuario */}
            <Select label="BIBLIOTECA ASIGNADA *" value={form.biblioteca} onChange={e => setForm(p => ({ ...p, biblioteca: e.target.value }))}>
              {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
            </Select>
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded p-3 text-xs text-zinc-500">
              La biblioteca asignada determina qué equipos verá el usuario al crear incidencias y en qué biblioteca se registrarán sus tickets.
            </div>
            {!editando && <Input label="CONTRASEÑA TEMPORAL" type="password" placeholder="••••••••" />}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="accent-amber-400" />
              <span className="text-zinc-400 text-xs">Usuario activo</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Btn onClick={handleSave} disabled={!form.nombre || !form.email}>
                {editando ? "Guardar cambios" : "Crear usuario"}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
