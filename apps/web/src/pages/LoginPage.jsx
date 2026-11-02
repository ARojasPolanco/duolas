import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

const REMEMBERED_IDENTIFIER_KEY = 'duo_login_identifier';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(
    () => localStorage.getItem(REMEMBERED_IDENTIFIER_KEY) || ''
  );
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() =>
    Boolean(localStorage.getItem(REMEMBERED_IDENTIFIER_KEY))
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const flash = sessionStorage.getItem('flashMessage');
    if (flash) {
      setError(flash);
      sessionStorage.removeItem('flashMessage');
    }
  }, []);

  const handleRememberChange = (event) => {
    const checked = event.target.checked;
    setRemember(checked);

    if (!checked) {
      localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const trimmedIdentifier = identifier.trim();
      const { user, recovered } = await login(trimmedIdentifier, password);

      if (remember) {
        localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, trimmedIdentifier);
      } else {
        localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY);
      }

      const from = location.state?.from;
      const destination =
        user.role === 'admin'
          ? from?.startsWith('/admin')
            ? from
            : '/admin'
          : user.profileCompleted
            ? from || '/inicio'
            : '/onboarding';

      if (recovered) {
        toast.success('Recuperamos tu cuenta. La eliminación fue cancelada.');
      }

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
        <p>
          ¿No tenés cuenta?{' '}
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center font-semibold text-accent"
          >
            Crear cuenta
          </Link>
        </p>
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
            name="username"
            required
          />
        </label>

        <PasswordField
          label="Contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          name="password"
          action={
            <Link
              to="/forgot-password"
              className="inline-flex min-h-11 items-center text-xs font-semibold text-accent"
            >
              ¿Has olvidado tu contraseña?
            </Link>
          }
        />

        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={handleRememberChange}
            className="mt-0.5 h-4 w-4 accent-[#b0cf5c]"
          />
          <span>
            Recordarme
            <span className="mt-0.5 block text-[11px] font-normal leading-relaxed text-muted/80">
              Guardamos tu email o usuario, nunca tu contraseña.
            </span>
          </span>
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
