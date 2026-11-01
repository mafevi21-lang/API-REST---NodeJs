'use strict';

// Crea las tablas y los datos iniciales en la base configurada en DATABASE_URL.
const { inicializar, cerrar } = require('./database');

inicializar()
  .then(() => {
    console.log('Base de datos lista: tablas y datos iniciales creados.');
    return cerrar();
  })
  .catch(async (err) => {
    console.error('Error al inicializar la base de datos:', err.message);
    await cerrar();
    process.exit(1);
  });
