'use strict';

const crypto = require('node:crypto');
const { db } = require('../../db/database');
const { ApiError } = require('../../utils/errores');
const { crearServicioCatalogo } = require('../catalogos/servicioCatalogo');
const { crearRutasCatalogo } = require('../catalogos/rutasCatalogo');
const { leerTexto, leerEntero, leerUrl } = require('../../utils/validar');

const ANIO_MINIMO = 1888; // año del primer filme conocido
const ANIO_MAXIMO = new Date().getFullYear() + 1;

const generarSerial = () => `MED-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// Catálogos que debe usar un medio. Los de género, director y productora deben estar activos.
const REFERENCIAS = {
  generoId: { tabla: 'generos', entidad: 'Género', exigeActivo: true },
  directorId: { tabla: 'directores', entidad: 'Director', exigeActivo: true },
  productoraId: { tabla: 'productoras', entidad: 'Productora', exigeActivo: true },
  tipoId: { tabla: 'tipos', entidad: 'Tipo', exigeActivo: false },
};

function verificarReferencias(datos) {
  for (const [clave, { tabla, entidad, exigeActivo }] of Object.entries(REFERENCIAS)) {
    const id = datos[clave];
    if (id === undefined) continue;

    const fila = db.prepare(`SELECT * FROM ${tabla} WHERE id = ?`).get(id);
    if (!fila) {
      throw new ApiError(400, `${entidad} con id ${id} no existe`);
    }
    if (exigeActivo && fila.estado !== 'activo') {
      throw new ApiError(422, `${entidad} con id ${id} está inactivo; solo se pueden usar registros activos`);
    }
  }
}

const servicio = crearServicioCatalogo({
  tabla: 'medios',
  entidad: 'Medio',
  selectBase: `
    SELECT medios.*,
           generos.nombre       AS genero_nombre,
           directores.nombres   AS director_nombres,
           productoras.nombre   AS productora_nombre,
           tipos.nombre         AS tipo_nombre
    FROM medios
    JOIN generos     ON generos.id     = medios.genero_id
    JOIN directores  ON directores.id  = medios.director_id
    JOIN productoras ON productoras.id = medios.productora_id
    JOIN tipos       ON tipos.id       = medios.tipo_id`,
  mapear: (fila) => ({
    id: fila.id,
    serial: fila.serial,
    titulo: fila.titulo,
    sinopsis: fila.sinopsis,
    url: fila.url,
    imagenPortada: fila.imagen_portada,
    anioEstreno: fila.anio_estreno,
    fechaCreacion: fila.fecha_creacion,
    fechaActualizacion: fila.fecha_actualizacion,
    genero: { id: fila.genero_id, nombre: fila.genero_nombre },
    director: { id: fila.director_id, nombres: fila.director_nombres },
    productora: { id: fila.productora_id, nombre: fila.productora_nombre },
    tipo: { id: fila.tipo_id, nombre: fila.tipo_nombre },
  }),
  filtrables: {
    generoId: 'medios.genero_id',
    directorId: 'medios.director_id',
    productoraId: 'medios.productora_id',
    tipoId: 'medios.tipo_id',
  },
  campos: {
    serial: {
      columna: 'serial',
      defecto: generarSerial,
      validar: (b) => leerTexto(b, 'serial', { max: 50 }),
    },
    titulo: { columna: 'titulo', requerido: true, validar: (b) => leerTexto(b, 'titulo', { max: 200 }) },
    sinopsis: { columna: 'sinopsis', validar: (b) => leerTexto(b, 'sinopsis', { max: 2000 }) },
    url: { columna: 'url', requerido: true, validar: (b) => leerUrl(b, 'url') },
    imagenPortada: { columna: 'imagen_portada', validar: (b) => leerUrl(b, 'imagenPortada') },
    anioEstreno: {
      columna: 'anio_estreno',
      requerido: true,
      validar: (b) => leerEntero(b, 'anioEstreno', { min: ANIO_MINIMO, max: ANIO_MAXIMO }),
    },
    generoId: { columna: 'genero_id', requerido: true, validar: (b) => leerEntero(b, 'generoId', { min: 1 }) },
    directorId: { columna: 'director_id', requerido: true, validar: (b) => leerEntero(b, 'directorId', { min: 1 }) },
    productoraId: {
      columna: 'productora_id',
      requerido: true,
      validar: (b) => leerEntero(b, 'productoraId', { min: 1 }),
    },
    tipoId: { columna: 'tipo_id', requerido: true, validar: (b) => leerEntero(b, 'tipoId', { min: 1 }) },
  },
  antesDeGuardar: verificarReferencias,
});

module.exports = crearRutasCatalogo(servicio);
