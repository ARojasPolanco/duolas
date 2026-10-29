import { Route, Routes } from 'react-router-dom';
import AccountDeletedPage from './pages/AccountDeletedPage.jsx';
import AramPage from './pages/AramPage.jsx';
import AdminMetricsPage from './pages/AdminMetricsPage.jsx';
import AdminOverviewPage from './pages/AdminOverviewPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import AdminUserDetailPage from './pages/AdminUserDetailPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AvailabilityPage from './pages/AvailabilityPage.jsx';
import DuoPostsPage from './pages/DuoPostsPage.jsx';
import HomePage from './pages/HomePage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import InvitesPage from './pages/InvitesPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MatchPage from './pages/MatchPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { privacySections, riotSections, termsSections } from './content/legal.js';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/como-funciona" element={<HowItWorksPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/cuenta-eliminada" element={<AccountDeletedPage />} />
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
        path="/perfil"
        element={
          <ProtectedRoute>
            <ProfilePage />
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
        path="/aram"
        element={
          <ProtectedRoute>
            <AramPage />
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
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios/:id"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminUserDetailPage />
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
