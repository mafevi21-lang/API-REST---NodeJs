'use strict';

const { ApiError } = require('./errores');

const ESTADOS = ['activo', 'inactivo'];

function validarCuerpo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'El cuerpo de la petición debe ser un objeto JSON');
  }
  return body;
}

// undefined: no se envió | null: vacío | string: valor limpio
function leerTexto(body, campo, { max = 255 } = {}) {
  const valor = body[campo];
  if (valor === undefined || valor === null) return valor;
  if (typeof valor !== 'string') {
    throw new ApiError(400, `El campo "${campo}" debe ser texto`);
  }
  const limpio = valor.trim();
  if (limpio === '') return null;
  if (limpio.length > max) {
    throw new ApiError(400, `El campo "${campo}" no puede superar ${max} caracteres`);
  }
  return limpio;
}

function leerEstado(body, campo = 'estado') {
  const valor = leerTexto(body, campo, { max: 20 });
  if (valor === undefined || valor === null) return valor;
  const normalizado = valor.toLowerCase();
  if (!ESTADOS.includes(normalizado)) {
    throw new ApiError(400, `El campo "${campo}" debe ser "activo" o "inactivo"`);
  }
  return normalizado;
}

function leerEntero(body, campo, { min, max } = {}) {
  const valor = body[campo];
  if (valor === undefined || valor === null) return valor;
  if (!Number.isInteger(valor)) {
    throw new ApiError(400, `El campo "${campo}" debe ser un número entero`);
  }
  if (min !== undefined && valor < min) {
    throw new ApiError(400, `El campo "${campo}" debe ser mayor o igual a ${min}`);
  }
  if (max !== undefined && valor > max) {
    throw new ApiError(400, `El campo "${campo}" debe ser menor o igual a ${max}`);
  }
  return valor;
}

function leerUrl(body, campo) {
  const valor = leerTexto(body, campo, { max: 2048 });
  if (valor === undefined || valor === null) return valor;
  let url;
  try {
    url = new URL(valor);
  } catch {
    throw new ApiError(400, `El campo "${campo}" debe ser una URL válida`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ApiError(400, `El campo "${campo}" debe usar http o https`);
  }
  return url.href;
}

function parsearId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(400, 'El id debe ser un número entero positivo');
  }
  return id;
}

module.exports = {
  ESTADOS,
  validarCuerpo,
  leerTexto,
  leerEstado,
  leerEntero,
  leerUrl,
  parsearId,
};
