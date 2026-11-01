'use strict';

const { db } = require('../../db/database');
const { ApiError } = require('../../utils/errores');
const { validarCuerpo } = require('../../utils/validar');

// Valida el cuerpo según la especificación de campos de cada entidad.
// Al crear aplica defaults y exige los campos obligatorios; al actualizar (parcial)
// solo toma los campos que llegaron.
function construirDatos(campos, body, { parcial }) {
  const datos = {};

  for (const [clave, spec] of Object.entries(campos)) {
    let valor = spec.validar(body);

    if (valor === undefined && parcial) continue;

    if (valor == null && !parcial && spec.defecto !== undefined) {
      valor = typeof spec.defecto === 'function' ? spec.defecto() : spec.defecto;
    }

    if (valor == null && spec.requerido) {
      throw new ApiError(400, `El campo "${clave}" es obligatorio`);
    }

    datos[clave] = valor === undefined ? null : valor;
  }

  return datos;
}

function mapearPorDefecto(campos) {
  return (fila) => {
    const salida = { id: fila.id };
    for (const [clave, spec] of Object.entries(campos)) {
      salida[clave] = fila[spec.columna];
    }
    salida.fechaCreacion = fila.fecha_creacion;
    salida.fechaActualizacion = fila.fecha_actualizacion;
    return salida;
  };
}

/**
 * Crea el servicio CRUD de una entidad.
 *
 * @param {object} opciones
 * @param {string} opciones.tabla        Nombre de la tabla en SQLite.
 * @param {string} opciones.entidad      Nombre legible para mensajes de error.
 * @param {object} opciones.campos       Mapa campo JSON -> { columna, validar, requerido?, defecto? }.
 * @param {string} [opciones.selectBase] SELECT base (permite JOIN). Por defecto, SELECT de la tabla.
 * @param {Function} [opciones.mapear]   Convierte una fila de la BD en el objeto de respuesta.
 * @param {object} [opciones.filtrables] Parámetros de query -> columna SQL para filtrar el listado.
 * @param {Function} [opciones.antesDeGuardar] Validaciones de negocio sobre los datos ya validados.
 */
function crearServicioCatalogo({
  tabla,
  entidad,
  campos,
  selectBase = `SELECT ${tabla}.* FROM ${tabla}`,
  mapear,
  filtrables = {},
  antesDeGuardar = () => {},
}) {
  const mapearFila = mapear || mapearPorDefecto(campos);
  const filtros = { ...(campos.estado ? { estado: `${tabla}.estado` } : {}), ...filtrables };

  function obtener(id) {
    const fila = db.prepare(`${selectBase} WHERE ${tabla}.id = ?`).get(id);
    if (!fila) {
      throw new ApiError(404, `${entidad} con id ${id} no encontrado`);
    }
    return mapearFila(fila);
  }

  function listar(query = {}) {
    const condiciones = [];
    const valores = [];

    for (const [parametro, columna] of Object.entries(filtros)) {
      if (typeof query[parametro] === 'string') {
        condiciones.push(`${columna} = ?`);
        valores.push(query[parametro]);
      }
    }

    const where = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
    return db
      .prepare(`${selectBase}${where} ORDER BY ${tabla}.id`)
      .all(...valores)
      .map(mapearFila);
  }

  function crear(body) {
    const datos = construirDatos(campos, validarCuerpo(body), { parcial: false });
    antesDeGuardar(datos);

    const claves = Object.keys(datos);
    const fecha = new Date().toISOString();
    const columnas = [...claves.map((clave) => campos[clave].columna), 'fecha_creacion', 'fecha_actualizacion'];
    const valores = [...claves.map((clave) => datos[clave]), fecha, fecha];

    const { lastInsertRowid } = db
      .prepare(`INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`)
      .run(...valores);

    return obtener(Number(lastInsertRowid));
  }

  function actualizar(id, body) {
    obtener(id);

    const datos = construirDatos(campos, validarCuerpo(body), { parcial: true });
    const claves = Object.keys(datos);
    if (claves.length === 0) {
      throw new ApiError(400, 'No se enviaron campos para actualizar');
    }
    antesDeGuardar(datos);

    const asignaciones = [...claves.map((clave) => `${campos[clave].columna} = ?`), 'fecha_actualizacion = ?'];
    const valores = [...claves.map((clave) => datos[clave]), new Date().toISOString(), id];

    db.prepare(`UPDATE ${tabla} SET ${asignaciones.join(', ')} WHERE id = ?`).run(...valores);
    return obtener(id);
  }

  function eliminar(id) {
    obtener(id);
    db.prepare(`DELETE FROM ${tabla} WHERE id = ?`).run(id);
  }

  return { listar, obtener, crear, actualizar, eliminar };
}

module.exports = { crearServicioCatalogo, construirDatos };
