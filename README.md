# 📚 Biblioteca — Sistema de Gestión de Incidencias TI

Frontend React + Vite + TailwindCSS para el sistema de gestión de incidencias de bibliotecas.

- **React 18** + **Vite 5**
- **TailwindCSS 3**
- **IBM Plex Mono** (Google Fonts)
- JWT auth con `localStorage`
- Mock data incluido para demo sin backend

## Accesos demo (sin backend)

| Usuario   | Contraseña | Rol     
| `admin`   | `demo`     | ADMIN   
| `tecnico` | `demo`     | TECNICO 
| `usuario` | `demo`     | USUARIO 

---

## Integración con el backend

La API base está configurada en `src/services/api.js`:

```js
const BASE = "http://localhost:8080/api";
```

### Endpoints esperados

| Método | Ruta                    | Descripción                  |
|--------|-------------------------|------------------------------|
| POST   | `/auth/login`           | Login → `{ token, user }`    |
| GET    | `/incidencias`          | Listado con filtros           |
| POST   | `/incidencias`          | Crear incidencia              |
| GET    | `/incidencias/:id`      | Detalle + historial           |
| PATCH  | `/incidencias/:id`      | Actualizar estado/asignado    |
| GET    | `/inventario`           | Listado equipos               |
| POST   | `/inventario`           | Añadir equipo                 |
| GET    | `/plantillas`           | Listado plantillas            |
| POST   | `/plantillas`           | Crear plantilla               |
| PUT    | `/plantillas/:id`       | Editar plantilla              |
| DELETE | `/plantillas/:id`       | Eliminar plantilla            |
| GET    | `/usuarios`             | Listado (solo ADMIN)          |
| POST   | `/usuarios`             | Crear usuario (solo ADMIN)    |
| PUT    | `/usuarios/:id`         | Editar usuario (solo ADMIN)   |
| DELETE | `/usuarios/:id`         | Eliminar usuario (solo ADMIN) |

### Estructura JWT esperada (payload)

```json
{
  "id": 1,
  "nombre": "María García",
  "username": "admin",
  "role": "ADMIN"
}
```

### Proxy Vite (evita CORS en dev)

El `vite.config.js` ya incluye proxy: las peticiones a `/api/*` se redirigen a `http://localhost:8080`.

---

## Estructura del proyecto

```
src/
├── context/
│   └── AuthContext.jsx     # JWT auth, login/logout
├── services/
│   └── api.js              # Fetch wrapper + mock data
├── components/
│   ├── Layout.jsx          # Sidebar + nav principal
│   └── UI.jsx              # Componentes reutilizables
└── pages/
    ├── Login.jsx           # Pantalla de login
    ├── Dashboard.jsx       # Métricas y resumen
    ├── Inventario.jsx      # CRUD equipos
    ├── Incidencias.jsx     # Listado con filtros + export CSV
    ├── DetalleTicket.jsx   # Ticket con historial y comentarios
    ├── Plantillas.jsx      # CRUD plantillas
    └── GestionUsuarios.jsx # CRUD usuarios (solo ADMIN)
```

---

## Roles y permisos

| Función                     | USUARIO | TECNICO  | ADMIN |
| Ver dashboard               | ✓       | ✓       | ✓     |
| Crear incidencia            | ✓       | ✓       | ✓     |
| Asignar técnico             |         | ✓       | ✓     |
| Cambiar estado              |         | ✓       | ✓     |
| Gestionar inventario        |         | ✓       | ✓     |
| Gestionar plantillas        |         | ✓       | ✓     |
| Gestionar usuarios          |         |         | ✓     |
| Eliminar incidencias        |         |         | ✓     |

---