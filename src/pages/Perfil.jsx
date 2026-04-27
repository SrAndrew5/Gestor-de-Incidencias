import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageHeader, Btn, Input } from "../components/UI";
import { Shield, Key, CheckCircle } from "lucide-react";

export default function Perfil() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      addToast("Las contraseñas nuevas no coinciden", "error");
      return;
    }
    setIsUpdating(true);
    // Simula llamada al backend
    setTimeout(() => {
      setIsUpdating(false);
      setPasswords({ current: "", new: "", confirm: "" });
      addToast("Contraseña actualizada con éxito", "success");
    }, 800);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Mi Perfil"
        subtitle="Gestiona tu cuenta y seguridad"
      />

      <div className="grid md:grid-cols-2 gap-8">
        {/* PANEL DE INFORMACIÓN Y PERMISOS */}
        <div className="space-y-6">
          <div className="bg-card border border-edge rounded-xl p-6">
            <h3 className="text-ink font-bold text-lg mb-4 flex items-center gap-2">
              <Shield size={20} className="text-amber-500" />
              Datos y Permisos Activos
            </h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <div className="text-ink3 text-xs uppercase tracking-wide">Nombre completo</div>
                <div className="text-ink font-medium">{user.nombre} ({user.username})</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-ink3 text-xs uppercase tracking-wide">Rol actual</div>
                  <div className="text-ink font-medium bg-well inline-block px-2 py-1 rounded mt-1">{user.role}</div>
                </div>
                <div>
                  <div className="text-ink3 text-xs uppercase tracking-wide">Biblioteca</div>
                  <div className="text-ink font-medium mt-1">{user.biblioteca}</div>
                </div>
              </div>
            </div>

            <div className="border-t border-edge pt-4">
              <div className="text-ink3 text-xs uppercase tracking-wide mb-3">Capabilities (Permisos)</div>
              <div className="flex flex-wrap gap-2">
                {user.permissions?.map(perm => (
                  <span key={perm} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400">
                    <CheckCircle size={12} />
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DE CAMBIO DE CONTRASEÑA */}
        <div>
          <div className="bg-card border border-edge rounded-xl p-6">
            <h3 className="text-ink font-bold text-lg mb-4 flex items-center gap-2">
              <Key size={20} className="text-ink2" />
              Cambiar Contraseña
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                type="password"
                label="CONTRASEÑA ACTUAL"
                required
                value={passwords.current}
                onChange={e => setPasswords({...passwords, current: e.target.value})}
              />
              <div className="h-px bg-edge my-4"></div>
              <Input
                type="password"
                label="NUEVA CONTRASEÑA"
                required
                value={passwords.new}
                onChange={e => setPasswords({...passwords, new: e.target.value})}
              />
              <Input
                type="password"
                label="CONFIRMAR NUEVA CONTRASEÑA"
                required
                value={passwords.confirm}
                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              />
              <div className="pt-2">
                <Btn type="submit" loading={isUpdating} className="w-full justify-center">
                  {isUpdating ? "Actualizando..." : "Actualizar seguridad"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
