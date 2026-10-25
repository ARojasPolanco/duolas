import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PlaceholderPage
            title="Iniciar sesión"
            description="El formulario de login llega en la Fase 1."
          />
        }
      />
      <Route
        path="/register"
        element={
          <PlaceholderPage
            title="Crear cuenta"
            description="El registro con confirmación +18 llega en la Fase 1."
          />
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
