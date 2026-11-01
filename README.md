# API REST de películas y series

Evidencia de aprendizaje **API REST - Node.js** (Ingeniería Web II, IUDigital de Antioquia).
Backend con Node.js + Express 5 y PostgreSQL (driver `pg`, base alojada en Neon), con los módulos **Género**, **Director**, **Productora**, **Tipo** y **Media** (películas y series).

## Requisitos

- Node.js 20 o superior (probado con Node 24).
- Una base de datos PostgreSQL y su cadena de conexión (por ejemplo, de Neon).
- Postman u otro cliente HTTP.

## Configuración

La conexión se toma de la variable de entorno `DATABASE_URL`. No la escribas en el código ni la subas al repositorio.

```bash
setx DATABASE_URL "postgresql://usuario:clave@servidor/basedatos?sslmode=require"
```

Después de usar `setx`, cierra y abre la terminal.

Variables de entorno:

| Variable       | Por defecto | Descripción                                                                 |
|----------------|-------------|-----------------------------------------------------------------------------|
| `DATABASE_URL` | (obligatoria) | Cadena de conexión a PostgreSQL.                                          |
| `DB_SCHEMA`    | `public`    | Esquema donde se crean las tablas. Las pruebas lo cambian por uno temporal. |
| `PORT`         | `3000`      | Puerto del servidor.                                                        |

## Instalación y ejecución

```bash
npm install
npm run db:init    # crea las tablas y los datos iniciales en la base
npm start          # http://localhost:3000/api
npm run dev        # igual, reiniciando al guardar cambios
npm test           # pruebas automatizadas (usan un esquema temporal que se borra al final)
```

> **Nota:** `npm start` también crea las tablas si no existen, así que `db:init` solo es necesario para prepararla antes.

## Modelo de datos

```
generos (1) ──────< medios >────── (1) directores
                       │  >────── (1) productoras
                       └──────── (1) tipos
```

| Tabla        | Campos principales                                                                                              |
|--------------|-----------------------------------------------------------------------------------------------------------------|
| `generos`    | id, nombre (único), descripcion, estado (activo/inactivo), fecha_creacion, fecha_actualizacion                  |
| `directores` | id, nombres, estado, fecha_creacion, fecha_actualizacion                                                        |
| `productoras`| id, nombre (único), slogan, descripcion, estado, fecha_creacion, fecha_actualizacion                           |
| `tipos`      | id, nombre (único), descripcion, fecha_creacion, fecha_actualizacion                                            |
| `medios`     | id, serial (único), titulo, sinopsis, url (única), imagen_portada, anio_estreno, genero_id, director_id, productora_id, tipo_id, fecha_creacion, fecha_actualizacion |

Reglas aplicadas (según el enunciado):

- Un medio tiene **un único** género, **un** director principal, **una** productora y **un** tipo.
- Al crear o editar un medio, género, director y productora deben estar **activos**; el tipo solo debe existir.
- `serial` y `url` son únicos. Si no se envía `serial`, la API genera uno (`MED-XXXXXXXX`).
- Un catálogo en uso por algún medio no se puede eliminar (respuesta `409`).
- Datos iniciales: géneros *Acción, Aventura, Ciencia ficción, Drama, Terror* y tipos *Película, Serie*.

## Endpoints

Todos los recursos siguen el mismo patrón REST:

| Método   | Ruta                  | Descripción                                   | Respuesta |
|----------|-----------------------|-----------------------------------------------|-----------|
| `GET`    | `/api/{recurso}`      | Lista todos (filtros en query string)         | 200       |
| `GET`    | `/api/{recurso}/:id`  | Consulta uno                                  | 200 / 404 |
| `POST`   | `/api/{recurso}`      | Crea uno                                      | 201 / 400 / 409 / 422 |
| `PUT`    | `/api/{recurso}/:id`  | Actualiza campos enviados (parcial)           | 200 / 400 / 404 / 409 / 422 |
| `PATCH`  | `/api/{recurso}/:id`  | Igual que PUT                                 | 200 / 400 / 404 / 409 / 422 |
| `DELETE` | `/api/{recurso}/:id`  | Elimina                                       | 204 / 404 / 409 |

Recursos: `generos`, `directores`, `productoras`, `tipos`, `medios`.

Filtros de listado:

- `generos`, `directores`, `productoras`: `?estado=activo` o `?estado=inactivo`.
- `medios`: `?generoId=`, `?directorId=`, `?productoraId=`, `?tipoId=`.

### Ejemplos de cuerpo (JSON)

**Género**
```json
POST /api/generos
{ "nombre": "Comedia", "descripcion": "Películas de humor", "estado": "activo" }
```

**Director**
```json
POST /api/directores
{ "nombres": "Christopher Nolan", "estado": "activo" }
```

**Productora**
```json
POST /api/productoras
{ "nombre": "Warner Bros.", "slogan": "Del mismo modo", "descripcion": "Estudio de cine", "estado": "activo" }
```

**Tipo**
```json
POST /api/tipos
{ "nombre": "Documental", "descripcion": "Producciones basadas en hechos reales" }
```

**Medio (película o serie)**
```json
POST /api/medios
{
  "titulo": "Interstellar",
  "sinopsis": "Un grupo de exploradores viaja a través de un agujero de gusano.",
  "url": "https://ejemplo.com/peliculas/interstellar",
  "imagenPortada": "https://ejemplo.com/img/interstellar.jpg",
  "anioEstreno": 2014,
  "generoId": 3,
  "directorId": 1,
  "productoraId": 1,
  "tipoId": 1
}
```

Respuesta de un medio (los catálogos vienen anidados):
```json
{
  "id": 1,
  "serial": "MED-3F9A1B2C",
  "titulo": "Interstellar",
  "sinopsis": "...",
  "url": "https://ejemplo.com/peliculas/interstellar",
  "imagenPortada": "https://ejemplo.com/img/interstellar.jpg",
  "anioEstreno": 2014,
  "fechaCreacion": "2026-10-31T12:00:00.000Z",
  "fechaActualizacion": "2026-10-31T12:00:00.000Z",
  "genero": { "id": 3, "nombre": "Ciencia ficción" },
  "director": { "id": 1, "nombres": "Christopher Nolan" },
  "productora": { "id": 1, "nombre": "Warner Bros." },
  "tipo": { "id": 1, "nombre": "Película" }
}
```

### Códigos de error

Las respuestas de error tienen la forma `{ "mensaje": "..." }`.

| Código | Cuándo                                                                   |
|--------|--------------------------------------------------------------------------|
| 400    | Datos inválidos, campo obligatorio ausente, id mal formado, JSON inválido |
| 404    | Registro o ruta inexistente                                               |
| 409    | Valor único repetido (nombre, url, serial) o catálogo en uso al borrar    |
| 422    | Se intenta usar un género, director o productora inactivo en un medio     |

## Probar con Postman

1. Inicia el servidor con `npm start`.
2. Crea una colección y define la variable `base` = `http://localhost:3000/api`.
3. Orden sugerido: crear **Director** y **Productora** → crear **Medio** (usa los ids devueltos) → consultar, editar (`PUT`) y eliminar (`DELETE`).
4. Para los `POST`/`PUT`, en *Body* elige **raw → JSON**.
5. Prueba también los casos de error: un género `inactivo` en un medio (422), una url repetida (409) y borrar un director en uso (409).

## Estructura del proyecto

```
proyecto_integrado_II/
├── src/
│   ├── app.js                       # Configuración de Express y rutas
│   ├── server.js                    # Arranque del servidor
│   ├── db/database.js               # Conexión, esquema y datos iniciales
│   ├── middlewares/manejadorErrores.js
│   ├── utils/
│   │   ├── errores.js               # ApiError
│   │   └── validar.js               # Validaciones de entrada
│   └── modules/
│       ├── catalogos/               # CRUD genérico reutilizado por los catálogos
│       ├── generos/generos.js
│       ├── directores/directores.js
│       ├── productoras/productoras.js
│       ├── tipos/tipos.js
│       └── medios/medios.js         # Módulo Media (películas y series)
├── test/api.test.js                 # Pruebas automatizadas
├── package.json
└── README.md
```

## Decisiones de diseño

- **Monolito con backend separado del frontend**, como pide el enunciado. Esta entrega cubre solo el backend; el frontend queda pendiente.
- **Sin autenticación**, porque el enunciado no la requiere en esta etapa.
- **Imagen de portada como URL**: se guarda la dirección de la imagen, no el archivo. Subir archivos sería una mejora posterior.
- **Eliminación de catálogos protegida**: en lugar de borrar en cascada, se impide borrar lo que está en uso. Así no se pierden medios por error.
- **Actualización parcial**: `PUT` y `PATCH` aceptan solo los campos que se envían.
