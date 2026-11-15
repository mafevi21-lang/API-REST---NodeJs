import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const FORMULARIO_VACIO = {
  titulo: '',
  sinopsis: '',
  url: '',
  imagenPortada: '',
  anioEstreno: '',
  tipoId: '',
  generoId: '',
  directorId: '',
  productoraId: '',
};

// Agrega al menú la opción del registro actual aunque su catálogo esté inactivo,
// para que al editar no se pierda el valor que ya tenía el medio.
function opciones(lista, actual, texto) {
  const existe = actual && lista.some((item) => item.id === actual.id);
  const base = lista.map((item) => ({ id: item.id, texto: texto(item) }));
  if (actual && !existe) base.push({ id: actual.id, texto: `${texto(actual)} (inactivo)` });
  return base;
}

function SelectCatalogo({ etiqueta, valor, onChange, items, requerido = true }) {
  return (
    <label>
      {etiqueta}
      <select value={valor} required={requerido} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecciona una opción</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>{item.texto}</option>
        ))}
      </select>
    </label>
  );
}

export default function MediosPage() {
  const [medios, setMedios] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [directores, setDirectores] = useState([]);
  const [productoras, setProductoras] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [medioEditado, setMedioEditado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargarCatalogos = useCallback(async () => {
    const [tiposDatos, generosDatos, directoresDatos, productorasDatos] = await Promise.all([
      api.listar('tipos'),
      api.listar('generos'),
      api.listar('directores'),
      api.listar('productoras'),
    ]);
    setTipos(tiposDatos);
    setGeneros(generosDatos);
    setDirectores(directoresDatos);
    setProductoras(productorasDatos);
  }, []);

  const cargarMedios = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setMedios(await api.listar('medios', { tipoId: filtroTipo, generoId: filtroGenero }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [filtroTipo, filtroGenero]);

  useEffect(() => {
    cargarCatalogos().catch((err) => setError(err.message));
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarMedios();
  }, [cargarMedios]);

  function abrirNuevo() {
    setEditandoId(null);
    setMedioEditado(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarFormulario(true);
    setError('');
    setExito('');
  }

  function abrirEdicion(medio) {
    setEditandoId(medio.id);
    setMedioEditado(medio);
    setFormulario({
      titulo: medio.titulo,
      sinopsis: medio.sinopsis ?? '',
      url: medio.url,
      imagenPortada: medio.imagenPortada ?? '',
      anioEstreno: String(medio.anioEstreno),
      tipoId: String(medio.tipo.id),
      generoId: String(medio.genero.id),
      directorId: String(medio.director.id),
      productoraId: String(medio.productora.id),
    });
    setMostrarFormulario(true);
    setError('');
    setExito('');
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
    setMedioEditado(null);
  }

  function actualizarCampo(clave, valor) {
    setFormulario((anterior) => ({ ...anterior, [clave]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    setExito('');

    const cuerpo = {
      titulo: formulario.titulo.trim(),
      sinopsis: formulario.sinopsis.trim() || null,
      url: formulario.url.trim(),
      imagenPortada: formulario.imagenPortada.trim() || null,
      anioEstreno: Number(formulario.anioEstreno),
      tipoId: Number(formulario.tipoId),
      generoId: Number(formulario.generoId),
      directorId: Number(formulario.directorId),
      productoraId: Number(formulario.productoraId),
    };

    try {
      if (editandoId === null) {
        await api.crear('medios', cuerpo);
        setExito('La película o serie se agregó correctamente.');
      } else {
        await api.actualizar('medios', editandoId, cuerpo);
        setExito('La película o serie se actualizó correctamente.');
      }
      cerrarFormulario();
      await Promise.all([cargarMedios(), cargarCatalogos()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(medio) {
    if (!window.confirm(`¿Eliminar "${medio.titulo}"?`)) return;

    setError('');
    setExito('');
    try {
      await api.eliminar('medios', medio.id);
      setExito('La película o serie se eliminó correctamente.');
      await cargarMedios();
    } catch (err) {
      setError(err.message);
    }
  }

  const generosActivos = generos.filter((g) => g.estado === 'activo');
  const directoresActivos = directores.filter((d) => d.estado === 'activo');
  const productorasActivas = productoras.filter((p) => p.estado === 'activo');

  return (
    <section className="panel">
      <div className="encabezado-panel">
        <h2>Películas y series</h2>
        <button type="button" onClick={abrirNuevo}>Agregar película o serie</button>
      </div>

      <div className="filtros">
        <label>
          Tipo
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Género
          <select value={filtroGenero} onChange={(e) => setFiltroGenero(e.target.value)}>
            <option value="">Todos</option>
            {generos.map((genero) => (
              <option key={genero.id} value={genero.id}>{genero.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      {exito && <p className="mensaje exito" role="status">{exito}</p>}
      {error && <p className="mensaje error" role="alert">{error}</p>}

      {mostrarFormulario && (
        <form className="formulario" onSubmit={guardar}>
          <h3>{editandoId === null ? 'Nueva película o serie' : 'Editar película o serie'}</h3>
          <div className="campos">
            <label className="ancho">
              Título
              <input
                value={formulario.titulo}
                maxLength={200}
                required
                onChange={(e) => actualizarCampo('titulo', e.target.value)}
              />
            </label>
            <label className="ancho">
              Sinopsis
              <textarea
                value={formulario.sinopsis}
                maxLength={2000}
                onChange={(e) => actualizarCampo('sinopsis', e.target.value)}
              />
            </label>
            <label>
              Año de estreno
              <input
                type="number"
                min={1888}
                max={new Date().getFullYear() + 1}
                value={formulario.anioEstreno}
                required
                onChange={(e) => actualizarCampo('anioEstreno', e.target.value)}
              />
            </label>
            <SelectCatalogo
              etiqueta="Tipo"
              valor={formulario.tipoId}
              onChange={(v) => actualizarCampo('tipoId', v)}
              items={opciones(tipos, medioEditado?.tipo, (t) => t.nombre)}
            />
            <SelectCatalogo
              etiqueta="Género"
              valor={formulario.generoId}
              onChange={(v) => actualizarCampo('generoId', v)}
              items={opciones(generosActivos, medioEditado?.genero, (g) => g.nombre)}
            />
            <SelectCatalogo
              etiqueta="Director"
              valor={formulario.directorId}
              onChange={(v) => actualizarCampo('directorId', v)}
              items={opciones(directoresActivos, medioEditado?.director, (d) => d.nombres)}
            />
            <SelectCatalogo
              etiqueta="Productora"
              valor={formulario.productoraId}
              onChange={(v) => actualizarCampo('productoraId', v)}
              items={opciones(productorasActivas, medioEditado?.productora, (p) => p.nombre)}
            />
            <label className="ancho">
              URL del contenido
              <input
                type="url"
                placeholder="https://..."
                value={formulario.url}
                required
                onChange={(e) => actualizarCampo('url', e.target.value)}
              />
            </label>
            <label className="ancho">
              URL de la imagen de portada (opcional)
              <input
                type="url"
                placeholder="https://..."
                value={formulario.imagenPortada}
                onChange={(e) => actualizarCampo('imagenPortada', e.target.value)}
              />
            </label>
          </div>
          <div className="acciones">
            <button type="submit">Guardar</button>
            <button type="button" className="secundario" onClick={cerrarFormulario}>Cancelar</button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="vacio">Cargando...</p>
      ) : medios.length === 0 ? (
        <p className="vacio">No hay películas o series que coincidan con el filtro.</p>
      ) : (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Año</th>
                <th>Género</th>
                <th>Director</th>
                <th>Productora</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {medios.map((medio) => (
                <tr key={medio.id}>
                  <td>
                    <strong>{medio.titulo}</strong>
                    <div className="serial">{medio.serial}</div>
                  </td>
                  <td>{medio.tipo.nombre}</td>
                  <td>{medio.anioEstreno}</td>
                  <td>{medio.genero.nombre}</td>
                  <td>{medio.director.nombres}</td>
                  <td>{medio.productora.nombre}</td>
                  <td className="acciones-fila">
                    <button type="button" className="secundario" onClick={() => abrirEdicion(medio)}>
                      Editar
                    </button>
                    <button type="button" className="peligro" onClick={() => eliminar(medio)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
