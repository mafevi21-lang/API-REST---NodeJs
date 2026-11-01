'use strict';

const app = require('./app');

const PUERTO = Number(process.env.PORT) || 3000;

app.listen(PUERTO, () => {
  console.log(`API de películas escuchando en http://localhost:${PUERTO}/api`);
});
