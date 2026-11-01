'use strict';

const app = require('./app');
const { inicializar } = require('./db/database');

const PUERTO = Number(process.env.PORT) || 3000;

inicializar()
  .then(() => {
    app.listen(PUERTO, () => {
      console.log(`API de películas escuchando en http://localhost:${PUERTO}/api`);
    });
  })
  .catch((err) => {
    console.error('No se pudo preparar la base de datos. Revisa DATABASE_URL.');
    console.error(err.message);
    process.exit(1);
  });
