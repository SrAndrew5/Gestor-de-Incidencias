# Especificación Técnica del API REST (Backend)

Este documento define el contrato de integración (API Contract) entre el Frontend React y el Backend (Spring Boot / Node.js) del Gestor de Incidencias, incluyendo el modelo relacional basado en IDs, la estrategia de paginación, archivos y tiempo real.

---

## 1. Endpoints de Negocio y Filtros (RESTful)

### 📋 Incidencias (`/api/incidencias`)

*   **`GET /api/incidencias`**
    *   **Propósito:** Listar tickets con paginación y filtros.
    *   **Query Params (Filtros Opcionales):**
        *   `estado=ABIERTA,EN_PROGRESO`
        *   `prioridad=CRITICA`
        *   `categoriaId=2`
        *   `bibliotecaId=1`
        *   `asignadoId=5`
        *   `creadoPorId=3`
        *   `search=teclado` (Búsqueda Full-Text en título y descripción)
        *   `page=0&size=20&sort=fecha,desc`
*   **`POST /api/incidencias`**
    *   **Propósito:** Crear nuevo ticket.
    *   **Body:** `{ "titulo": "Fallo PC", "descripcion": "...", "categoriaId": 1, "bibliotecaId": 1, "equipoId": 3, "urgencia": "ALTA", "impacto": "MEDIA", "etiquetas": ["hardware"] }`
*   **`GET /api/incidencias/{id}`**
    *   **Propósito:** Obtener detalle completo (incluye joins de catálogos e historial completo).
*   **`PATCH /api/incidencias/{id}`**
    *   **Propósito:** Actualización parcial. Ej: `{ "estado": "RESUELTA" }` o `{ "asignadoId": 4 }`.

### 👥 Usuarios y Catálogos (`/api/usuarios`, `/api/catalogos`)
*   **`GET /api/usuarios`**: Admite `?bibliotecaId=1&roleId=2` (ideal para llenar los selects de "Asignar Técnico").
*   **`GET /api/catalogos`**: Devuelve de golpe todos los catálogos estáticos en la carga inicial (`bibliotecas`, `categorias`, `roles`).

### 📦 Inventario (`/api/inventario`)
*   **`GET /api/inventario`**: Filtros: `?bibliotecaId=1&estado=OPERATIVO&search=BCEN-PC`.

---

## 2. Estrategia de Paginación y Scroll

Para optimizar la carga del Frontend, el Backend NO debe devolver arrays planos en endpoints de listado (`GET /incidencias`), sino un objeto "Page":

**Ejemplo de Respuesta Paginada (Paging Strategy):**
```json
{
  "content": [ ... array de objetos ... ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 142,
    "totalPages": 8
  },
  "hasMore": true
}
```
*Frontend Implementation:* El frontend usará `hasMore` para mostrar el botón "Cargar más" o disparar un *IntersectionObserver* para el scroll infinito, pidiendo `page=1`, `page=2`, etc.

---

## 3. Gestión de Archivos (Uploads de Averías)

**Regla de Arquitectura:** NUNCA enviar archivos pesados embebidos en JSON como Base64 (hace colapsar la memoria del backend y congestiona la red).

**Estrategia (Multipart/form-data):**
1.  **Endpoint:** `POST /api/incidencias/{id}/archivos`
2.  **Request Type:** `multipart/form-data`
3.  **Flujo:**
    *   El frontend envía primero el JSON puro a `POST /api/incidencias`.
    *   El backend responde con el `id` del ticket creado (Ej: `45`).
    *   Si hay fotos adjuntas, el frontend dispara llamadas asíncronas a `POST /api/incidencias/45/archivos` mandando los archivos binarios.
    *   El backend guarda el archivo físico (en S3, Azure Blob o un volumen local) y guarda la metadata en una tabla `Adjuntos (id, incidencia_id, url, name, size)`.

---

## 4. Modelo de Historial (Timeline)

Para que el historial sea inmutable (como una cadena de bloques) y eficiente:

*   **`GET /api/incidencias/{id}/historial`**
*   **Payload:** El backend no debe requerir que el frontend envíe texto para cambios de estado automáticos.
*   **Comentarios del usuario:** `POST /api/incidencias/{id}/comentarios` -> `{ "texto": "Servidor reiniciado." }`
    *   El backend automáticamente extrae el `autorId` del JWT, pone la `fecha` UTC, calcula el tipo de evento (`COMENTARIO`) e inserta el registro.

---

## 5. Notificaciones y Tiempo Real ("La Campanita")

**Endpoints REST (Pull):**
*   `GET /api/notificaciones` (Devuelve las alertas no leídas del `usuarioId` logueado).
*   `PATCH /api/notificaciones/{id}/leer` (Marca como leída).

**Tiempo Real (Push):**
Para que la alerta llegue en el momento exacto, la estrategia recomendada es **Server-Sent Events (SSE)** o **WebSockets (STOMP)**.
*   El frontend se suscribe a `/ws/notifications/{usuarioId}` o a un canal general `/ws/incidencias/criticas`.
*   Cuando en el backend se ejecuta `businessRules.procesarTriggers()`, este emite un mensaje al socket.

---

## 6. Ejemplo de Respuesta Compleja (Detalle de Incidencia)

Cuando el frontend solicita el Detalle del Ticket, el backend debe aprovechar para realizar los *JOINs* en Base de Datos y devolver una entidad "hidratada" que contenga todo lo necesario en una sola llamada de red.

**`GET /api/incidencias/124`**
```json
{
  "id": 124,
  "titulo": "El sistema de préstamos está caído",
  "descripcion": "No deja procesar devoluciones desde las 10:00 AM.",
  "estado": "EN_PROGRESO",
  "prioridad": "CRITICA",
  "urgencia": "ALTA",
  "impacto": "ALTA",
  "fechaCreacion": "2026-04-27T08:30:00Z",
  
  "relaciones": {
    "categoriaId": 2,
    "bibliotecaId": 1,
    "asignadoId": 4,
    "creadoPorId": 5,
    "equipoId": null
  },

  "sla": {
    "limiteHoras": 2,
    "venceEn": "2026-04-27T10:30:00Z",
    "estadoSla": "WARNING"
  },

  "adjuntos": [
    {
      "id": 88,
      "nombre": "error_pantalla.png",
      "sizeBytes": 1048576,
      "url": "https://cdn.biblioteca.local/files/inc_124/error_pantalla.png"
    }
  ],

  "historial": [
    {
      "id": 501,
      "tipo": "CREACION",
      "texto": "Ticket registrado en el sistema",
      "autorId": 5,
      "fecha": "2026-04-27T08:30:00Z"
    },
    {
      "id": 502,
      "tipo": "ESTADO",
      "texto": "Estado cambiado a EN PROGRESO",
      "autorId": 4,
      "fecha": "2026-04-27T08:45:12Z"
    }
  ]
}
```
