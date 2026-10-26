import { Route, Routes } from 'react-router-dom';
import AdminMetricsPage from './pages/AdminMetricsPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import AvailabilityPage from './pages/AvailabilityPage.jsx';
import DuoPostsPage from './pages/DuoPostsPage.jsx';
import HomePage from './pages/HomePage.jsx';
import InvitesPage from './pages/InvitesPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MatchPage from './pages/MatchPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const termsSections = [
  {
    title: 'Elegibilidad',
    body: 'Duo LAS es exclusivamente para personas mayores de 18 años que jueguen en el servidor LAS de League of Legends. Al crear una cuenta confirmás tu edad y la aceptación de estos términos.',
  },
  {
    title: 'Uso de la cuenta',
    body: 'Sos responsable de mantener la confidencialidad de tu contraseña y de la actividad de tu cuenta. No está permitido crear cuentas falsas, suplantar identidades ni usar la plataforma para spam, acoso o fraude.',
  },
  {
    title: 'Contacto y coordinación',
    body: 'El Riot ID y el Discord se revelan únicamente después de una conexión. Duo LAS no organiza partidas, no intermedia pagos y no garantiza resultados dentro del juego.',
  },
  {
    title: 'Moderación',
    body: 'Los reportes pueden derivar en advertencias o suspensiones. Las decisiones de moderación buscan proteger a la comunidad y pueden incluir la suspensión temporal o permanente de la cuenta.',
  },
  {
    title: 'Cambios',
    body: 'Podemos actualizar estos términos para reflejar cambios del producto o de la ley. La versión vigente se publica en esta página.',
  },
];

const privacySections = [
  {
    title: 'Datos que recopilamos',
    body: 'Guardamos el email, username, Riot ID, rango declarado, roles, horarios, idioma, micrófono, estilo de juego, bio y Discord opcional. También registramos eventos técnicos y de producto sin datos de contacto.',
  },
  {
    title: 'Para qué los usamos',
    body: 'Usamos los datos para crear tu perfil, calcular afinidad, mostrar disponibilidad, gestionar invitaciones, postulaciones, feedback, reputación, reportes y notificaciones.',
  },
  {
    title: 'Qué se muestra a otras personas',
    body: 'El perfil público nunca muestra email, Riot ID ni Discord. Esos datos solo se revelan a la persona con la que concretaste una conexión.',
  },
  {
    title: 'Conservación y seguridad',
    body: 'Las contraseñas se guardan con hash bcrypt. Los tokens de verificación y reset se almacenan de forma segura y con vencimiento. Conservamos el historial necesario para métricas, moderación y prevención de abuso.',
  },
  {
    title: 'Tus derechos',
    body: 'Podés solicitar acceso, corrección o eliminación de tu cuenta escribiendo a soporte@duolas.app. Algunas entidades inmutables, como feedbacks y reportes, pueden conservarse por seguridad y moderación.',
  },
];

const riotSections = [
  {
    title: 'Sin afiliación',
    body: 'Duo LAS no está avalado por Riot Games ni está asociado oficialmente con League of Legends. Riot Games y League of Legends son marcas de Riot Games, Inc.',
  },
  {
    title: 'Datos declarados',
    body: 'El rango y los roles son declarados por cada jugador. La plataforma no consulta la API de Riot ni verifica automáticamente la cuenta en el MVP.',
  },
  {
    title: 'Uso de la plataforma',
    body: 'La plataforma no vende cuentas, no ofrece duo boost ni servicios de coaching. Cualquier servicio de ese tipo queda fuera del alcance de Duo LAS.',
  },
];

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/terminos"
        element={
          <LegalPage
            title="Términos de uso"
            intro="Reglas básicas para usar Duo LAS y coordinar tus partidas."
            sections={termsSections}
          />
        }
      />
      <Route
        path="/privacidad"
        element={
          <LegalPage
            title="Política de privacidad"
            intro="Qué datos usamos, para qué y cómo los protegemos."
            sections={privacySections}
          />
        }
      />
      <Route
        path="/aviso-riot"
        element={
          <LegalPage
            title="Aviso de Riot Games"
            intro="Duo LAS es un proyecto independiente para la comunidad de LAS."
            sections={riotSections}
          />
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inicio"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/match"
        element={
          <ProtectedRoute>
            <MatchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <MatchesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/disponible"
        element={
          <ProtectedRoute>
            <AvailabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invitaciones"
        element={
          <ProtectedRoute>
            <InvitesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/busco-1"
        element={
          <ProtectedRoute>
            <DuoPostsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notificaciones"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reportes"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/metrics"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminMetricsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
