# Especificación Técnica Completa para Backend de Gestión de Incidencias (Spring Boot)

Este documento detalla los requisitos para el desarrollo de la API REST del sistema de incidencias bibliotecarias.

## 1. Configuración Base
- **URL Base**: `http://localhost:8080/api`
- **Autenticación**: JWT (JSON Web Token)
- **CORS**: Habilitado para el origen del frontend (ej. `localhost:5173`)

## 2. Modelos de Datos (Entidades)

### ✅ Incidencia
```json
{
  "id": "Long",
  "titulo": "String (min 5)",
  "estado": "Enum [ABIERTA, EN_PROGRESO, RESUELTA, CERRADA]",
  "prioridad": "Enum [SIN_CLASIFICAR, CRITICA, ALTA, MEDIA, BAJA]",
  "categoria": "Enum [HARDWARE, SOFTWARE, RED, AV, SEGURIDAD]",
  "asignado": "String",
  "fecha": "LocalDate (ISO)",
  "biblioteca": "String",
  "creadoPor": "String",
  "creadoPorId": "Long",
  "equipoId": "Long (opcional)",
  "etiquetas": "List<String>",
  "descripcion": "String"
}
```

### ✅ Historial/Comentarios de Incidencia
```json
{
  "id": "Long",
  "incidenciaId": "Long",
  "autor": "String",
  "autorId": "Long",
  "fecha": "LocalDateTime",
  "texto": "String",
  "tipo": "Enum [COMENTARIO, CAMBIO_ESTADO, SISTEMA]"
}
```

### ✅ Equipo (Inventario)
```json
{
  "id": "Long",
  "codigoInventario": "String (Único)",
  "nombre": "String",
  "tipo": "Enum [ORDENADOR, PORTÁTIL, TABLET, IMPRESORA, PANTALLA, RED, PERIFÉRICO, AV, SERVIDOR]",
  "biblioteca": "String",
  "sala": "String",
  "puesto": "String",
  "estado": "Enum [OPERATIVO, AVERIADO, MANTENIMIENTO, BAJA]",
  "serie": "String (Único)",
  "ultima_revision": "LocalDate",
  "etiquetas": "List<String>"
}
```

### ✅ Plantilla
```json
{
  "id": "Long",
  "nombre": "String",
  "categoria": "Enum",
  "descripcion": "String",
  "uso": "Integer (contador)"
}
```

## 3. Endpoints REST (CRUD)

### 🔑 Autenticación
- `POST /auth/login`: `{ username, password }` -> `{ token, user: { id, nombre, email, rol, biblioteca } }`

### 📋 Incidencias
- `GET /incidencias`: Lista filtrada por query params (`estado`, `prioridad`, `categoria`, `biblioteca`, `search`).
- `GET /incidencias/{id}`: Detalle completo de la incidencia.
- `GET /incidencias/{id}/historial`: Lista cronológica de comentarios y logs del ticket.
- `POST /incidencias/{id}/historial`: Añadir una nueva entrada al historial.
- `POST /incidencias`: Crear nueva.
- `PATCH /incidencias/{id}`: Actualización parcial (estado, prioridad, técnico asignado).
- `DELETE /incidencias/{id}`: Eliminación física o lógica (Solo ADMIN).

### 📦 Inventario
- `GET /inventario`: Lista completa de dispositivos.
- `GET /inventario/{id}`: Datos técnicos detallados.
- `POST /inventario`: Registrar un nuevo equipo.
- `PUT /inventario/{id}`: Actualizar datos de un equipo existente.
- `POST /inventario/import`: Recibir array JSON para inserción masiva (deduplicar por nº serie/código).

### 📝 Plantillas
- `GET /plantillas`: Lista todas las plantillas.
- `POST /plantillas`: Guardar o actualizar una plantilla.
- `DELETE /plantillas/{id}`: Eliminar.
- `POST /plantillas/{id}/uso`: Incrementar contador de uso (+1).

### 👥 Usuarios
- `GET /usuarios`: Listado total para administración.
- `POST /usuarios`: Crear nuevo usuario con contraseña temporal.
- `PATCH /usuarios/{id}`: Cambiar estado Activo/Inactivo o editar Rol.
- `DELETE /usuarios/{id}`: Solo ADMIN.

### 📊 Estadísticas (Dashboard)
- `GET /stats/resumen`: Retornar contadores globales y tiempos medios de resolución.

## 4. Seguridad y Roles (RBAC)
- **ADMIN**: Acceso total a todos los endpoints.
- **TECNICO**: Gestión de incidencias e inventario. Solo lectura de usuarios.
- **USUARIO**: Solo puede ver sus propias incidencias y crear nuevas vinculadas a su biblioteca.

## 5. Notas de Implementación (Backend)
- IDs Numéricos (Long/BigInt).
- Fechas en formato ISO 8601.
- Manejo de excepciones en JSON.
- CORS habilitado para `localhost`.
