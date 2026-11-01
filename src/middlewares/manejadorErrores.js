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

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con ese valor único (serial, url o nombre)' });
  }

  // ON DELETE RESTRICT llega como SQLITE_CONSTRAINT_TRIGGER en better-sqlite3
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || /FOREIGN KEY constraint failed/.test(err.message)) {
    return res.status(409).json({
      mensaje: 'La operación no se puede completar porque el registro está en uso por medios existentes',
    });
  }

  console.error(err);
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = { manejadorNoEncontrado, manejadorErrores };
