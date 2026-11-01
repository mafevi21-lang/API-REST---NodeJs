'use strict';

const { crearServicioCatalogo } = require('../catalogos/servicioCatalogo');
const { crearRutasCatalogo } = require('../catalogos/rutasCatalogo');
const { leerTexto, leerEstado } = require('../../utils/validar');

const servicio = crearServicioCatalogo({
  tabla: 'directores',
  entidad: 'Director',
  campos: {
    nombres: { columna: 'nombres', requerido: true, validar: (b) => leerTexto(b, 'nombres', { max: 150 }) },
    estado: { columna: 'estado', defecto: 'activo', validar: (b) => leerEstado(b) },
  },
});

module.exports = crearRutasCatalogo(servicio);
