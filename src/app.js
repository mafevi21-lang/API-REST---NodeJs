'use strict';

const path = require('node:path');
const express = require('express');
const { manejadorNoEncontrado, manejadorErrores } = require('./middlewares/manejadorErrores');
const generosRutas = require('./modules/generos/generos');
const directoresRutas = require('./modules/directores/directores');
const productorasRutas = require('./modules/productoras/productoras');
const tiposRutas = require('./modules/tipos/tipos');
const mediosRutas = require('./modules/medios/medios');

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) => {
  res.json({
    nombre: 'API de películas y series',
    recursos: ['/api/generos', '/api/directores', '/api/productoras', '/api/tipos', '/api/medios'],
  });
});

app.use('/api/generos', generosRutas);
app.use('/api/directores', directoresRutas);
app.use('/api/productoras', productorasRutas);
app.use('/api/tipos', tiposRutas);
app.use('/api/medios', mediosRutas);

app.use(manejadorNoEncontrado);
app.use(manejadorErrores);

module.exports = app;
