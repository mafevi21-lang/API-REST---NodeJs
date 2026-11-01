'use strict';

const { crearServicioCatalogo } = require('../catalogos/servicioCatalogo');
const { crearRutasCatalogo } = require('../catalogos/rutasCatalogo');
const { leerTexto, leerEstado } = require('../../utils/validar');

const servicio = crearServicioCatalogo({
  tabla: 'productoras',
  entidad: 'Productora',
  campos: {
    nombre: { columna: 'nombre', requerido: true, validar: (b) => leerTexto(b, 'nombre', { max: 100 }) },
    estado: { columna: 'estado', defecto: 'activo', validar: (b) => leerEstado(b) },
    slogan: { columna: 'slogan', validar: (b) => leerTexto(b, 'slogan', { max: 200 }) },
    descripcion: { columna: 'descripcion', validar: (b) => leerTexto(b, 'descripcion', { max: 500 }) },
  },
});

module.exports = crearRutasCatalogo(servicio);
