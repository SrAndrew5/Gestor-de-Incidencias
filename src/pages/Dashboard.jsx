import { useState, useMemo } from "react";
import { mockData, BIBLIOTECAS } from "../services/api";
import { Badge, PrioridadBadge, StatCard, PageHeader, Btn, EtiquetaBadge } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

function MiniBar({ label, value, max, color = "bg-amber-400" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="text-zinc-400 text-xs w-32 truncate" title={label}>{label}</div>
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-zinc-400 text-xs w-5 text-right">{value}</div>
    </div>
  );
}

export default function Dashboard({ navigate }) {
  const { user } = useAuth();
  const { incidencias: allInc, inventario: allInv } = useData();
  const [biblioFilter, setBiblioFilter] = useState("TODAS");

  const incidencias = useMemo(() =>
    biblioFilter === "TODAS" ? allInc : allInc.filter(i => i.biblioteca === biblioFilter),
    [biblioFilter]
  );
  const inventario = useMemo(() =>
    biblioFilter === "TODAS" ? allInv : allInv.filter(i => i.biblioteca === biblioFilter),
    [biblioFilter]
  );

  // Métricas
  const abiertas    = incidencias.filter(i => i.estado === "ABIERTA").length;
  const enProgreso  = incidencias.filter(i => i.estado === "EN_PROGRESO").length;
  const resueltas   = incidencias.filter(i => i.estado === "RESUELTA").length;
  const criticas    = incidencias.filter(i => i.prioridad === "CRITICA").length;
  const total       = incidencias.length;
  const avgResolucion = mockData.stats.avgResolucion;

  // Biblioteca con más incidencias
  const incByBiblio = BIBLIOTECAS.map(b => ({
    b, count: allInc.filter(i => i.biblioteca === b).length
  })).sort((a, x) => x.count - a.count);
  const maxBiblioCount = incByBiblio[0]?.count || 1;

  // Equipos más problemáticos (equipos con más incidencias asociadas)
  const incByEquipo = allInv.map(eq => {
    const incCount = allInc.filter(i => i.equipoId === eq.id).length;
    return { nombre: eq.nombre, biblioteca: eq.biblioteca, tipo: eq.tipo, incCount };
  }).filter(e => e.incCount > 0).sort((a, b) => b.incCount - a.incCount).slice(0, 5);

  // Distribución por categorías
  const categorias = ["HARDWARE", "SOFTWARE", "RED", "AV", "SEGURIDAD"].map(cat => ({
    label: cat, value: incidencias.filter(i => i.categoria === cat).length
  })).filter(c => c.value > 0);
  const maxCat = Math.max(...categorias.map(c => c.value), 1);
  const catColors = { HARDWARE: "bg-amber-400", SOFTWARE: "bg-sky-400", RED: "bg-emerald-400", AV: "bg-violet-400", SEGURIDAD: "bg-red-400" };

  // Simulación de actividad semanal (Mock)
  const actByDay = [{ d: "L", v: 8 }, { d: "M", v: 14 }, { d: "X", v: 6 }, { d: "J", v: 11 }, { d: "V", v: 9 }, { d: "S", v: 3 }, { d: "D", v: 1 }];
  const maxV = Math.max(...actByDay.map(x => x.v));

  const recientes = incidencias.slice(0, 5);

  return (
    <div className="p-8" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <PageHeader
        title="Dashboard"
        subtitle={`Bienvenido, ${user.nombre || user.username}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs">Filtrar por biblioteca:</span>
            <select
              value={biblioFilter}
              onChange={e => setBiblioFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-400/60"
            >
              <option value="TODAS">Todas</option>
              {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="TOTAL" value={total} />
        <StatCard label="ABIERTAS" value={abiertas} accent />
        <StatCard label="EN PROGRESO" value={enProgreso} />
        <StatCard label="RESUELTAS" value={resueltas} />
        <StatCard label="CRÍTICAS" value={criticas} color="text-red-400" />
        <StatCard label="T. RESOLUCIÓN" value={`${avgResolucion}d`} sub="promedio" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Actividad semanal */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-zinc-500 text-xs tracking-wide mb-4">ACTIVIDAD SEMANAL (ÚLTIMA SEMANA)</div>
          <div className="h-32 -mx-2 -mb-2 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={actByDay}>
                <defs>
                  <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  cursor={{stroke: 'rgba(255,255,255,0.05)', strokeWidth: 40}}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ fill: '#fbbf24', fontWeight: 'bold' }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value) => [value, "Incidencias"]}
                />
                <Area type="monotone" dataKey="v" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10}} dy={5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-zinc-500 text-xs tracking-wide mb-4">POR ESTADO</div>
          <div className="space-y-3">
            {[
              { label: "Abiertas",    value: abiertas,   color: "bg-red-400",     pct: total ? Math.round((abiertas   / total) * 100) : 0 },
              { label: "En Progreso", value: enProgreso, color: "bg-amber-400",   pct: total ? Math.round((enProgreso / total) * 100) : 0 },
              { label: "Resueltas",   value: resueltas,  color: "bg-emerald-400", pct: total ? Math.round((resueltas  / total) * 100) : 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{s.label}</span>
                  <span className="text-zinc-500">{s.value} ({s.pct}%)</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full">
                  <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-zinc-500 text-xs tracking-wide mb-4">POR CATEGORÍA</div>
          <div className="space-y-2.5">
            {categorias.map(c => (
              <MiniBar key={c.label} label={c.label} value={c.value} max={maxCat} color={catColors[c.label]} />
            ))}
            {categorias.length === 0 && <div className="text-zinc-600 text-xs">Sin datos</div>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Biblioteca con más incidencias */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-zinc-500 text-xs tracking-wide mb-4">INCIDENCIAS POR BIBLIOTECA</div>
          <div className="space-y-2.5">
            {incByBiblio.map(({ b, count }, i) => (
              <div key={b} className="flex items-center gap-3">
                {i === 0 && count > 0 && (
                  <span className="text-amber-400 text-xs w-4" title="Más incidencias">▲</span>
                )}
                {i !== 0 && <span className="w-4" />}
                <button
                  onClick={() => setBiblioFilter(b === biblioFilter ? "TODAS" : b)}
                  className={`flex-1 flex items-center gap-2 text-left transition-colors ${biblioFilter === b ? "text-amber-400" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  <span className="text-xs truncate flex-1">{b}</span>
                </button>
                <div className="flex-1 max-w-24 bg-zinc-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${i === 0 ? "bg-red-400" : "bg-zinc-500"}`}
                    style={{ width: `${(count / maxBiblioCount) * 100}%` }}
                  />
                </div>
                <span className="text-zinc-400 text-xs w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipos más problemáticos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-zinc-500 text-xs tracking-wide mb-4">EQUIPOS MÁS PROBLEMÁTICOS</div>
          {incByEquipo.length === 0 ? (
            <div className="text-zinc-600 text-xs">Ningún equipo con incidencias asociadas</div>
          ) : (
            <div className="space-y-3">
              {incByEquipo.map(eq => (
                <div key={eq.nombre} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-300 text-xs font-medium truncate">{eq.nombre}</div>
                    <div className="text-zinc-600 text-xs">{eq.biblioteca}</div>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">{eq.tipo}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${eq.incCount >= 3 ? "bg-red-400/15 text-red-400" : "bg-amber-400/15 text-amber-400"}`}>
                    {eq.incCount} inc.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recientes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="text-zinc-400 text-xs tracking-wide">INCIDENCIAS RECIENTES{biblioFilter !== "TODAS" ? ` — ${biblioFilter}` : ""}</div>
          <button onClick={() => navigate("incidencias")} className="text-amber-400 text-xs hover:text-amber-300">Ver todas →</button>
        </div>
        <div className="divide-y divide-zinc-800">
          {recientes.length === 0 && <div className="py-12 text-center text-zinc-600 text-sm">Sin incidencias</div>}
          {recientes.map(inc => (
            <button
              key={inc.id}
              onClick={() => navigate("detalle", inc.id)}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-zinc-200 text-sm truncate">{inc.titulo}</div>
                <div className="text-zinc-500 text-xs mt-0.5 flex items-center gap-2">
                  <span>{inc.biblioteca}</span>
                  <span>·</span>
                  <span>{inc.fecha}</span>
                  {inc.etiquetas?.length > 0 && (
                    <>
                      <span>·</span>
                      <div className="flex gap-1">
                        {inc.etiquetas.slice(0, 2).map(t => <EtiquetaBadge key={t} tag={t} />)}
                        {inc.etiquetas.length > 2 && <span className="text-zinc-600 text-xs">+{inc.etiquetas.length - 2}</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <PrioridadBadge prioridad={inc.prioridad} />
              <Badge estado={inc.estado} />
              <div className="text-zinc-600 text-sm">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
