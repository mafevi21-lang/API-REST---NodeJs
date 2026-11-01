'use strict';

const { Pool } = require('pg');

const CONEXION = process.env.DATABASE_URL;
const ESQUEMA = process.env.DB_SCHEMA || 'public';

if (!CONEXION) {
  throw new Error('Falta la variable de entorno DATABASE_URL con la cadena de conexión a PostgreSQL');
}

const pool = new Pool({ connectionString: CONEXION, max: 5 });

const db = {
  query: (texto, valores) => pool.query(texto, valores),
};

// Nombre de tabla calificado con el esquema, por ejemplo "public"."generos"
function tablaSql(nombre) {
  return `"${ESQUEMA}"."${nombre}"`;
}

const SENTENCIAS_ESQUEMA = () => [
  `CREATE TABLE IF NOT EXISTS ${tablaSql('generos')} (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre              TEXT NOT NULL UNIQUE,
    descripcion         TEXT,
    estado              TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ${tablaSql('directores')} (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombres             TEXT NOT NULL,
    estado              TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ${tablaSql('productoras')} (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre              TEXT NOT NULL UNIQUE,
    slogan              TEXT,
    descripcion         TEXT,
    estado              TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ${tablaSql('tipos')} (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre              TEXT NOT NULL UNIQUE,
    descripcion         TEXT,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ${tablaSql('medios')} (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    serial              TEXT NOT NULL UNIQUE,
    titulo              TEXT NOT NULL,
    sinopsis            TEXT,
    url                 TEXT NOT NULL UNIQUE,
    imagen_portada      TEXT,
    anio_estreno        INTEGER NOT NULL,
    genero_id           INTEGER NOT NULL REFERENCES ${tablaSql('generos')} (id)     ON DELETE RESTRICT,
    director_id         INTEGER NOT NULL REFERENCES ${tablaSql('directores')} (id)  ON DELETE RESTRICT,
    productora_id       INTEGER NOT NULL REFERENCES ${tablaSql('productoras')} (id) ON DELETE RESTRICT,
    tipo_id             INTEGER NOT NULL REFERENCES ${tablaSql('tipos')} (id)       ON DELETE RESTRICT,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_medios_genero ON ${tablaSql('medios')} (genero_id)`,
  `CREATE INDEX IF NOT EXISTS idx_medios_director ON ${tablaSql('medios')} (director_id)`,
  `CREATE INDEX IF NOT EXISTS idx_medios_productora ON ${tablaSql('medios')} (productora_id)`,
  `CREATE INDEX IF NOT EXISTS idx_medios_tipo ON ${tablaSql('medios')} (tipo_id)`,
];

const GENEROS_INICIALES = [
  ['Acción', 'Películas con persecuciones, combates y mucha acción.'],
  ['Aventura', 'Historias de viajes, exploración y desafíos.'],
  ['Ciencia ficción', 'Historias basadas en avances científicos, futuros o mundos imaginarios.'],
  ['Drama', 'Historias centradas en conflictos personales y emocionales.'],
  ['Terror', 'Historias diseñadas para generar miedo y suspenso.'],
];

const TIPOS_INICIALES = [
  ['Película', 'Producción audiovisual de duración única.'],
  ['Serie', 'Producción audiovisual dividida en temporadas y episodios.'],
];

async function sembrar() {
  for (const [nombre, descripcion] of GENEROS_INICIALES) {
    await db.query(
      `INSERT INTO ${tablaSql('generos')} (nombre, descripcion) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING`,
      [nombre, descripcion],
    );
  }
  for (const [nombre, descripcion] of TIPOS_INICIALES) {
    await db.query(
      `INSERT INTO ${tablaSql('tipos')} (nombre, descripcion) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING`,
      [nombre, descripcion],
    );
  }
}

// Crea el esquema, las tablas y los datos iniciales. Es seguro ejecutarlo varias veces.
async function inicializar() {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${ESQUEMA}"`);
  for (const sentencia of SENTENCIAS_ESQUEMA()) {
    await pool.query(sentencia);
  }
  await sembrar();
}

// Solo elimina esquemas de pruebas, para no borrar nunca los datos reales.
async function eliminarEsquemaDePruebas() {
  if (!ESQUEMA.startsWith('prueba_')) {
    throw new Error('Solo se puede eliminar un esquema de pruebas (prefijo prueba_)');
  }
  await pool.query(`DROP SCHEMA IF EXISTS "${ESQUEMA}" CASCADE`);
}

async function cerrar() {
  await pool.end();
}

module.exports = { db, tablaSql, inicializar, eliminarEsquemaDePruebas, cerrar };
