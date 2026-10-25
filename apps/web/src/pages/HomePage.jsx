import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Pencil, UserRoundCheck } from 'lucide-react';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg px-5 py-8 text-text">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold tracking-tight">
            Duo<span className="text-accent">LAS</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted"
          >
            <LogOut size={15} aria-hidden="true" />
            Salir
          </button>
        </header>

        <EmailVerificationBanner />

        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Tu cuenta</p>
          <h1 className="mt-2 text-2xl font-bold">Hola, {user?.username}</h1>
          <p className="mt-2 text-sm text-muted">{user?.email}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-xs text-muted">Email</p>
              <p className="mt-1 text-sm font-semibold">
                {user?.emailVerified ? 'Verificado' : 'Pendiente de verificación'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-xs text-muted">Perfil</p>
              <p className="mt-1 text-sm font-semibold">
                {user?.profileCompleted ? 'Completo' : 'Incompleto'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {user?.profileCompleted ? (
              <Link
                to="/onboarding"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold"
              >
                <Pencil size={16} aria-hidden="true" />
                Editar perfil
              </Link>
            ) : (
              <Link
                to="/onboarding"
                className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg"
              >
                <UserRoundCheck size={16} aria-hidden="true" />
                Completar perfil
              </Link>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold">Próximamente</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            En la Fase 2 vas a poder ver candidatos, dar like y concretar tu primer duo. Por ahora
            dejá tu perfil completo y tu email verificado.
          </p>
        </section>
      </div>
    </div>
  );
}
