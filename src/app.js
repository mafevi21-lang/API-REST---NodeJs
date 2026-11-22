'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { manejadorNoEncontrado, manejadorErrores } = require('./middlewares/manejadorErrores');
const generosRutas = require('./modules/generos/generos');
const directoresRutas = require('./modules/directores/directores');
const productorasRutas = require('./modules/productoras/productoras');
const tiposRutas = require('./modules/tipos/tipos');
const mediosRutas = require('./modules/medios/medios');

// Si existe el build de React (frontend/dist), se sirve esa aplicación.
// Si no, se sirve la interfaz sencilla de src/public.
const CARPETA_BUILD = path.join(__dirname, '..', 'frontend', 'dist');
const CARPETA_WEB = fs.existsSync(CARPETA_BUILD) ? CARPETA_BUILD : path.join(__dirname, 'public');

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.static(CARPETA_WEB));

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

// Rutas de la aplicación en el navegador (por ejemplo /medios): devuelven la página principal
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
  res.sendFile(path.join(CARPETA_WEB, 'index.html'));
});

app.use(manejadorNoEncontrado);
app.use(manejadorErrores);

module.exports = app;
