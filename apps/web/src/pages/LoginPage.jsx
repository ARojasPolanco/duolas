import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const flash = sessionStorage.getItem('flashMessage');
    if (flash) {
      setError(flash);
      sessionStorage.removeItem('flashMessage');
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(identifier.trim(), password);
      const from = location.state?.from;
      const destination = user.profileCompleted ? from || '/inicio' : '/onboarding';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'No pudimos iniciar sesión. Intentá de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Entrá para ver tus matches y tu disponibilidad."
      footer={
        <div className="space-y-2">
          <p>
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="font-semibold text-accent">
              Crear cuenta
            </Link>
          </p>
          <p>
            <Link to="/forgot-password" className="text-muted underline">
              Olvidé mi contraseña
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <label className="block text-sm font-semibold">
          Email o nombre de usuario
          <input
            className={`${inputClass} mt-2`}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="block text-sm font-semibold">
          Contraseña
          <input
            type="password"
            className={`${inputClass} mt-2`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
