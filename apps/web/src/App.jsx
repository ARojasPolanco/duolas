import { Route, Routes } from 'react-router-dom';
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
import OnboardingPage from './pages/OnboardingPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

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
          <PlaceholderPage
            title="Términos de uso"
            description="Los términos legales completos se publican antes del lanzamiento."
          />
        }
      />
      <Route
        path="/privacidad"
        element={
          <PlaceholderPage
            title="Política de privacidad"
            description="La política de privacidad completa se publica antes del lanzamiento."
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
        path="/admin/reportes"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
