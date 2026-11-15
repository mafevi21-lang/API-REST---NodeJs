import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { CATALOGOS } from './catalogos.js';
import CatalogoPage from './pages/CatalogoPage.jsx';
import MediosPage from './pages/MediosPage.jsx';

export default function App() {
  return (
    <>
      <header className="cabecera">
        <h1>Administración de películas y series</h1>
        <nav>
          <NavLink to="/medios">Películas y series</NavLink>
          <NavLink to="/generos">Géneros</NavLink>
          <NavLink to="/directores">Directores</NavLink>
          <NavLink to="/productoras">Productoras</NavLink>
          <NavLink to="/tipos">Tipos</NavLink>
        </nav>
      </header>

      <main className="contenido">
        <Routes>
          <Route path="/" element={<Navigate to="/medios" replace />} />
          <Route path="/medios" element={<MediosPage />} />
          {Object.entries(CATALOGOS).map(([ruta, config]) => (
            <Route key={ruta} path={`/${ruta}`} element={<CatalogoPage config={config} />} />
          ))}
          <Route path="*" element={<p className="vacio">Página no encontrada.</p>} />
        </Routes>
      </main>
    </>
  );
}
