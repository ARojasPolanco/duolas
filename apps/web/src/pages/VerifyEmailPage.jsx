import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../config/api.js';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? 'Estamos verificando tu email...' : 'Falta el token de verificación en el link.'
  );
  const called = useRef(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    let active = true;

    const verify = async () => {
      try {
        const res = await api.get('/v1/auth/verify-email', { params: { token } });
        if (!active) return;
        setStatus('success');
        setMessage(res.data.message || 'Email verificado correctamente.');

        if (localStorage.getItem('token')) {
          try {
            await refreshUser();
          } catch (_error) {
            // La cuenta sigue autenticada aunque no se pueda refrescar el perfil.
          }
        }
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
            'El enlace no es válido o expiró. Pedí uno nuevo desde tu perfil.'
        );
      }
    };

    verify();

    return () => {
      active = false;
    };
  }, [token, refreshUser]);

  const destination = user?.profileCompleted ? '/inicio' : '/onboarding';

  return (
    <AuthShell
      title="Verificación de email"
      subtitle="Confirmamos que el email sea tuyo para habilitar las funciones sociales."
      footer={
        <Link to="/login" className="font-semibold text-accent">
          Volver a iniciar sesión
        </Link>
      }
    >
      <div className="space-y-5 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border text-2xl ${
            status === 'success'
              ? 'border-success/40 bg-success/10 text-success'
              : status === 'error'
                ? 'border-danger/40 bg-danger/10 text-danger'
                : 'border-accent/40 bg-accent/10 text-accent'
          }`}
        >
          {status === 'success' ? '✓' : status === 'error' ? '!' : '...'}
        </div>
        <p className="text-sm leading-relaxed text-muted">{message}</p>

        {status === 'success' && user ? (
          <Link
            to={destination}
            className="inline-block rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg"
          >
            Continuar
          </Link>
        ) : null}

        {status === 'error' && user ? (
          <Link
            to="/inicio"
            className="inline-block rounded-xl border border-border px-5 py-3 text-sm font-semibold"
          >
            Ir a mi cuenta
          </Link>
        ) : null}
      </div>
    </AuthShell>
  );
}
