'use strict';

const express = require('express');
const { parsearId } = require('../../utils/validar');

// Expone los verbos HTTP de un servicio CRUD.
function crearRutasCatalogo(servicio) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    res.json(await servicio.listar(req.query));
  });

  router.get('/:id', async (req, res) => {
    res.json(await servicio.obtener(parsearId(req.params.id)));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await servicio.crear(req.body));
  });

  router.put('/:id', async (req, res) => {
    res.json(await servicio.actualizar(parsearId(req.params.id), req.body));
  });

  router.patch('/:id', async (req, res) => {
    res.json(await servicio.actualizar(parsearId(req.params.id), req.body));
  });

  router.delete('/:id', async (req, res) => {
    await servicio.eliminar(parsearId(req.params.id));
    res.status(204).end();
  });

  return router;
}

module.exports = { crearRutasCatalogo };
