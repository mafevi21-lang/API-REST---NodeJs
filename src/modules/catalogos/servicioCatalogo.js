'use strict';

const { db, tablaSql } = require('../../db/database');
const { ApiError } = require('../../utils/errores');
const { validarCuerpo, leerEstado, parsearId } = require('../../utils/validar');

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
 * @param {string} opciones.tabla        Nombre de la tabla en PostgreSQL.
 * @param {string} opciones.entidad      Nombre legible para mensajes de error.
 * @param {object} opciones.campos       Mapa campo JSON -> { columna, validar, requerido?, defecto? }.
 * @param {string} [opciones.selectBase] SELECT base (permite JOIN). Por defecto, SELECT de la tabla.
 * @param {Function} [opciones.mapear]   Convierte una fila de la BD en el objeto de respuesta.
 * @param {object} [opciones.filtrables] Parámetros de query -> { columna, validar } para filtrar el listado.
 * @param {Function} [opciones.antesDeGuardar] Validaciones de negocio sobre los datos ya validados.
 */
function crearServicioCatalogo({
  tabla,
  entidad,
  campos,
  selectBase = `SELECT ${tabla}.* FROM ${tablaSql(tabla)}`,
  mapear,
  filtrables = {},
  antesDeGuardar = async () => {},
}) {
  const mapearFila = mapear || mapearPorDefecto(campos);
  const filtros = {
    ...(campos.estado ? { estado: { columna: `${tabla}.estado`, validar: (v) => leerEstado({ estado: v }) } } : {}),
    ...filtrables,
  };

  async function obtener(id) {
    const { rows } = await db.query(`${selectBase} WHERE ${tabla}.id = $1`, [id]);
    if (rows.length === 0) {
      throw new ApiError(404, `${entidad} con id ${id} no encontrado`);
    }
    return mapearFila(rows[0]);
  }

  async function listar(query = {}) {
    const condiciones = [];
    const valores = [];

    for (const [parametro, { columna, validar }] of Object.entries(filtros)) {
      if (typeof query[parametro] === 'string') {
        valores.push(validar(query[parametro]));
        condiciones.push(`${columna} = $${valores.length}`);
      }
    }

    const where = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
    const { rows } = await db.query(`${selectBase}${where} ORDER BY ${tabla}.id`, valores);
    return rows.map(mapearFila);
  }

  async function crear(body) {
    const datos = construirDatos(campos, validarCuerpo(body), { parcial: false });
    await antesDeGuardar(datos);

    const claves = Object.keys(datos);
    const columnas = claves.map((clave) => campos[clave].columna);
    const valores = claves.map((clave) => datos[clave]);
    const marcadores = columnas.map((_, i) => `$${i + 1}`);

    const { rows } = await db.query(
      `INSERT INTO ${tablaSql(tabla)} (${columnas.join(', ')}) VALUES (${marcadores.join(', ')}) RETURNING id`,
      valores,
    );
    return obtener(rows[0].id);
  }

  async function actualizar(id, body) {
    await obtener(id);

    const datos = construirDatos(campos, validarCuerpo(body), { parcial: true });
    const claves = Object.keys(datos);
    if (claves.length === 0) {
      throw new ApiError(400, 'No se enviaron campos para actualizar');
    }
    await antesDeGuardar(datos);

    const asignaciones = claves.map((clave, i) => `${campos[clave].columna} = $${i + 1}`);
    const valores = claves.map((clave) => datos[clave]);
    valores.push(id);

    await db.query(
      `UPDATE ${tablaSql(tabla)} SET ${asignaciones.join(', ')}, fecha_actualizacion = now() WHERE id = $${valores.length}`,
      valores,
    );
    return obtener(id);
  }

  async function eliminar(id) {
    await obtener(id);
    await db.query(`DELETE FROM ${tablaSql(tabla)} WHERE id = $1`, [id]);
  }

  return { listar, obtener, crear, actualizar, eliminar };
}

module.exports = { crearServicioCatalogo, construirDatos };
