'use strict';

const express = require('express');
const { parsearId } = require('../../utils/validar');

// Expone los verbos HTTP de un servicio CRUD.
function crearRutasCatalogo(servicio) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json(servicio.listar(req.query));
  });

  router.get('/:id', (req, res) => {
    res.json(servicio.obtener(parsearId(req.params.id)));
  });

  router.post('/', (req, res) => {
    res.status(201).json(servicio.crear(req.body));
  });

  router.put('/:id', (req, res) => {
    res.json(servicio.actualizar(parsearId(req.params.id), req.body));
  });

  router.patch('/:id', (req, res) => {
    res.json(servicio.actualizar(parsearId(req.params.id), req.body));
  });

  router.delete('/:id', (req, res) => {
    servicio.eliminar(parsearId(req.params.id));
    res.status(204).end();
  });

  return router;
}

module.exports = { crearRutasCatalogo };
