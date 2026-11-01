'use strict';

const { crearServicioCatalogo } = require('../catalogos/servicioCatalogo');
const { crearRutasCatalogo } = require('../catalogos/rutasCatalogo');
const { leerTexto } = require('../../utils/validar');

// El módulo Tipo no tiene estado: cualquier tipo existente puede asignarse a un medio.
const servicio = crearServicioCatalogo({
  tabla: 'tipos',
  entidad: 'Tipo',
  campos: {
    nombre: { columna: 'nombre', requerido: true, validar: (b) => leerTexto(b, 'nombre', { max: 100 }) },
    descripcion: { columna: 'descripcion', validar: (b) => leerTexto(b, 'descripcion', { max: 500 }) },
  },
});

module.exports = crearRutasCatalogo(servicio);
