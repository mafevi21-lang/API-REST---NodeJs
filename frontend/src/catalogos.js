// Configuración de las pantallas de catálogos. Cada entrada describe el recurso de la API,
// las columnas de la tabla y los campos del formulario.

export const CATALOGOS = {
  generos: {
    recurso: 'generos',
    titulo: 'Géneros',
    singular: 'género',
    conEstado: true,
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'descripcion', titulo: 'Descripción' },
    ],
    campos: [
      { clave: 'nombre', titulo: 'Nombre', requerido: true, maximo: 100 },
      { clave: 'descripcion', titulo: 'Descripción', tipo: 'textarea', maximo: 500 },
    ],
  },
  directores: {
    recurso: 'directores',
    titulo: 'Directores',
    singular: 'director',
    conEstado: true,
    columnas: [{ clave: 'nombres', titulo: 'Nombres' }],
    campos: [{ clave: 'nombres', titulo: 'Nombres', requerido: true, maximo: 150 }],
  },
  productoras: {
    recurso: 'productoras',
    titulo: 'Productoras',
    singular: 'productora',
    conEstado: true,
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'slogan', titulo: 'Slogan' },
    ],
    campos: [
      { clave: 'nombre', titulo: 'Nombre', requerido: true, maximo: 100 },
      { clave: 'slogan', titulo: 'Slogan', maximo: 200 },
      { clave: 'descripcion', titulo: 'Descripción', tipo: 'textarea', maximo: 500 },
    ],
  },
  tipos: {
    recurso: 'tipos',
    titulo: 'Tipos',
    singular: 'tipo',
    conEstado: false,
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'descripcion', titulo: 'Descripción' },
    ],
    campos: [
      { clave: 'nombre', titulo: 'Nombre', requerido: true, maximo: 100 },
      { clave: 'descripcion', titulo: 'Descripción', tipo: 'textarea', maximo: 500 },
    ],
  },
};
