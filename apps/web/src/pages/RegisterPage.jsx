import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    ageConfirmed: false,
    termsAccepted: false,
  });
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const captchaRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const setField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (siteKey && !captchaToken) {
      setError('Completá el captcha para continuar.');
      return;
    }

    setSubmitting(true);

    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        ageConfirmed: form.ageConfirmed,
        termsAccepted: form.termsAccepted,
        ...(captchaToken ? { captchaToken } : {}),
      });
      navigate('/onboarding', { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'No pudimos crear tu cuenta. Intentá de nuevo.'
      );
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Solo para mayores de 18 años. Gratis y exclusivo para el servidor LAS."
      footer={
        <p>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-semibold text-accent">
            Iniciar sesión
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
          Nombre de usuario
          <input
            className={`${inputClass} mt-2`}
            value={form.username}
            onChange={setField('username')}
            autoComplete="username"
            minLength={3}
            maxLength={20}
            required
          />
        </label>

        <label className="block text-sm font-semibold">
          Email
          <input
            type="email"
            className={`${inputClass} mt-2`}
            value={form.email}
            onChange={setField('email')}
            autoComplete="email"
            required
          />
        </label>

        <label className="block text-sm font-semibold">
          Contraseña
          <input
            type="password"
            className={`${inputClass} mt-2`}
            value={form.password}
            onChange={setField('password')}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>

        <label className="block text-sm font-semibold">
          Repetir contraseña
          <input
            type="password"
            className={`${inputClass} mt-2`}
            value={form.confirmPassword}
            onChange={setField('confirmPassword')}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>

        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.ageConfirmed}
            onChange={setField('ageConfirmed')}
            className="mt-1 h-4 w-4 accent-[#00c2b8]"
            required
          />
          <span>Confirmo que soy mayor de 18 años.</span>
        </label>

        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.termsAccepted}
            onChange={setField('termsAccepted')}
            className="mt-1 h-4 w-4 accent-[#00c2b8]"
            required
          />
          <span>
            Acepto los{' '}
            <Link to="/terminos" className="text-accent underline">
              términos de uso
            </Link>{' '}
            y la{' '}
            <Link to="/privacidad" className="text-accent underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>

        {siteKey ? (
          <div className="flex justify-center">
            <HCaptcha
              ref={captchaRef}
              sitekey={siteKey}
              theme="dark"
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken('')}
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
