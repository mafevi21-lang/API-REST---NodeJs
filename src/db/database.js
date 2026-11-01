'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const RUTA_DB = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'peliculas.db');

if (RUTA_DB !== ':memory:') {
  fs.mkdirSync(path.dirname(RUTA_DB), { recursive: true });
}

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS generos (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre              TEXT    NOT NULL UNIQUE,
  descripcion         TEXT,
  estado              TEXT    NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  fecha_creacion      TEXT    NOT NULL,
  fecha_actualizacion TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS directores (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres             TEXT    NOT NULL,
  estado              TEXT    NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  fecha_creacion      TEXT    NOT NULL,
  fecha_actualizacion TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS productoras (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre              TEXT    NOT NULL UNIQUE,
  slogan              TEXT,
  descripcion         TEXT,
  estado              TEXT    NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  fecha_creacion      TEXT    NOT NULL,
  fecha_actualizacion TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS tipos (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre              TEXT    NOT NULL UNIQUE,
  descripcion         TEXT,
  fecha_creacion      TEXT    NOT NULL,
  fecha_actualizacion TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS medios (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  serial              TEXT    NOT NULL UNIQUE,
  titulo              TEXT    NOT NULL,
  sinopsis            TEXT,
  url                 TEXT    NOT NULL UNIQUE,
  imagen_portada      TEXT,
  anio_estreno        INTEGER NOT NULL,
  genero_id           INTEGER NOT NULL REFERENCES generos (id)    ON DELETE RESTRICT,
  director_id         INTEGER NOT NULL REFERENCES directores (id) ON DELETE RESTRICT,
  productora_id       INTEGER NOT NULL REFERENCES productoras (id) ON DELETE RESTRICT,
  tipo_id             INTEGER NOT NULL REFERENCES tipos (id)      ON DELETE RESTRICT,
  fecha_creacion      TEXT    NOT NULL,
  fecha_actualizacion TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_medios_genero     ON medios (genero_id);
CREATE INDEX IF NOT EXISTS idx_medios_director   ON medios (director_id);
CREATE INDEX IF NOT EXISTS idx_medios_productora ON medios (productora_id);
CREATE INDEX IF NOT EXISTS idx_medios_tipo       ON medios (tipo_id);
`;

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

function sembrar(db) {
  const fecha = new Date().toISOString();

  const insertarGenero = db.prepare(`
    INSERT OR IGNORE INTO generos (nombre, descripcion, estado, fecha_creacion, fecha_actualizacion)
    VALUES (?, ?, 'activo', ?, ?)
  `);
  const insertarTipo = db.prepare(`
    INSERT OR IGNORE INTO tipos (nombre, descripcion, fecha_creacion, fecha_actualizacion)
    VALUES (?, ?, ?, ?)
  `);

  db.transaction(() => {
    for (const [nombre, descripcion] of GENEROS_INICIALES) {
      insertarGenero.run(nombre, descripcion, fecha, fecha);
    }
    for (const [nombre, descripcion] of TIPOS_INICIALES) {
      insertarTipo.run(nombre, descripcion, fecha, fecha);
    }
  })();
}

const db = new Database(RUTA_DB);
db.pragma('foreign_keys = ON');
db.exec(ESQUEMA);
sembrar(db);

module.exports = { db };
