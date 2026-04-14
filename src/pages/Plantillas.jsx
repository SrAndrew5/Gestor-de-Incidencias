import { useState } from "react";
import { mockData } from "../services/api";
import { PageHeader, Btn, Modal, Input, Select } from "../components/UI";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const catColor = {
  HARDWARE: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  SOFTWARE: "bg-sky-400/10 text-sky-400 border-sky-400/20",
  RED: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  AV: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  SEGURIDAD: "bg-red-400/10 text-red-400 border-red-400/20",
};

// Titulos por defecto
const defaultTitulos = {
  HARDWARE: "Avería en equipo de hardware",
  SOFTWARE: "Problema con aplicación o sistema",
  RED: "Fallo de conectividad o red",
  AV: "Incidencia en equipamiento audiovisual",
  SEGURIDAD: "Incidencia de seguridad o control de acceso",
};

// Helper to render placeholders highlighted
function renderWithPlaceholders(text) {
  if (!text) return null;
  const parts = text.split(/(\[[^[\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return <span key={i} className="text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1 rounded animate-pulse whitespace-pre-wrap">{part}</span>;
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });
}

export default function Plantillas({ navigate }) {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const { addToast } = useToast();
  
  const { plantillas, guardarPlantilla, borrarPlantilla, registrarUsoPlantilla } = useData();
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editando, setEditando] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ nombre: "", categoria: "HARDWARE", descripcion: "", camposExtra: [] });

  // Vista Previa
  const openPreview = (p) => setShowPreview(p);
  const closePreview = () => setShowPreview(null);

  const usarPlantilla = (p) => {
    // Incremento de variable local de uso
    registrarUsoPlantilla(p.id);
    closePreview();
    // Navigate to Incidencias carrying the plantilla data to pre-fill the form
    navigate("incidencias", null, {
      categoria: p.categoria,
      titulo: defaultTitulos[p.categoria] || "",
      descripcion: p.descripcion,
      plantillaNombre: p.nombre,
    });
  };

  // Función de edición
  const openEdit = (p, e) => {
    e.stopPropagation();
    setEditando(p);
    setForm({ nombre: p.nombre, categoria: p.categoria, descripcion: p.descripcion });
    setShowEditor(true);
  };

  const openNew = () => {
    setEditando(null);
    setForm({ nombre: "", categoria: "HARDWARE", descripcion: "" });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!form.nombre) return;
    setIsSaving(true);
    setTimeout(async () => {
      await guardarPlantilla({ ...form, id: editando ? editando.id : null });
      addToast(editando ? `Plantilla "${form.nombre}" guardada` : `Nueva plantilla "${form.nombre}" creada`, "success");
      setShowEditor(false);
      setIsSaving(false);
    }, 600);
  };

  const handleDelete = (p, e) => {
    e.stopPropagation();
    setItemToDelete(p);
  };

  const executeDelete = () => {
    if (itemToDelete) {
      setIsSaving(true);
      setTimeout(async () => {
        await borrarPlantilla(itemToDelete.id);
        addToast("Plantilla eliminada permanentemente", "warning");
        setItemToDelete(null);
        setIsSaving(false);
      }, 600);
    }
  };

  const totalUso = plantillas.reduce((a, p) => a + p.uso, 0);

  return (
    <div className="p-8">
      <PageHeader
        title="Plantillas"
        subtitle={`${plantillas.length} plantillas · ${totalUso} usos totales`}
        actions={isAdmin ? <Btn onClick={openNew}>+ Nueva plantilla</Btn> : null}
      />

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plantillas.map(p => (
          <div
            key={p.id}
            onClick={() => openPreview(p)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-amber-400/40 hover:bg-zinc-800/40 transition-all cursor-pointer group relative"
          >
            {/* Category + actions */}
            <div className="flex items-start justify-between mb-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${catColor[p.categoria] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                {p.categoria}
              </span>
              {isAdmin && (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={e => openEdit(p, e)} title="Editar plantilla" className="text-zinc-600 hover:text-amber-400 text-xs p-1.5 bg-zinc-800/60 hover:bg-zinc-800 rounded transition-colors">
                    ✎
                  </button>
                  <button onClick={e => handleDelete(p, e)} title="Eliminar plantilla" className="text-zinc-700 hover:text-red-400 text-xs p-1.5 bg-zinc-800/60 hover:bg-zinc-800 rounded transition-colors">
                    ✕
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-zinc-200 font-bold text-sm mb-2 group-hover:text-white transition-colors">{p.nombre}</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4 line-clamp-2">{p.descripcion}</p>

            <div className="flex items-center justify-between">
              <div className="text-zinc-600 text-xs">{p.uso} {p.uso === 1 ? "uso" : "usos"}</div>
              <span className="text-amber-400/60 text-xs group-hover:text-amber-400 transition-colors">
                Usar →
              </span>
            </div>

            {/* Usage bar */}
            <div className="mt-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400/40 rounded-full transition-all"
                style={{ width: `${Math.min((p.uso / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}

        {/* New card placeholder */}
        {isAdmin && (
          <button
            onClick={openNew}
            className="border-2 border-dashed border-zinc-800 rounded-lg p-5 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all flex flex-col items-center justify-center gap-2 min-h-44"
          >
            <span className="text-zinc-600 text-2xl">+</span>
            <span className="text-zinc-600 text-xs">Nueva plantilla</span>
          </button>
        )}
      </div>

      {/* ── Preview modal ── */}
      {showPreview && (
        <Modal title="Vista previa de plantilla" onClose={closePreview} wide>
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${catColor[showPreview.categoria] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                    {showPreview.categoria}
                  </span>
                  <span className="text-zinc-600 text-xs">{showPreview.uso} usos</span>
                </div>
                <h2 className="text-white text-lg font-bold">{showPreview.nombre}</h2>
              </div>
            </div>

            {/* Descripción / cuerpo de la plantilla */}
            <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-4">
              <div className="text-zinc-500 text-xs tracking-wide mb-2"> DESCRIPCIÓN / CUERPO DE LA PLANTILLA </div>
              <p className="text-zinc-300 text-sm leading-relaxed">{renderWithPlaceholders(showPreview.descripcion)}</p>
            </div>

            {/* Preview of what the form will look like */}
            <div className="border border-zinc-700/60 rounded-lg p-4 space-y-3">
              <div className="text-zinc-500 text-xs tracking-wide">ASÍ SE RELLENARÁ EL FORMULARIO</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-800/40 rounded p-3">
                  <div className="text-zinc-600 mb-1">Título sugerido</div>
                  <div className="text-zinc-300">{defaultTitulos[showPreview.categoria]}</div>
                </div>
                <div className="bg-zinc-800/40 rounded p-3">
                  <div className="text-zinc-600 mb-1">Categoría</div>
                  <div className="text-zinc-300">{showPreview.categoria}</div>
                </div>
              </div>
              <div className="bg-zinc-800/40 rounded p-3 text-xs">
                <div className="text-zinc-600 mb-1">Descripción pre-rellenada</div>
                <div className="text-zinc-400 leading-relaxed line-clamp-3">{renderWithPlaceholders(showPreview.descripcion)}</div>
              </div>
              <div className="text-zinc-600 text-xs">Podrás editar todos los campos antes de crear la incidencia.</div>
            </div>

            <div className="flex gap-3 pt-1">
              <Btn onClick={() => usarPlantilla(showPreview)}>
                Usar esta plantilla →
              </Btn>
              <Btn variant="secondary" onClick={closePreview}>Cancelar</Btn>
              {isAdmin && (
                <Btn variant="ghost" size="sm" className="ml-auto" onClick={e => { closePreview(); openEdit(showPreview, { stopPropagation: () => { } }); }}>
                  Editar plantilla
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Editor modal ──*/}
      {showEditor && (
        <Modal title={editando ? "Editar plantilla" : "Nueva plantilla"} onClose={() => setShowEditor(false)}>
          <div className="space-y-4">
            <Input
              label="NOMBRE"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Avería Hardware Estándar..."
            />
            <Select label="CATEGORÍA" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
              {["HARDWARE", "SOFTWARE", "RED", "AV", "SEGURIDAD"].map(c => <option key={c}>{c}</option>)}
            </Select>
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5">DESCRIPCIÓN / CUERPO</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                rows={5}
                placeholder={`Describe qué incluye esta plantilla y cuándo usarla.\n\nEjemplo: "El equipo [NOMBRE EQUIPO] falla al encender. El usuario [NOMBRE USUARIO] indica que..."`}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400/60 resize-none"
              />
              <div className="text-zinc-600 text-xs mt-1">Usa corchetes <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400/80 mx-0.5">[ ]</code> para marcar textos que se deban rellenar (ej. <span className="text-amber-400">[UBICACIÓN]</span>).</div>
            </div>
            <div className="flex gap-3 pt-2">
              <Btn onClick={handleSave} disabled={!form.nombre} loading={isSaving}>
                {editando ? (isSaving ? "Guardando..." : "Guardar cambios") : (isSaving ? "Crear plantilla" : "Crear plantilla")}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowEditor(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {itemToDelete && (
        <Modal title="Eliminar plantilla" onClose={() => setItemToDelete(null)}>
          <div className="space-y-4">
            <div className="flex gap-4 items-center bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <span className="text-red-400 text-2xl">⚠️</span>
              <p className="text-zinc-300 text-sm leading-relaxed">
                ¿Eliminar permanentemente la plantilla <strong>{itemToDelete.nombre}</strong>?<br/>
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Btn variant="secondary" onClick={() => setItemToDelete(null)}>Cancelar</Btn>
              <Btn variant="danger" onClick={executeDelete} loading={isSaving}>
                {isSaving ? "Eliminando..." : "Eliminar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
