import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const ESTADOS = [
  { valor: 'activo', texto: 'Activo' },
  { valor: 'inactivo', texto: 'Inactivo' },
];

// Pantalla genérica de consulta, alta, edición y borrado para los catálogos.
export default function CatalogoPage({ config }) {
  const [registros, setRegistros] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await api.listar(config.recurso, config.conEstado ? { estado: filtroEstado } : {});
      setRegistros(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [config, filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function formularioVacio() {
    const vacio = Object.fromEntries(config.campos.map((campo) => [campo.clave, '']));
    if (config.conEstado) vacio.estado = 'activo';
    return vacio;
  }

  function abrirNuevo() {
    setEditandoId(null);
    setFormulario(formularioVacio());
    setMostrarFormulario(true);
    setError('');
    setExito('');
  }

  function abrirEdicion(registro) {
    const valores = Object.fromEntries(
      config.campos.map((campo) => [campo.clave, registro[campo.clave] ?? '']),
    );
    if (config.conEstado) valores.estado = registro.estado;
    setEditandoId(registro.id);
    setFormulario(valores);
    setMostrarFormulario(true);
    setError('');
    setExito('');
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
  }

  function actualizarCampo(clave, valor) {
    setFormulario((anterior) => ({ ...anterior, [clave]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    setExito('');

    const cuerpo = Object.fromEntries(
      config.campos.map((campo) => [campo.clave, formulario[campo.clave].trim() || null]),
    );
    if (config.conEstado) cuerpo.estado = formulario.estado;

    try {
      if (editandoId === null) {
        await api.crear(config.recurso, cuerpo);
        setExito(`Se agregó el ${config.singular} correctamente.`);
      } else {
        await api.actualizar(config.recurso, editandoId, cuerpo);
        setExito(`Se actualizó el ${config.singular} correctamente.`);
      }
      cerrarFormulario();
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(registro) {
    const etiqueta = registro[config.campos[0].clave];
    if (!window.confirm(`¿Eliminar el ${config.singular} "${etiqueta}"?`)) return;

    setError('');
    setExito('');
    try {
      await api.eliminar(config.recurso, registro.id);
      setExito(`Se eliminó el ${config.singular} correctamente.`);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel">
      <div className="encabezado-panel">
        <h2>{config.titulo}</h2>
        <button type="button" onClick={abrirNuevo}>Agregar {config.singular}</button>
      </div>

      {config.conEstado && (
        <div className="filtros">
          <label>
            Estado
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              {ESTADOS.map((estado) => (
                <option key={estado.valor} value={estado.valor}>{estado.texto}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {exito && <p className="mensaje exito" role="status">{exito}</p>}
      {error && <p className="mensaje error" role="alert">{error}</p>}

      {mostrarFormulario && (
        <form className="formulario" onSubmit={guardar}>
          <h3>{editandoId === null ? `Nuevo ${config.singular}` : `Editar ${config.singular}`}</h3>
          <div className="campos">
            {config.campos.map((campo) => (
              <label key={campo.clave} className={campo.tipo === 'textarea' ? 'ancho' : ''}>
                {campo.titulo}
                {campo.tipo === 'textarea' ? (
                  <textarea
                    value={formulario[campo.clave] ?? ''}
                    maxLength={campo.maximo}
                    required={campo.requerido}
                    onChange={(e) => actualizarCampo(campo.clave, e.target.value)}
                  />
                ) : (
                  <input
                    value={formulario[campo.clave] ?? ''}
                    maxLength={campo.maximo}
                    required={campo.requerido}
                    onChange={(e) => actualizarCampo(campo.clave, e.target.value)}
                  />
                )}
              </label>
            ))}
            {config.conEstado && (
              <label>
                Estado
                <select value={formulario.estado} onChange={(e) => actualizarCampo('estado', e.target.value)}>
                  {ESTADOS.map((estado) => (
                    <option key={estado.valor} value={estado.valor}>{estado.texto}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="acciones">
            <button type="submit">Guardar</button>
            <button type="button" className="secundario" onClick={cerrarFormulario}>Cancelar</button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="vacio">Cargando...</p>
      ) : registros.length === 0 ? (
        <p className="vacio">No hay registros para mostrar.</p>
      ) : (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                {config.columnas.map((columna) => (
                  <th key={columna.clave}>{columna.titulo}</th>
                ))}
                {config.conEstado && <th>Estado</th>}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id}>
                  {config.columnas.map((columna) => (
                    <td key={columna.clave}>{registro[columna.clave] || '—'}</td>
                  ))}
                  {config.conEstado && (
                    <td>
                      <span className={`etiqueta ${registro.estado}`}>{registro.estado}</span>
                    </td>
                  )}
                  <td className="acciones-fila">
                    <button type="button" className="secundario" onClick={() => abrirEdicion(registro)}>
                      Editar
                    </button>
                    <button type="button" className="peligro" onClick={() => eliminar(registro)}>
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
