# Mejoras y Deuda Técnica — biblioteca-incidencias

> Revisión del frontend antes de iniciar el backend. Estado general: **sólido**. La UX y el diseño son de calidad, la arquitectura de contextos está bien separada y preparada para la integración. Las mejoras se ordenan de mayor a menor impacto.

---

## 🔴 Crítico — Arreglar antes de conectar el backend

### ~~1. Inconsistencia `rol` vs `role`~~ ✅ Resuelto
Estandarizado a `role` en `mock.js`, `GestionUsuarios.jsx` y `DetalleTicket.jsx`.

---

### 2. `DetalleTicket` usa `setIncidencias` crudo en lugar de `actualizarIncidencia`
Varias líneas de `DetalleTicket.jsx` hacen `setIncidencias(prev => prev.map(...))` directamente, saltándose las acciones del `DataContext`. El propio `DataContext` expone estos setters como "temporales para no romper el build".

**Riesgo:** Cuando las acciones llamen al API real, las mutaciones de `DetalleTicket` no harán la llamada HTTP porque bypasean la capa de servicio.

**Solución:** Reemplazar todos los `setIncidencias` crudos de `DetalleTicket` por llamadas a `actualizarIncidencia`, `agregarComentario`, etc.

---

### 3. Técnicos leídos desde `mockData` en lugar del contexto
En `DetalleTicket.jsx` (línea ~111):
```js
const tecnicos = mockData.usuarios.filter(u => u.rol === "TECNICO")
```
Lee directamente de los datos mock, no del contexto. Si se crea o edita un técnico desde `GestionUsuarios`, el selector de asignación en el ticket no lo reflejará.

**Solución:** Leer `usuarios` del `DataContext` y filtrar por rol desde ahí.

---

### 4. Contraseña en formulario de creación de usuario no controlada
En `GestionUsuarios.jsx`, el campo de contraseña temporal no tiene `value` ni `onChange`:
```jsx
<Input label="CONTRASEÑA TEMPORAL" type="password" placeholder="••••••••" />
```
No está conectado al estado del formulario. El valor nunca se envía.

**Solución:** Añadir `value={form.password}` y `onChange` correspondiente antes de implementar la llamada POST al backend.

---

## 🟠 Importante — Mejoras de arquitectura

### 5. Router manual sin URLs reales
La navegación usa un `switch/case` con estado en `App.jsx`. No hay soporte de:
- Botón atrás del navegador
- URLs compartibles (un enlace a un ticket siempre abre el dashboard)
- Estado de navegación persistente al recargar

**Solución recomendada:** Migrar a `react-router-dom` v6. El esfuerzo de migración es moderado pero el beneficio es alto, especialmente para los tickets individuales (`/incidencias/:id`).

---

### 6. `setTimeout` como simulador de red no propagará errores reales
Las acciones de `DataContext` usan `setTimeout(async () => {...}, 600)`. El `await` dentro no se propaga al llamador externo, así que cuando las llamadas sean reales los errores no llegarán al handler de UI.

**Solución:** Sustituir los `setTimeout` por `await api.post(...)` directo al integrar el backend. No hay que hacer nada ahora, pero hay que tenerlo en mente para no copiar el patrón.

---

### 7. Fallback silencioso en `DetalleTicket` si el ticket no existe
```js
const inc = incidencias.find(i => i.id === id) || incidencias[0]
```
Si el id no existe, carga el primer ticket de la lista sin avisar al usuario.

**Solución:** Mostrar un estado de error o redirigir al listado si `inc` es `undefined`.

---

### 8. IDs generados con `Date.now()` en el mock
Los nuevos registros usan `Date.now()` como ID temporal. Puede generar colisiones si se crean varios registros en el mismo milisegundo y dificulta la transición al backend (los IDs numéricos del backend serán distintos).

**Solución:** Al integrar el backend, descartar el ID generado en cliente y usar el que devuelve la API en la respuesta del POST. Asegurarse de actualizar el estado con el ID real del servidor.

---

## 🟡 Mejoras de calidad de código

### 9. `filtrosIniciales` solo aplica `search`, no los demás filtros
El prop `filtrosIniciales` que se pasa a `Incidencias.jsx` (desde el dashboard de equipos) solo sincroniza el campo `search`. Si se pasan filtros de estado, biblioteca, etc., se ignoran.

**Solución:** El `useEffect` que reacciona a `filtrosIniciales` debe aplicar todos los campos del objeto, no solo `search`.

---

### 10. Posible crash en `Router` si `user` es null
En `App.jsx`, `const isUsuario = user.role === "USUARIO"` se evalúa antes del guard `if (!user)`. Si por alguna razón `user` llega a ser `null` en el componente Router, crasheará con `TypeError`.

**Solución:** Mover la desestructuración de `user.role` por debajo del guard, o usar optional chaining: `user?.role === "USUARIO"`.

---

### 11. Alias de path `@/` no configurado en Vite
Los imports usan rutas relativas largas como `../../context/AuthContext`. Con muchos archivos esto se vuelve frágil.

**Solución:** Añadir en `vite.config.js`:
```js
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

---

### 12. Paginación inexistente
Si la base de datos crece, renderizar todas las incidencias en una tabla sin paginar degradará el rendimiento notablemente.

**Solución:** Implementar paginación del lado del servidor al integrar el backend (parámetros `page` y `size` en la query). En el frontend, añadir controles de página en `Incidencias.jsx` e `Inventario.jsx`.

---

### 13. Adjuntos de tickets no persisten
Los adjuntos usan `URL.createObjectURL()` — son URLs en memoria que desaparecen al recargar la página. Esto es inherente al modo mock, pero hay que diseñar el flujo real con el backend.

**Solución con backend:** Al adjuntar un archivo, hacer un PUT/POST a un endpoint de uploads. Guardar la URL permanente devuelta por el servidor en lugar del object URL.

---

### 14. Historial de tickets solo cargado para incidencia id=2
El historial de actividad del ticket usa `mockData.historial` filtrado por `id === 2`. Todos los demás tickets empiezan con historial vacío.

**Solución:** Al integrar el backend, cada ticket cargará su historial con un GET a `/incidencias/:id/historial`.

---

## 🟢 Mejoras menores / deseables

### 15. Variables de entorno para la URL del API
En `services/api.js` la URL base está hardcodeada implícitamente como `/api` (relativa al proxy de Vite). Para producción, debería configurarse vía `.env`.

```env
# .env.development
VITE_API_BASE=/api

# .env.production
VITE_API_BASE=https://api.tudominio.com
```

---

### 16. Botón "Informe PDF" en inventario es un placeholder
El botón muestra un toast "próximamente". Si se quiere implementar, librerías como `jsPDF` o una llamada al backend que genere el PDF serían buenas opciones.

---

### 17. Sin tests
No hay ningún test configurado (ni Vitest, ni Jest, ni React Testing Library). Para un sistema de gestión de incidencias, al menos deberían testarse las utilidades de DataContext y los filtros de Incidencias.

**Mínimo recomendado:** Configurar Vitest + Testing Library y añadir tests de las funciones de filtrado y los contextos.

---

### 18. JSDoc o TypeScript para las entidades principales
Las formas de los objetos (Incidencia, Equipo, Usuario, Plantilla) están implícitamente documentadas en `mock.js` pero no hay tipos formales. Esto dificulta el autocompletado y la detección de errores.

**Opción ligera:** Añadir JSDoc en `DataContext.jsx` para tipar los estados.
**Opción robusta:** Migrar a TypeScript (esfuerzo alto, beneficio alto a largo plazo).

---

## Resumen de prioridades

| # | Problema | Impacto | Esfuerzo |
|---|----------|---------|----------|
| 1 | `rol` vs `role` inconsistente | 🔴 Alto | Bajo |
| 2 | `setIncidencias` crudo en DetalleTicket | 🔴 Alto | Medio |
| 3 | Técnicos desde mockData, no contexto | 🔴 Alto | Bajo |
| 4 | Password no controlada en formulario | 🔴 Alto | Bajo |
| 5 | Sin React Router (URLs reales) | 🟠 Medio | Alto |
| 6 | setTimeout no propaga errores | 🟠 Medio | Bajo (al migrar) |
| 7 | Fallback silencioso en DetalleTicket | 🟠 Medio | Bajo |
| 8 | IDs con Date.now() | 🟠 Medio | Bajo (al migrar) |
| 9 | filtrosIniciales parciales | 🟡 Bajo | Bajo |
| 10 | Crash potencial si user es null | 🟡 Bajo | Muy bajo |
| 11 | Alias @/ en Vite | 🟡 Bajo | Muy bajo |
| 12 | Sin paginación | 🟡 Bajo | Medio |
| 13 | Adjuntos efímeros | 🟡 Bajo | Medio (backend) |
| 14 | Historial solo para id=2 | 🟡 Bajo | Bajo (backend) |
| 15 | URL API hardcodeada | 🟢 Mínimo | Muy bajo |
| 16 | PDF inventario placeholder | 🟢 Mínimo | Medio |
| 17 | Sin tests | 🟢 Mínimo | Alto |
| 18 | Sin tipos formales | 🟢 Mínimo | Alto |
