// Cliente HTTP para la API de Node.js. Todas las rutas empiezan por /api.

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

export async function peticion(ruta, { metodo = 'GET', cuerpo } = {}) {
  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: cuerpo === undefined ? {} : { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(datos?.mensaje || 'No se pudo completar la operación', respuesta.status);
  }
  return datos;
}

export const api = {
  listar: (recurso, query = {}) => {
    const parametros = new URLSearchParams(
      Object.entries(query).filter(([, valor]) => valor !== '' && valor != null),
    ).toString();
    return peticion(`/${recurso}${parametros ? `?${parametros}` : ''}`);
  },
  obtener: (recurso, id) => peticion(`/${recurso}/${id}`),
  crear: (recurso, cuerpo) => peticion(`/${recurso}`, { metodo: 'POST', cuerpo }),
  actualizar: (recurso, id, cuerpo) => peticion(`/${recurso}/${id}`, { metodo: 'PUT', cuerpo }),
  eliminar: (recurso, id) => peticion(`/${recurso}/${id}`, { metodo: 'DELETE' }),
};
