'use strict';

const { ApiError } = require('../utils/errores');

function manejadorNoEncontrado(req, res) {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  if (err instanceof ApiError) {
    const cuerpo = { mensaje: err.message };
    if (err.detalles) cuerpo.detalles = err.detalles;
    return res.status(err.status).json(cuerpo);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es JSON válido' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'El cuerpo de la petición es demasiado grande' });
  }

  // Códigos de error de PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con ese valor único (serial, url o nombre)' });
  }

  // 23001: ON DELETE RESTRICT; 23503: violación de clave foránea
  if (err.code === '23001' || err.code === '23503') {
    return res.status(409).json({
      mensaje: 'La operación no se puede completar porque el registro está en uso por medios existentes',
    });
  }

  if (err.code === '22P02') {
    return res.status(400).json({ mensaje: 'Uno de los valores no tiene el formato esperado' });
  }

  console.error(err);
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = { manejadorNoEncontrado, manejadorErrores };
