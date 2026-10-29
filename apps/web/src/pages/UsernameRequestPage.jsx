import { useCallback, useEffect, useState } from 'react';
import { AtSign, CheckCircle2, Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import { RESERVED_USERNAMES } from '@duo-las/shared/constants';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';

const STATUS_META = {
  pending_user: {
    label: 'Esperando tu propuesta',
    style: 'border-gold/40 bg-gold/10 text-gold',
  },
  pending_admin: {
    label: 'En revisión',
    style: 'border-accent/40 bg-accent/10 text-accent',
  },
  approved: {
    label: 'Aprobado',
    style: 'border-success/40 bg-success/10 text-success',
  },
  rejected: {
    label: 'Rechazado',
    style: 'border-danger/40 bg-danger/10 text-danger',
  },
};

export default function UsernameRequestPage() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/v1/username-changes/mine');
      setRequest(res.data.request);
      setCurrentUsername(res.data.currentUsername || '');
      if (res.data.request?.status === 'approved') {
        await refreshUser();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar la solicitud.');
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const suggested = username.trim();

    if (!/^[\p{L}\p{N}_]{3,20}$/u.test(suggested)) {
      setError('Usá entre 3 y 20 caracteres: letras, números o guión bajo.');
      return;
    }

    if (RESERVED_USERNAMES.includes(suggested.toLowerCase())) {
      setError('Ese nombre de usuario está reservado.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post(`/v1/username-changes/${request.id}/suggest`, {
        username: suggested,
      });
      setRequest(res.data.request);
      setUsername('');
      toast.success('Propuesta enviada. La revisa un admin.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos enviar tu propuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell maxWidth="max-w-3xl">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  const meta = request ? STATUS_META[request.status] : null;

  return (
    <AppShell maxWidth="max-w-3xl">
      <div className="space-y-5">
        <header className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Nombre de usuario
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Solicitud de cambio</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Tu nombre actual es <span className="font-semibold text-text">@{currentUsername}</span>.
            Proponé uno nuevo y un admin lo revisa antes de aplicarlo.
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {!request ? (
          <section className="rounded-2xl border border-border bg-surface p-8 text-center">
            <AtSign className="mx-auto text-muted" size={32} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold">No tenés una solicitud activa</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Si un admin te pidió cambiar el nombre, te va a llegar una notificación con el acceso
              a esta pantalla.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {request.status === 'approved' ? (
                  <CheckCircle2 className="text-success" size={24} aria-hidden="true" />
                ) : request.status === 'rejected' ? (
                  <ShieldAlert className="text-danger" size={24} aria-hidden="true" />
                ) : (
                  <Clock3 className="text-accent" size={24} aria-hidden="true" />
                )}
                <div>
                  <h2 className="text-lg font-bold">Tu solicitud</h2>
                  <p className="text-xs text-muted">
                    Creada el{' '}
                    {new Intl.DateTimeFormat('es-AR', {
                      dateStyle: 'short',
                      timeZone: 'America/Argentina/Buenos_Aires',
                    }).format(new Date(request.createdAt))}
                  </p>
                </div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${meta.style}`}>
                {meta.label}
              </span>
            </div>

            {request.adminNote ? (
              <p className="mt-4 rounded-xl border border-border bg-bg p-4 text-sm leading-relaxed text-muted">
                {request.adminNote}
              </p>
            ) : null}

            {request.status === 'pending_user' ? (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold">
                  Nuevo nombre de usuario
                  <input
                    className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="elegíunnombre"
                    maxLength={20}
                    autoComplete="username"
                  />
                  <span className="mt-1 block text-xs font-normal text-muted">
                    3 a 20 caracteres. Letras, números y guión bajo. No se permiten nombres
                    reservados.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg disabled:opacity-60"
                >
                  {submitting ? 'Enviando...' : 'Enviar propuesta'}
                </button>
              </form>
            ) : null}

            {request.status === 'pending_admin' ? (
              <div className="mt-5 rounded-xl border border-border bg-bg p-4 text-sm">
                <p className="text-muted">
                  Propusiste{' '}
                  <span className="font-bold text-text">@{request.suggestedUsername}</span>. Un
                  admin lo está revisando.
                </p>
              </div>
            ) : null}

            {request.status === 'approved' ? (
              <div className="mt-5 rounded-xl border border-success/40 bg-success/10 p-4 text-sm text-success">
                Tu nombre de usuario ahora es{' '}
                <span className="font-bold">@{request.suggestedUsername}</span>.
              </div>
            ) : null}

            {request.status === 'rejected' ? (
              <div className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                Tu propuesta no fue aprobada.
                {request.resolutionNote ? ` ${request.resolutionNote}` : ''}
              </div>
            ) : null}

            <button
              type="button"
              onClick={load}
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted hover:text-text"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Actualizar estado
            </button>
          </section>
        )}
      </div>
    </AppShell>
  );
}
