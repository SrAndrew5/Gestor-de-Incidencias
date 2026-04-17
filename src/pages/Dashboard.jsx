import { useState, useMemo } from "react";
import { mockData, BIBLIOTECAS } from "../services/api";
import { Badge, PrioridadBadge, StatCard, PageHeader, Btn, EtiquetaBadge } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

function MiniBar({ label, value, max, color = "bg-amber-400" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="text-ink2 text-xs w-32 truncate" title={label}>{label}</div>
      <div className="flex-1 bg-edge rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-ink2 text-xs w-5 text-right">{value}</div>
    </div>
  );
}

export default function Dashboard({ navigate }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { incidencias: allInc, inventario: allInv } = useData();
  const [biblioFilter, setBiblioFilter] = useState("TODAS");

  const incidencias = useMemo(() =>
    biblioFilter === "TODAS" ? allInc : allInc.filter(i => i.biblioteca === biblioFilter),
    [allInc, biblioFilter]
  );
  const inventario = useMemo(() =>
    biblioFilter === "TODAS" ? allInv : allInv.filter(i => i.biblioteca === biblioFilter),
    [allInv, biblioFilter]
  );

  const abiertas   = incidencias.filter(i => i.estado === "ABIERTA").length;
  const enProgreso = incidencias.filter(i => i.estado === "EN_PROGRESO").length;
  const resueltas  = incidencias.filter(i => i.estado === "RESUELTA").length;
  const criticas   = incidencias.filter(i => i.prioridad === "CRITICA").length;
  const total      = incidencias.length;

  const avgResolucion = useMemo(() => {
    const resueltas = incidencias.filter(i => i.estado === "RESUELTA" || i.estado === "CERRADA");
    if (!resueltas.length) return "—";
    const today = new Date();
    const sum = resueltas.reduce((acc, i) => acc + Math.max(0, (today - new Date(i.fecha)) / (1000 * 60 * 60 * 24)), 0);
    return (sum / resueltas.length).toFixed(1);
  }, [incidencias]);

  const incByBiblio = BIBLIOTECAS.map(b => ({
    b, count: allInc.filter(i => i.biblioteca === b).length
  })).sort((a, x) => x.count - a.count);
  const maxBiblioCount = incByBiblio[0]?.count || 1;

  const incByEquipo = allInv.map(eq => {
    const incCount = allInc.filter(i => i.equipoId === eq.id).length;
    return { nombre: eq.nombre, biblioteca: eq.biblioteca, tipo: eq.tipo, incCount };
  }).filter(e => e.incCount > 0).sort((a, b) => b.incCount - a.incCount).slice(0, 5);

  const categorias = ["HARDWARE", "SOFTWARE", "RED", "AV", "SEGURIDAD"].map(cat => ({
    label: cat, value: incidencias.filter(i => i.categoria === cat).length
  })).filter(c => c.value > 0);
  const maxCat = Math.max(...categorias.map(c => c.value), 1);
  const catColors = { HARDWARE: "bg-amber-400", SOFTWARE: "bg-sky-400", RED: "bg-emerald-400", AV: "bg-violet-400", SEGURIDAD: "bg-red-400" };

  const actByDay = useMemo(() => {
    const DAY_LABEL = ["D","L","M","X","J","V","S"];
    const dateCount = {};
    allInc.forEach(i => { dateCount[i.fecha] = (dateCount[i.fecha] || 0) + 1; });
    return Object.entries(dateCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, count]) => ({ d: DAY_LABEL[new Date(date + "T12:00:00").getDay()], v: count }));
  }, [allInc]);

  const isDark = theme === "dark";
  const chartTooltip = {
    contentStyle: {
      backgroundColor: isDark ? "#18181b" : "#f9fafc",
      border: `1px solid ${isDark ? "#27272a" : "#ccd3e0"}`,
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "500",
      boxShadow: isDark ? "none" : "0 8px 24px rgba(0,0,0,0.12)",
    },
    itemStyle:  { fill: isDark ? "#fbbf24" : "#d97706", fontWeight: "bold" },
    labelStyle: { color: isDark ? "#a1a1aa" : "#64748b" },
  };

  const recientes = incidencias.slice(0, 5);

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Bienvenido, ${user.nombre || user.username}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-ink3 text-xs">Filtrar por biblioteca:</span>
            <select
              value={biblioFilter}
              onChange={e => setBiblioFilter(e.target.value)}
              className="bg-well border border-edge2 rounded px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-amber-500/60"
            >
              <option value="TODAS">Todas</option>
              {BIBLIOTECAS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="TOTAL" value={total} />
        <StatCard label="ABIERTAS" value={abiertas} accent />
        <StatCard label="EN PROGRESO" value={enProgreso} />
        <StatCard label="RESUELTAS" value={resueltas} />
        <StatCard label="CRÍTICAS" value={criticas} color="text-red-600 dark:text-red-400" />
        <StatCard label="T. RESOLUCIÓN" value={avgResolucion !== "—" ? `${avgResolucion}d` : "—"} sub="promedio" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Actividad semanal */}
        <div className="bg-card border border-edge rounded-lg p-5">
          <div className="text-ink3 text-xs tracking-wide mb-4">ACTIVIDAD SEMANAL (ÚLTIMA SEMANA)</div>
          <div className="h-32 -mx-2 -mb-2 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={actByDay}>
                <defs>
                  <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  cursor={{ stroke: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", strokeWidth: 40 }}
                  contentStyle={chartTooltip.contentStyle}
                  itemStyle={chartTooltip.itemStyle}
                  labelStyle={chartTooltip.labelStyle}
                  formatter={(value) => [value, "Incidencias"]}
                />
                <Area type="monotone" dataKey="v" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#52525b" : "#94a3b8", fontSize: 10 }} dy={5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Por estado */}
        <div className="bg-card border border-edge rounded-lg p-5">
          <div className="text-ink3 text-xs tracking-wide mb-4">POR ESTADO</div>
          <div className="space-y-3">
            {[
              { label: "Abiertas",    value: abiertas,   color: "bg-red-400",     pct: total ? Math.round((abiertas   / total) * 100) : 0 },
              { label: "En Progreso", value: enProgreso, color: "bg-amber-400",   pct: total ? Math.round((enProgreso / total) * 100) : 0 },
              { label: "Resueltas",   value: resueltas,  color: "bg-emerald-400", pct: total ? Math.round((resueltas  / total) * 100) : 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink2">{s.label}</span>
                  <span className="text-ink3">{s.value} ({s.pct}%)</span>
                </div>
                <div className="h-1.5 bg-edge rounded-full">
                  <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por categoría */}
        <div className="bg-card border border-edge rounded-lg p-5">
          <div className="text-ink3 text-xs tracking-wide mb-4">POR CATEGORÍA</div>
          <div className="space-y-2.5">
            {categorias.map(c => (
              <MiniBar key={c.label} label={c.label} value={c.value} max={maxCat} color={catColors[c.label]} />
            ))}
            {categorias.length === 0 && <div className="text-ink3 text-xs">Sin datos</div>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Por biblioteca */}
        <div className="bg-card border border-edge rounded-lg p-5">
          <div className="text-ink3 text-xs tracking-wide mb-4">INCIDENCIAS POR BIBLIOTECA</div>
          <div className="space-y-2.5">
            {incByBiblio.map(({ b, count }, i) => (
              <div key={b} className="flex items-center gap-3">
                {i === 0 && count > 0 && <span className="text-amber-500 text-xs w-4" title="Más incidencias">▲</span>}
                {i !== 0 && <span className="w-4" />}
                <button
                  onClick={() => setBiblioFilter(b === biblioFilter ? "TODAS" : b)}
                  className={`flex-1 flex items-center gap-2 text-left transition-colors ${biblioFilter === b ? "text-amber-600 dark:text-amber-400" : "text-ink2 hover:text-ink"}`}
                >
                  <span className="text-xs truncate flex-1">{b}</span>
                </button>
                <div className="flex-1 max-w-24 bg-edge rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${i === 0 ? "bg-red-400" : "bg-ink3"}`}
                    style={{ width: `${(count / maxBiblioCount) * 100}%` }}
                  />
                </div>
                <span className="text-ink2 text-xs w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipos problemáticos */}
        <div className="bg-card border border-edge rounded-lg p-5">
          <div className="text-ink3 text-xs tracking-wide mb-4">EQUIPOS MÁS PROBLEMÁTICOS</div>
          {incByEquipo.length === 0 ? (
            <div className="text-ink3 text-xs">Ningún equipo con incidencias asociadas</div>
          ) : (
            <div className="space-y-3">
              {incByEquipo.map(eq => (
                <div key={eq.nombre} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-ink text-xs font-medium truncate">{eq.nombre}</div>
                    <div className="text-ink3 text-xs">{eq.biblioteca}</div>
                  </div>
                  <span className="text-xs bg-well text-ink2 px-1.5 py-0.5 rounded">{eq.tipo}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${eq.incCount >= 3 ? "bg-red-200 text-red-800 dark:bg-red-400/15 dark:text-red-400" : "bg-amber-200 text-amber-800 dark:bg-amber-400/15 dark:text-amber-400"}`}>
                    {eq.incCount} inc.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recientes */}
      <div className="bg-card border border-edge rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
          <div className="text-ink3 text-xs tracking-wide">INCIDENCIAS RECIENTES{biblioFilter !== "TODAS" ? ` — ${biblioFilter}` : ""}</div>
          <button onClick={() => navigate("incidencias")} className="text-amber-600 dark:text-amber-400 text-xs hover:text-amber-500">Ver todas →</button>
        </div>
        <div className="divide-y divide-edge">
          {recientes.length === 0 && <div className="py-12 text-center text-ink3 text-sm">Sin incidencias</div>}
          {recientes.map(inc => (
            <button
              key={inc.id}
              onClick={() => navigate("detalle", inc.id)}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-well transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-ink text-sm truncate">{inc.titulo}</div>
                <div className="text-ink3 text-xs mt-0.5 flex items-center gap-2">
                  <span>{inc.biblioteca}</span>
                  <span>·</span>
                  <span>{inc.fecha}</span>
                  {inc.etiquetas?.length > 0 && (
                    <>
                      <span>·</span>
                      <div className="flex gap-1">
                        {inc.etiquetas.slice(0, 2).map(t => <EtiquetaBadge key={t} tag={t} />)}
                        {inc.etiquetas.length > 2 && <span className="text-ink3 text-xs">+{inc.etiquetas.length - 2}</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <PrioridadBadge prioridad={inc.prioridad} />
              <Badge estado={inc.estado} />
              <div className="text-ink3 text-sm">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
