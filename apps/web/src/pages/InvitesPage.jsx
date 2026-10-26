import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Copy, Inbox, Lock, X } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import { QUEUE_LABELS, ROLE_LABELS, formatRank, formatRoles, initialsOf } from '../utils/labels.js';

const STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  declined: 'Rechazada',
  cancelled: 'Cancelada',
  expired: 'Vencida',
};

const STATUS_STYLES = {
  pending: 'border-gold/40 bg-gold/10 text-gold',
  accepted: 'border-success/40 bg-success/10 text-success',
  declined: 'border-danger/40 bg-danger/10 text-danger',
  cancelled: 'border-border bg-surface-2 text-muted',
  expired: 'border-border bg-surface-2 text-muted',
};

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));

export default function InvitesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [box, setBox] = useState('incoming');
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [accepted, setAccepted] = useState(null);

  const canInteract = Boolean(user?.emailVerified && user?.profileCompleted);

  const load = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.get('/v1/invites', { params: { box } });
      setInvites(res.data.invites || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar tus invitaciones.');
    } finally {
      setLoading(false);
    }
  }, [box, canInteract]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (value, label) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch (_error) {
      toast.error('No pudimos copiar. Copialo manualmente.');
    }
  };

  const respond = async (invite, action) => {
    setActionId(invite.id);

    try {
      const res = await api.post(`/v1/invites/${invite.id}/${action}`);

      if (action === 'accept') {
        setAccepted({
          username: invite.counterpart.username,
          riotId: res.data.contact?.riotId,
          discordTag: res.data.contact?.discordTag,
        });
        toast.success('Invitación aceptada. Ya pueden coordinar.');
      } else {
        toast.success(action === 'decline' ? 'Invitación rechazada.' : 'Invitación cancelada.');
      }

      setInvites((current) =>
        current.map((item) =>
          item.id === invite.id
            ? {
                ...item,
                status:
                  action === 'accept'
                    ? 'accepted'
                    : action === 'decline'
                      ? 'declined'
                      : 'cancelled',
              }
            : item
        )
      );
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos actualizar la invitación.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <AppShell maxWidth="max-w-4xl">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Invitaciones
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Respondé y coordiná</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Las invitaciones vencen a los 10 minutos. Al aceptar se crea la conexión y se revela el
            contacto.
          </p>
        </div>

        <EmailVerificationBanner />

        {!canInteract ? (
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-bold">Primero completá tu cuenta</h2>
            <p className="mt-2 text-sm text-muted">
              Necesitás el email verificado y el perfil completo para recibir invitaciones.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {!user?.profileCompleted ? (
                <Link
                  to="/onboarding"
                  className="rounded-xl bg-accent px-5 py-3 text-center text-sm font-bold text-bg"
                >
                  Completar perfil
                </Link>
              ) : null}
              {!user?.emailVerified ? (
                <span className="rounded-xl border border-border px-5 py-3 text-center text-sm text-muted">
                  Revisá tu email para verificar la cuenta
                </span>
              ) : null}
            </div>
          </section>
        ) : (
          <>
            {accepted?.riotId ? (
              <section className="rounded-2xl border border-success/40 bg-success/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-success">
                  Contacto revelado
                </p>
                <h2 className="mt-1 text-lg font-bold">{accepted.username}</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => copy(accepted.riotId, 'Riot ID')}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-left"
                  >
                    <span>
                      <span className="block text-[11px] text-muted">Riot ID</span>
                      <span className="text-sm font-semibold">{accepted.riotId}</span>
                    </span>
                    <Copy size={15} className="text-accent" aria-hidden="true" />
                  </button>
                  {accepted.discordTag ? (
                    <button
                      type="button"
                      onClick={() => copy(accepted.discordTag, 'Discord')}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-[11px] text-muted">Discord</span>
                        <span className="text-sm font-semibold">{accepted.discordTag}</span>
                      </span>
                      <Copy size={15} className="text-accent" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
                <Link
                  to="/matches"
                  className="mt-3 inline-block text-xs font-semibold text-accent hover:underline"
                >
                  Ver en Matches
                </Link>
              </section>
            ) : null}

            <div className="flex gap-2">
              {[
                { value: 'incoming', label: 'Recibidas' },
                { value: 'outgoing', label: 'Enviadas' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBox(option.value)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold ${
                    box === option.value ? 'bg-accent text-bg' : 'border border-border text-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {error ? (
              <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="space-y-3">
                {[0, 1].map((item) => (
                  <div
                    key={item}
                    className="h-40 animate-pulse rounded-2xl border border-border bg-surface"
                  />
                ))}
              </div>
            ) : invites.length ? (
              <div className="space-y-3">
                {invites.map((invite) => {
                  const busy = actionId === invite.id;
                  const pending = invite.status === 'pending';

                  return (
                    <article
                      key={invite.id}
                      className="rounded-2xl border border-border bg-surface p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
                            {initialsOf(invite.counterpart.username)}
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate font-bold">{invite.counterpart.username}</h2>
                            <p className="truncate text-xs text-muted">
                              {formatRank(invite.counterpart)} · {formatRoles(invite.counterpart)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            STATUS_STYLES[invite.status] || STATUS_STYLES.expired
                          }`}
                        >
                          {STATUS_LABELS[invite.status] || invite.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted">
                        <span className="rounded-full border border-border px-2 py-1">
                          Rol: {ROLE_LABELS[invite.role] || invite.role}
                        </span>
                        {invite.availability ? (
                          <span className="rounded-full border border-border px-2 py-1">
                            {QUEUE_LABELS[invite.availability.queue] || invite.availability.queue}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">
                          <Clock size={11} aria-hidden="true" />
                          {pending
                            ? `Vence ${formatDateTime(invite.expiresAt)}`
                            : `Creada ${formatDateTime(invite.createdAt)}`}
                        </span>
                      </div>

                      {invite.message ? (
                        <p className="mt-3 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-muted">
                          “{invite.message}”
                        </p>
                      ) : null}

                      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                        <Lock size={11} aria-hidden="true" />
                        El contacto se revela al aceptar.
                      </p>

                      {pending ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {box === 'incoming' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => respond(invite, 'accept')}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg disabled:opacity-60"
                              >
                                <Check size={14} aria-hidden="true" />
                                Aceptar
                              </button>
                              <button
                                type="button"
                                onClick={() => respond(invite, 'decline')}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-danger disabled:opacity-60"
                              >
                                <X size={14} aria-hidden="true" />
                                Rechazar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => respond(invite, 'cancel')}
                              disabled={busy}
                              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted disabled:opacity-60"
                            >
                              <X size={14} aria-hidden="true" />
                              Cancelar invitación
                            </button>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <section className="rounded-2xl border border-border bg-surface p-8 text-center">
                <Inbox className="mx-auto text-accent" size={30} aria-hidden="true" />
                <h2 className="mt-3 font-bold">
                  {box === 'incoming'
                    ? 'No tenés invitaciones recibidas'
                    : 'No enviaste invitaciones'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  {box === 'incoming'
                    ? 'Cuando alguien te invite desde Disponible ya, aparece acá.'
                    : 'Entrá a Disponible ya para invitar a un jugador.'}
                </p>
                <Link
                  to="/disponible"
                  className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg"
                >
                  Ir a Disponible ya
                </Link>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
