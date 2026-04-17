import { useState } from "react";
import { mockData } from "../services/api";
import { PageHeader, Btn, Modal, Input, Select } from "../components/UI";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const catColor = {
  HARDWARE:  "bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20",
  SOFTWARE:  "bg-sky-200 text-sky-800 border-sky-300 dark:bg-sky-400/10 dark:text-sky-400 dark:border-sky-400/20",
  RED:       "bg-emerald-200 text-emerald-800 border-emerald-300 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20",
  AV:        "bg-violet-200 text-violet-800 border-violet-300 dark:bg-violet-400/10 dark:text-violet-400 dark:border-violet-400/20",
  SEGURIDAD: "bg-red-200 text-red-800 border-red-300 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20",
};

const defaultTitulos = {
  HARDWARE:  "Avería en equipo de hardware",
  SOFTWARE:  "Problema con aplicación o sistema",
  RED:       "Fallo de conectividad o red",
  AV:        "Incidencia en equipamiento audiovisual",
  SEGURIDAD: "Incidencia de seguridad o control de acceso",
};

function renderWithPlaceholders(text) {
  if (!text) return null;
  return text.split(/(\[[^[\]]+\])/g).map((part, i) =>
    part.startsWith("[") && part.endsWith("]")
      ? <span key={i} className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/30 px-1 rounded animate-pulse whitespace-pre-wrap">{part}</span>
      : <span key={i} className="whitespace-pre-wrap">{part}</span>
  );
}

export default function Plantillas({ navigate }) {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const { addToast } = useToast();
  const { plantillas, guardarPlantilla, borrarPlantilla, registrarUsoPlantilla } = useData();

  const [showEditor, setShowEditor]   = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editando, setEditando]       = useState(null);
  const [isSaving, setIsSaving]       = useState(false);
  const [form, setForm]               = useState({ nombre: "", categoria: "HARDWARE", descripcion: "" });

  const usarPlantilla = (p) => {
    registrarUsoPlantilla(p.id);
    setShowPreview(null);
    navigate("incidencias", null, { categoria: p.categoria, titulo: defaultTitulos[p.categoria] || "", descripcion: p.descripcion, plantillaNombre: p.nombre });
  };

  const openEdit = (p, e) => {
    e.stopPropagation();
    setEditando(p);
    setForm({ nombre: p.nombre, categoria: p.categoria, descripcion: p.descripcion });
    setShowEditor(true);
  };

  const openNew = () => { setEditando(null); setForm({ nombre: "", categoria: "HARDWARE", descripcion: "" }); setShowEditor(true); };

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plantillas.map(p => (
          <div
            key={p.id}
            onClick={() => setShowPreview(p)}
            className="bg-card border border-edge rounded-lg p-5 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:border-amber-400/40 dark:hover:bg-zinc-800/40 transition-all cursor-pointer group relative"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${catColor[p.categoria] || "bg-well text-ink2 border-edge"}`}>
                {p.categoria}
              </span>
              {isAdmin && (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={e => openEdit(p, e)} title="Editar plantilla" className="text-ink3 hover:text-amber-600 dark:hover:text-amber-400 text-xs p-1.5 bg-well hover:bg-hov rounded transition-colors">✎</button>
                  <button onClick={e => { e.stopPropagation(); setItemToDelete(p); }} title="Eliminar plantilla" className="text-ink3 hover:text-red-600 dark:hover:text-red-400 text-xs p-1.5 bg-well hover:bg-hov rounded transition-colors">✕</button>
                </div>
              )}
            </div>

            <h3 className="text-ink font-bold text-sm mb-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{p.nombre}</h3>
            <p className="text-ink3 text-xs leading-relaxed mb-4 line-clamp-2">{p.descripcion}</p>

            <div className="flex items-center justify-between">
              <div className="text-ink3 text-xs">{p.uso} {p.uso === 1 ? "uso" : "usos"}</div>
              <span className="text-amber-500 dark:text-amber-400/60 text-xs group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Usar →</span>
            </div>

            <div className="mt-3 h-0.5 bg-edge rounded-full overflow-hidden">
              <div className="h-full bg-amber-400/50 rounded-full transition-all" style={{ width: `${Math.min((p.uso / 50) * 100, 100)}%` }} />
            </div>
          </div>
        ))}

        {isAdmin && (
          <button
            onClick={openNew}
            className="border-2 border-dashed border-edge2 rounded-lg p-5 hover:border-ink3 hover:bg-well transition-all flex flex-col items-center justify-center gap-2 min-h-44"
          >
            <span className="text-ink3 text-2xl">+</span>
            <span className="text-ink3 text-xs">Nueva plantilla</span>
          </button>
        )}
      </div>

      {showPreview && (
        <Modal title="Vista previa de plantilla" onClose={() => setShowPreview(null)} wide>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${catColor[showPreview.categoria] || "bg-well text-ink2 border-edge"}`}>{showPreview.categoria}</span>
                  <span className="text-ink3 text-xs">{showPreview.uso} usos</span>
                </div>
                <h2 className="text-ink text-lg font-bold">{showPreview.nombre}</h2>
              </div>
            </div>

            <div className="bg-well border border-edge rounded-lg p-4">
              <div className="text-ink3 text-xs tracking-wide mb-2 font-semibold">DESCRIPCIÓN / CUERPO DE LA PLANTILLA</div>
              <p className="text-ink2 text-sm leading-relaxed">{renderWithPlaceholders(showPreview.descripcion)}</p>
            </div>

            <div className="border border-edge rounded-lg p-4 space-y-3">
              <div className="text-ink3 text-xs tracking-wide font-semibold">ASÍ SE RELLENARÁ EL FORMULARIO</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-well rounded p-3">
                  <div className="text-ink3 mb-1">Título sugerido</div>
                  <div className="text-ink">{defaultTitulos[showPreview.categoria]}</div>
                </div>
                <div className="bg-well rounded p-3">
                  <div className="text-ink3 mb-1">Categoría</div>
                  <div className="text-ink">{showPreview.categoria}</div>
                </div>
              </div>
              <div className="bg-well rounded p-3 text-xs">
                <div className="text-ink3 mb-1">Descripción pre-rellenada</div>
                <div className="text-ink2 leading-relaxed line-clamp-3">{renderWithPlaceholders(showPreview.descripcion)}</div>
              </div>
              <div className="text-ink3 text-xs">Podrás editar todos los campos antes de crear la incidencia.</div>
            </div>

            <div className="flex gap-3 pt-1">
              <Btn onClick={() => usarPlantilla(showPreview)}>Usar esta plantilla →</Btn>
              <Btn variant="secondary" onClick={() => setShowPreview(null)}>Cancelar</Btn>
              {isAdmin && (
                <Btn variant="ghost" size="sm" className="ml-auto" onClick={e => { setShowPreview(null); openEdit(showPreview, { stopPropagation: () => {} }); }}>
                  Editar plantilla
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showEditor && (
        <Modal title={editando ? "Editar plantilla" : "Nueva plantilla"} onClose={() => setShowEditor(false)}>
          <div className="space-y-4">
            <Input label="NOMBRE" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Avería Hardware Estándar..." />
            <Select label="CATEGORÍA" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
              {["HARDWARE", "SOFTWARE", "RED", "AV", "SEGURIDAD"].map(c => <option key={c}>{c}</option>)}
            </Select>
            <div>
              <label className="block text-ink3 text-xs mb-1.5 font-medium">DESCRIPCIÓN / CUERPO</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                rows={5}
                placeholder={`Describe qué incluye esta plantilla.\n\nEjemplo: "El equipo [NOMBRE EQUIPO] falla al encender..."`}
                className="w-full bg-well border border-edge2 rounded px-3 py-2 text-ink text-sm placeholder-ink3 focus:outline-none focus:border-amber-500/60 resize-none"
              />
              <div className="text-ink3 text-xs mt-1">
                Usa corchetes <code className="bg-well px-1 py-0.5 rounded text-amber-600 dark:text-amber-400/80 mx-0.5 font-mono">[ ]</code> para marcar textos rellenables (ej. <span className="text-amber-600 dark:text-amber-400">[UBICACIÓN]</span>).
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Btn onClick={handleSave} disabled={!form.nombre} loading={isSaving}>
                {editando ? (isSaving ? "Guardando..." : "Guardar cambios") : (isSaving ? "Creando..." : "Crear plantilla")}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowEditor(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {itemToDelete && (
        <Modal title="Eliminar plantilla" onClose={() => setItemToDelete(null)}>
          <div className="space-y-4">
            <div className="flex gap-4 items-center bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 p-4 rounded-lg">
              <span className="text-red-500 text-2xl">⚠️</span>
              <p className="text-ink text-sm leading-relaxed">
                ¿Eliminar permanentemente la plantilla <strong>{itemToDelete.nombre}</strong>?
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
