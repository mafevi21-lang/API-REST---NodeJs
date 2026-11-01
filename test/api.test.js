'use strict';

// Base de datos en memoria para que las pruebas no toquen data/peliculas.db
process.env.DB_PATH = ':memory:';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let servidor;
let base;

before(() => new Promise((resolve) => {
  servidor = app.listen(0, '127.0.0.1', () => {
    base = `http://127.0.0.1:${servidor.address().port}/api`;
    resolve();
  });
}));

after(() => new Promise((resolve) => servidor.close(resolve)));

async function peticion(metodo, ruta, cuerpo) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: cuerpo === undefined ? {} : { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await res.text();
  return { status: res.status, cuerpo: texto ? JSON.parse(texto) : null };
}

test('la base de datos arranca con los géneros y tipos iniciales', async () => {
  const generos = await peticion('GET', '/generos');
  assert.equal(generos.status, 200);
  assert.deepEqual(
    generos.cuerpo.map((g) => g.nombre),
    ['Acción', 'Aventura', 'Ciencia ficción', 'Drama', 'Terror'],
  );

  const tipos = await peticion('GET', '/tipos');
  assert.deepEqual(tipos.cuerpo.map((t) => t.nombre), ['Película', 'Serie']);
});

test('CRUD de géneros: crear, duplicado, actualizar y filtrar por estado', async () => {
  const creado = await peticion('POST', '/generos', { nombre: 'Comedia', descripcion: 'Humor' });
  assert.equal(creado.status, 201);
  assert.equal(creado.cuerpo.estado, 'activo');
  assert.ok(creado.cuerpo.fechaCreacion);

  const duplicado = await peticion('POST', '/generos', { nombre: 'Comedia' });
  assert.equal(duplicado.status, 409);

  const actualizado = await peticion('PUT', `/generos/${creado.cuerpo.id}`, { estado: 'Inactivo' });
  assert.equal(actualizado.status, 200);
  assert.equal(actualizado.cuerpo.estado, 'inactivo');
  assert.equal(actualizado.cuerpo.nombre, 'Comedia');

  const inactivos = await peticion('GET', '/generos?estado=inactivo');
  assert.ok(inactivos.cuerpo.some((g) => g.id === creado.cuerpo.id));

  const borrado = await peticion('DELETE', `/generos/${creado.cuerpo.id}`);
  assert.equal(borrado.status, 204);
});

test('validaciones de entrada y recursos inexistentes', async () => {
  const sinNombre = await peticion('POST', '/directores', { estado: 'activo' });
  assert.equal(sinNombre.status, 400);

  const estadoInvalido = await peticion('POST', '/productoras', { nombre: 'Disney', estado: 'pendiente' });
  assert.equal(estadoInvalido.status, 400);

  const idInvalido = await peticion('GET', '/generos/abc');
  assert.equal(idInvalido.status, 400);

  const noExiste = await peticion('GET', '/tipos/9999');
  assert.equal(noExiste.status, 404);

  const sinCampos = await peticion('PUT', '/tipos/1', {});
  assert.equal(sinCampos.status, 400);
});

test('medios: solo acepta catálogos activos y respeta referencias', async () => {
  const director = await peticion('POST', '/directores', { nombres: 'Christopher Nolan' });
  const productora = await peticion('POST', '/productoras', {
    nombre: 'Warner Bros.',
    slogan: 'Del mismo modo',
    descripcion: 'Estudio de cine',
  });
  const generoInactivo = await peticion('POST', '/generos', { nombre: 'Western', estado: 'inactivo' });
  assert.equal(generoInactivo.status, 201);

  const datosBase = {
    titulo: 'Interstellar',
    sinopsis: 'Un grupo de exploradores viaja a través de un agujero de gusano.',
    url: 'https://ejemplo.com/peliculas/interstellar',
    imagenPortada: 'https://ejemplo.com/img/interstellar.jpg',
    anioEstreno: 2014,
    directorId: director.cuerpo.id,
    productoraId: productora.cuerpo.id,
    tipoId: 1,
  };

  const conGeneroInactivo = await peticion('POST', '/medios', { ...datosBase, generoId: generoInactivo.cuerpo.id });
  assert.equal(conGeneroInactivo.status, 422);

  const creado = await peticion('POST', '/medios', { ...datosBase, generoId: 3 });
  assert.equal(creado.status, 201);
  assert.match(creado.cuerpo.serial, /^MED-[0-9A-F]{8}$/);
  assert.equal(creado.cuerpo.genero.nombre, 'Ciencia ficción');
  assert.equal(creado.cuerpo.director.nombres, 'Christopher Nolan');
  assert.equal(creado.cuerpo.tipo.nombre, 'Película');

  const urlRepetida = await peticion('POST', '/medios', { ...datosBase, generoId: 3, serial: 'OTRO-1' });
  assert.equal(urlRepetida.status, 409);

  const urlInvalida = await peticion('POST', '/medios', { ...datosBase, url: 'no-es-url', generoId: 3 });
  assert.equal(urlInvalida.status, 400);

  const actualizado = await peticion('PATCH', `/medios/${creado.cuerpo.id}`, { titulo: 'Interstellar (Remasterizada)' });
  assert.equal(actualizado.status, 200);
  assert.equal(actualizado.cuerpo.titulo, 'Interstellar (Remasterizada)');

  const filtrado = await peticion('GET', `/medios?generoId=3&tipoId=1`);
  assert.ok(filtrado.cuerpo.some((m) => m.id === creado.cuerpo.id));

  const catalogoEnUso = await peticion('DELETE', `/directores/${director.cuerpo.id}`);
  assert.equal(catalogoEnUso.status, 409);

  const borrado = await peticion('DELETE', `/medios/${creado.cuerpo.id}`);
  assert.equal(borrado.status, 204);

  const despues = await peticion('DELETE', `/directores/${director.cuerpo.id}`);
  assert.equal(despues.status, 204);
});

test('rutas inexistentes responden 404 en JSON', async () => {
  const res = await peticion('GET', '/no-existe');
  assert.equal(res.status, 404);
  assert.ok(res.cuerpo.mensaje);
});
