import { useState, useRef } from "react";
import { BIBLIOTECAS } from "../services/api";
import { PageHeader, Btn, Modal, Input, Select, EmptyState } from "../components/UI";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";

const roleColor = {
  ADMIN:   "bg-red-200 text-red-800 border border-red-300 dark:bg-red-400/15 dark:text-red-400 dark:border-red-400/30",
  TECNICO: "bg-amber-200 text-amber-800 border border-amber-300 dark:bg-amber-400/15 dark:text-amber-400 dark:border-amber-400/30",
  USUARIO: "bg-sky-200 text-sky-800 border border-sky-300 dark:bg-sky-400/15 dark:text-sky-400 dark:border-sky-400/30",
};

const EMPTY = { nombre: "", email: "", role: "USUARIO", departamento: "", biblioteca: BIBLIOTECAS[0], activo: true };

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
      id:           crypto.randomUUID(),
      nombre:       obj.nombre || obj.name || `Usuario ${i + 1}`,
      email:        obj.email || "",
      role:         (obj.rol || obj.role || "USUARIO").toUpperCase(),
      departamento: obj.departamento || obj.department || "",
      biblioteca:   obj.biblioteca || BIBLIOTECAS[0],
      activo:       obj.activo !== "No" && obj.activo !== "false" && obj.activo !== "0",
    };
  });
}

export default function GestionUsuarios({ navigate }) {
  const { usuarios, incidencias, guardarUsuario, borrarUsuario, toggleUsuarioActivo, importarUsuarios } = useData();
  const { addToast } = useToast();

  const [search, setSearch]       = useState("");
  const [roleFiltro, setRolF]      = useState("TODOS");
  const [biblioF, setBiblioF]     = useState("TODAS");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [importError, setImportError] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSaving, setIsSaving]   = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pwModal, setPwModal]     = useState(null);
  const [pwForm, setPwForm]       = useState({ nueva: "", confirmar: "" });
  const [pwErrors, setPwErrors]   = useState({});
  const [isSavingPw, setIsSavingPw] = useState(false);
  const fileRef = useRef();

  const incCount = (userId) => (incidencias || []).filter(i => i.creadoPorId === userId).length;

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.email.trim()) e.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Formato de email incorrecto";
    if (!form.biblioteca) e.biblioteca = "Selecciona una sede";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.nueva) e.nueva = "Introduce la nueva contraseña";
    else if (pwForm.nueva.length < 6) e.nueva = "Mínimo 6 caracteres";
    if (!pwForm.confirmar) e.confirmar = "Confirma la contraseña";
    else if (pwForm.nueva !== pwForm.confirmar) e.confirmar = "Las contraseñas no coinciden";
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole    = roleFiltro === "TODOS" || u.role === roleFiltro;
    const matchBiblio = biblioF === "TODAS" || u.biblioteca === biblioF;
    return matchSearch && matchRole && matchBiblio;
  });

  const openEdit = (u) => { setEditando(u); setForm({ ...u }); setErrors({}); setShowModal(true); };
  const openNew  = () => { setEditando(null); setForm(EMPTY); setErrors({}); setShowModal(true); };

  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    setErrors({});
    setTimeout(async () => {
      await guardarUsuario({ ...form, id: editando ? editando.id : null });
      addToast(editando ? `Usuario "${form.nombre}" actualizado` : `Usuario "${form.nombre}" creado`, "success");
      setShowModal(false);
      setIsSaving(false);
    }, 600);
  };

  const handleDelete = (u) => setItemToDelete(u);
  const executeDelete = async () => {
    await borrarUsuario(itemToDelete.id);
    addToast(`Usuario "${itemToDelete.nombre}" eliminado`, "warning");
    setItemToDelete(null);
  };

  const openPwReset = (u) => { setPwModal(u); setPwForm({ nueva: "", confirmar: "" }); setPwErrors({}); };

  const handlePwSave = () => {
    if (!validatePw()) return;
    setIsSavingPw(true);
    setTimeout(async () => {
      await guardarUsuario({ ...pwModal, password: pwForm.nueva });
      addToast(`Contraseña de "${pwModal.nombre}" actualizada`, "success");
      setPwModal(null);
      setIsSavingPw(false);
    }, 600);
  };

  const verIncidencias = (u) => {
    if (navigate) navigate("incidencias", null, null, { search: u.nombre });
  };

  const exportCSV = () => {
    const headers = ["Nombre", "Email", "Rol", "Departamento", "Biblioteca", "Activo"];
    const rows = usuarios.map(u => [u.nombre, u.email, u.role, u.departamento, u.biblioteca, u.activo ? "Sí" : "No"]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "usuarios.csv"; a.click();
    URL.revokeObjectURL(url);
    addToast("Exportación de usuarios completada", "success");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError("");
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTimeout(async () => {
        try {
          const parsed = parseUserCSV(ev.target.result);
          if (!parsed.length) {
            setImportError("No se encontraron datos.");
            addToast("Error: fichero sin datos válidos", "error");
            setIsImporting(false);
            return;
          }
          await importarUsuarios(parsed);
          addToast(`${parsed.length} usuarios importados correctamente`, "success");
        } catch (err) {
          setImportError("Error: " + err.message);
          addToast("Error procesando el archivo CSV", "error");
        }
        setIsImporting(false);
      }, 800);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const selectCls = "bg-well border border-edge2 rounded px-3 py-2 text-ink text-sm focus:outline-none focus:border-amber-500/60";

  return (
    <div className="p-8">
      <PageHeader
        title="Gestión de Usuarios"
        subtitle={`${usuarios.length} usuarios · ${usuarios.filter(u => u.activo).length} activos`}
        actions={
          <>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
            <Btn variant="secondary" onClick={() => fileRef.current.click()} size="sm" loading={isImporting}>
              {isImporting ? "Importando..." : "Importar CSV"}
            </Btn>
            <Btn variant="secondary" onClick={exportCSV} size="sm">Exportar</Btn>
            <Btn onClick={openNew}>+ Nuevo usuario</Btn>
          </>
        }
      />

      {importError && (
        <div className="mb-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/40 rounded-lg px-4 py-3 text-red-700 dark:text-red-400 text-xs">{importError}</div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {["ADMIN", "TECNICO", "USUARIO"].map(rol => (
          <div key={rol} className="bg-card border border-edge rounded-lg p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-2xl font-bold text-ink">{usuarios.filter(u => u.role === rol).length}</div>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold mt-1 ${roleColor[rol]}`}>{rol}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 min-w-48 ${selectCls}`}
        />
        <select value={biblioF} onChange={e => setBiblioF(e.target.value)} className={selectCls}>
          <option value="TODAS">Todas las bibliotecas</option>
          {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
        </select>
        <div className="flex gap-1">
          {["TODOS", "ADMIN", "TECNICO", "USUARIO"].map(r => (
            <button
              key={r}
              onClick={() => setRolF(r)}
              className={`px-3 py-2 rounded text-xs transition-colors ${
                roleFiltro === r
                  ? "bg-amber-200 text-amber-800 border border-amber-300 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/30"
                  : "bg-card border border-edge text-ink2 hover:text-ink hover:bg-well"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-edge rounded-lg overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: "13rem" }} />
            <col style={{ width: "7rem" }} />
            <col style={{ width: "12rem" }} />
            <col style={{ width: "5rem" }} />
            <col style={{ width: "7rem" }} />
            <col style={{ width: "7.5rem" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-edge">
              {["USUARIO", "EMAIL", "ROLE", "BIBLIOTECA", "TICKETS", "ESTADO", ""].map(h => (
                <th key={h} className="text-left text-ink3 text-xs tracking-wide px-3 py-2.5 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="Sin usuarios" icon="👥" message="No hay usuarios registrados con esos criterios de búsqueda." />
                </td>
              </tr>
            )}
            {filtered.map(u => {
              const tickets = incCount(u.id);
              return (
                <tr key={u.id} className={`hover:bg-well transition-colors ${!u.activo ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-well flex items-center justify-center text-ink2 text-xs font-bold flex-shrink-0">
                        {u.nombre[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-ink font-medium text-sm truncate">{u.nombre}</div>
                        {u.departamento && <div className="text-ink3 text-xs truncate">{u.departamento}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-ink2 text-xs truncate" title={u.email}>{u.email}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold ${roleColor[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-3 py-2.5 text-ink2 text-xs truncate" title={u.biblioteca}>{u.biblioteca}</td>
                  <td className="px-3 py-2.5">
                    {tickets > 0 ? (
                      <button
                        onClick={() => verIncidencias(u)}
                        title="Ver incidencias de este usuario"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-slate-200 text-slate-700 hover:bg-amber-200 hover:text-amber-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-amber-400/10 dark:hover:text-amber-400 transition-colors"
                      >
                        {tickets} ticket{tickets !== 1 ? "s" : ""}
                      </button>
                    ) : (
                      <span className="text-ink3 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => toggleUsuarioActivo(u.id)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                        u.activo
                          ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-400"
                          : "bg-well text-ink3"
                      }`}
                    >
                      <span>{u.activo ? "●" : "○"}</span>{u.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} title="Editar usuario" className="p-1.5 rounded text-ink3 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-well transition-colors text-xs">✎</button>
                      <button onClick={() => openPwReset(u)} title="Cambiar contraseña" className="p-1.5 rounded text-ink3 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-well transition-colors text-xs font-bold">🔑</button>
                      <button onClick={() => handleDelete(u)} title="Eliminar usuario" className="p-1.5 rounded text-ink3 hover:text-red-600 dark:hover:text-red-400 hover:bg-well transition-colors text-xs">✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-edge text-ink3 text-xs">{filtered.length} de {usuarios.length} usuarios</div>
      </div>

      {showModal && (
        <Modal title={editando ? "Editar usuario" : "Nuevo usuario"} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="NOMBRE COMPLETO" value={form.nombre} onChange={e => { setForm(p => ({ ...p, nombre: e.target.value })); if (errors.nombre) setErrors(p => ({ ...p, nombre: null })); }} placeholder="Ej: Juan Pérez" required error={errors.nombre} />
            <Input label="EMAIL" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); if (errors.email) setErrors(p => ({ ...p, email: null })); }} placeholder="usuario@biblioteca.es" required error={errors.email} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="ROLE" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="USUARIO">Usuario</option>
                <option value="TECNICO">Técnico</option>
                <option value="ADMIN">Administrador</option>
              </Select>
              <Select label="BIBLIOTECA" value={form.biblioteca} onChange={e => { setForm(p => ({ ...p, biblioteca: e.target.value })); if (errors.biblioteca) setErrors(p => ({ ...p, biblioteca: null })); }} required error={errors.biblioteca}>
                {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
              </Select>
            </div>
            <Input label="DEPARTAMENTO" value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} placeholder="Informática, Sala de lectura..." />
            {!editando && <Input label="CONTRASEÑA TEMPORAL" type="password" placeholder="••••••••" />}
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="accent-amber-400" />
              <span className="text-ink2 text-xs">Usuario activo</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Btn onClick={handleSave} disabled={!form.nombre || !form.email} loading={isSaving}>
                {editando ? (isSaving ? "Guardando..." : "Guardar cambios") : (isSaving ? "Creando..." : "Crear usuario")}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {pwModal && (
        <Modal title="Cambiar contraseña" onClose={() => setPwModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-well border border-edge rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-ink2 text-sm font-bold flex-shrink-0">
                {pwModal.nombre[0]}
              </div>
              <div>
                <div className="text-ink font-medium text-sm">{pwModal.nombre}</div>
                <div className="text-ink3 text-xs">{pwModal.email}</div>
              </div>
            </div>
            <Input
              label="NUEVA CONTRASEÑA"
              type="password"
              value={pwForm.nueva}
              onChange={e => { setPwForm(p => ({ ...p, nueva: e.target.value })); if (pwErrors.nueva) setPwErrors(p => ({ ...p, nueva: null })); }}
              placeholder="Mínimo 6 caracteres"
              required
              error={pwErrors.nueva}
            />
            <Input
              label="CONFIRMAR CONTRASEÑA"
              type="password"
              value={pwForm.confirmar}
              onChange={e => { setPwForm(p => ({ ...p, confirmar: e.target.value })); if (pwErrors.confirmar) setPwErrors(p => ({ ...p, confirmar: null })); }}
              placeholder="Repite la contraseña"
              required
              error={pwErrors.confirmar}
            />
            <div className="flex gap-3 pt-2">
              <Btn onClick={handlePwSave} loading={isSavingPw}>
                {isSavingPw ? "Guardando..." : "Cambiar contraseña"}
              </Btn>
              <Btn variant="secondary" onClick={() => setPwModal(null)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {itemToDelete && (
        <Modal title="Eliminar usuario" onClose={() => setItemToDelete(null)}>
          <div className="space-y-4">
            <div className="flex gap-4 items-center bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 p-4 rounded-lg">
              <span className="text-red-500 text-2xl">⚠️</span>
              <p className="text-ink text-sm leading-relaxed">
                ¿Eliminar al usuario <strong>{itemToDelete.nombre}</strong>?<br />
                <span className="text-red-600 dark:text-red-400 mt-1 inline-block">Esta acción no se puede deshacer.</span>
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Btn variant="secondary" onClick={() => setItemToDelete(null)}>Cancelar</Btn>
              <Btn variant="danger" onClick={executeDelete}>Eliminar usuario</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
