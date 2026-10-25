import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import api from '../config/api.js';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Falta el token en el enlace.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/v1/auth/reset-password', { token, password });
      setMessage(res.data.message);
      setPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'No pudimos restablecer la contraseña. Pedí un enlace nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Elegí una contraseña de al menos 8 caracteres."
      footer={
        <Link to="/login" className="font-semibold text-accent">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {message ? (
          <div className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <label className="block text-sm font-semibold">
          Contraseña nueva
          <input
            type="password"
            className={`${inputClass} mt-2`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Guardando...' : 'Restablecer contraseña'}
        </button>
      </form>
    </AuthShell>
  );
}
