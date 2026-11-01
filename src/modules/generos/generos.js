'use strict';

const { crearServicioCatalogo } = require('../catalogos/servicioCatalogo');
const { crearRutasCatalogo } = require('../catalogos/rutasCatalogo');
const { leerTexto, leerEstado } = require('../../utils/validar');

const servicio = crearServicioCatalogo({
  tabla: 'generos',
  entidad: 'Género',
  campos: {
    nombre: { columna: 'nombre', requerido: true, validar: (b) => leerTexto(b, 'nombre', { max: 100 }) },
    descripcion: { columna: 'descripcion', validar: (b) => leerTexto(b, 'descripcion', { max: 500 }) },
    estado: { columna: 'estado', defecto: 'activo', validar: (b) => leerEstado(b) },
  },
});

module.exports = crearRutasCatalogo(servicio);
