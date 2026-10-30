import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Lock, Radio, RefreshCw, Send, Users } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import CountryBadge from '../components/CountryBadge.jsx';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import RankIcon from '../components/RankIcon.jsx';
import UsernameHint from '../components/UsernameHint.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import {
  QUEUE_LABELS,
  ROLE_LABELS,
  STYLE_LABELS,
  formatRank,
  formatRoles,
  initialsOf,
  rankTierForQueue,
} from '../utils/labels.js';

const roleOptions = Object.keys(ROLE_LABELS);
const queueOptions = Object.keys(QUEUE_LABELS);

const formatTime = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));

const minutesLeft = (value) => {
  const diff = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 60000));
};

export default function AvailabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState(['mid']);
  const [queue, setQueue] = useState('solo_duo');
  const [note, setNote] = useState('');
  const [ttlMinutes, setTtlMinutes] = useState(30);
  const [filterQueue, setFilterQueue] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invitingId, setInvitingId] = useState(null);
  const [inviteDrafts, setInviteDrafts] = useState({});
  const [sentInvites, setSentInvites] = useState({});
  const [error, setError] = useState('');

  const canInteract = Boolean(user?.emailVerified && user?.profileCompleted);

  const loadMine = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/v1/availability/me');
      setSession(res.data.session || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar tu disponibilidad.');
    } finally {
      setLoading(false);
    }
  }, [canInteract]);

  const loadPlayers = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setPlayers([]);
      setPlayersLoading(false);
      return;
    }

    setPlayersLoading(true);

    try {
      const params = {};
      if (filterQueue) params.queue = filterQueue;
      if (filterRole) params.role = filterRole;
      const res = await api.get('/v1/availability', { params });
      setPlayers(res.data.players || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar jugadores disponibles.');
    } finally {
      setPlayersLoading(false);
    }
  }, [canInteract, filterQueue, filterRole]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const toggleRole = (role) => {
    setRoles((current) => {
      if (current.includes(role)) {
        return current.filter((item) => item !== role);
      }
      if (current.length >= 2) return current;
      return [...current, role];
    });
  };

  const openAvailability = async (event) => {
    event.preventDefault();

    if (!roles.length) {
      toast.error('Elegí al menos un rol.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await api.post('/v1/availability', {
        roles,
        queue,
        note: note.trim() || null,
        ttlMinutes,
      });
      setSession(res.data.session);
      toast.success('Ya estás disponible.');
      await loadPlayers();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos abrir tu disponibilidad.');
    } finally {
      setBusy(false);
    }
  };

  const closeAvailability = async () => {
    setBusy(true);

    try {
      await api.delete('/v1/availability');
      setSession(null);
      toast.success('Disponibilidad cerrada.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos cerrar la disponibilidad.');
    } finally {
      setBusy(false);
    }
  };

  const draftFor = (player) => ({
    role: player.session.roles[0],
    message: '',
    ...(inviteDrafts[player.session.id] || {}),
  });

  const updateDraft = (sessionId, patch) => {
    setInviteDrafts((current) => ({
      ...current,
      [sessionId]: { ...(current[sessionId] || {}), ...patch },
    }));
  };

  const invite = async (player) => {
    const draft = draftFor(player);
    setInvitingId(player.session.id);

    try {
      await api.post(`/v1/availability/${player.session.id}/invite`, {
        role: draft.role,
        message: draft.message.trim() || null,
      });
      setSentInvites((current) => ({ ...current, [player.session.id]: true }));
      toast.success(`Invitación enviada a ${player.profile.username}.`);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos enviar la invitación.');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Disponible ya
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Jugá ahora</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Abrí tu disponibilidad por 30 o 60 minutos y recibí invitaciones de jugadores
            compatibles. El contacto se revela recién cuando aceptás.
          </p>
          <Link
            to="/como-funciona"
            className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-accent hover:underline"
          >
            ¿Cómo funciona?
          </Link>
        </div>

        <EmailVerificationBanner />

        {!canInteract ? (
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-bold">Primero completá tu cuenta</h2>
            <p className="mt-2 text-sm text-muted">
              Necesitás el email verificado y el perfil completo para usar Disponible ya.
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
        ) : loading ? (
          <div className="h-44 animate-pulse rounded-2xl border border-border bg-surface" />
        ) : (
          <>
            {session ? (
              <section className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-accent">
                      <Radio size={14} aria-hidden="true" />
                      Estás disponible
                    </p>
                    <h2 className="mt-2 text-lg font-bold">
                      {QUEUE_LABELS[session.queue]} ·{' '}
                      {session.roles.map((role) => ROLE_LABELS[role]).join(' / ')}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      Vence a las {formatTime(session.expiresAt)} · quedan{' '}
                      {minutesLeft(session.expiresAt)} min
                    </p>
                    {session.note ? (
                      <p className="mt-2 text-sm text-muted">{session.note}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={closeAvailability}
                    disabled={busy}
                    className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted disabled:opacity-60"
                  >
                    Cerrar disponibilidad
                  </button>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-accent" aria-hidden="true" />
                  <h2 className="text-lg font-bold">Abrí tu ventana de juego</h2>
                </div>
                <form onSubmit={openAvailability} className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted">Roles que querés jugar</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {roleOptions.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                            roles.includes(role)
                              ? 'border-accent bg-accent/15 text-accent'
                              : 'border-border text-muted'
                          }`}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-muted">
                      Cola
                      <select
                        value={queue}
                        onChange={(event) => setQueue(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                      >
                        {queueOptions.map((option) => (
                          <option key={option} value={option}>
                            {QUEUE_LABELS[option]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div>
                      <p className="text-xs font-semibold text-muted">Duración</p>
                      <div className="mt-2 flex gap-2">
                        {[30, 60].map((minutes) => (
                          <button
                            key={minutes}
                            type="button"
                            onClick={() => setTtlMinutes(minutes)}
                            className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                              ttlMinutes === minutes
                                ? 'border-accent bg-accent/15 text-accent'
                                : 'border-border text-muted'
                            }`}
                          >
                            {minutes} min
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="block text-xs font-semibold text-muted">
                    Nota corta (opcional)
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      maxLength={140}
                      rows={2}
                      placeholder="Ej.: Ranked tranqui, tengo mic."
                      className="mt-2 w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-muted/60"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg disabled:opacity-60"
                  >
                    <Radio size={16} aria-hidden="true" />
                    Ponerme disponible
                  </button>
                </form>
              </section>
            )}

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Ahora
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold">Jugadores disponibles</h2>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                  <select
                    value={filterQueue}
                    onChange={(event) => setFilterQueue(event.target.value)}
                    className="w-full min-w-0 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text sm:w-auto"
                  >
                    <option value="">Todas las colas</option>
                    {queueOptions.map((option) => (
                      <option key={option} value={option}>
                        {QUEUE_LABELS[option]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterRole}
                    onChange={(event) => setFilterRole(event.target.value)}
                    className="w-full min-w-0 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text sm:w-auto"
                  >
                    <option value="">Todos los roles</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={loadPlayers}
                    className="col-span-2 inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted sm:w-11"
                    aria-label="Recargar jugadores"
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {error ? (
                <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                  {error}
                </div>
              ) : null}

              {playersLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[0, 1].map((item) => (
                    <div
                      key={item}
                      className="h-64 animate-pulse rounded-2xl border border-border bg-surface"
                    />
                  ))}
                </div>
              ) : players.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {players.map((player) => {
                    const draft = draftFor(player);
                    const sent = sentInvites[player.session.id];
                    const busyInvite = invitingId === player.session.id;

                    return (
                      <article
                        key={player.session.id}
                        className="rounded-2xl border border-border bg-surface p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
                              {initialsOf(player.profile.username)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate font-bold">@{player.profile.username}</h3>
                              <UsernameHint className="mt-0.5" />
                              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                                <RankIcon
                                  tier={rankTierForQueue(player.profile, player.session.queue)}
                                  size={16}
                                />
                                <span className="truncate">
                                  {formatRank(player.profile, player.session.queue)} �{' '}
                                  {formatRoles(player.profile)}
                                </span>
                              </p>
                              {player.profile.country ? (
                                <p className="mt-0.5 text-[10px] text-muted">
                                  <CountryBadge country={player.profile.country} />
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                            {player.score} pts
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted">
                          <span className="rounded-full border border-border px-2 py-1">
                            {QUEUE_LABELS[player.session.queue]}
                          </span>
                          <span className="rounded-full border border-border px-2 py-1">
                            Busca{' '}
                            {player.session.roles.map((role) => ROLE_LABELS[role]).join(' / ')}
                          </span>
                          <span className="rounded-full border border-border px-2 py-1">
                            {STYLE_LABELS[player.profile.playStyle] || player.profile.playStyle}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">
                            <Clock size={11} aria-hidden="true" />
                            {minutesLeft(player.session.expiresAt)} min
                          </span>
                        </div>

                        {player.session.note ? (
                          <p className="mt-3 text-sm leading-relaxed text-muted">
                            {player.session.note}
                          </p>
                        ) : null}

                        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                          <Lock size={11} aria-hidden="true" />
                          Riot ID y contactos opcionales se revelan al aceptar la invitación.
                        </p>

                        {sent ? (
                          <p className="mt-4 rounded-xl border border-success/40 bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
                            Invitación enviada. Esperá la respuesta.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-2">
                            <div className="grid gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                              <select
                                value={draft.role}
                                onChange={(event) =>
                                  updateDraft(player.session.id, { role: event.target.value })
                                }
                                className="w-full min-w-0 rounded-xl border border-border bg-bg px-3 py-2.5 text-xs text-text"
                              >
                                {player.session.roles.map((role) => (
                                  <option key={role} value={role}>
                                    Invitar como {ROLE_LABELS[role]}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={draft.message}
                                onChange={(event) =>
                                  updateDraft(player.session.id, { message: event.target.value })
                                }
                                maxLength={140}
                                placeholder="Mensaje corto"
                                className="w-full min-w-0 rounded-xl border border-border bg-bg px-3 py-2.5 text-xs text-text placeholder:text-muted/60"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => invite(player)}
                              disabled={busyInvite}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg disabled:opacity-60"
                            >
                              <Send size={14} aria-hidden="true" />
                              Invitar
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                  <Clock className="mx-auto text-accent" size={30} aria-hidden="true" />
                  <h3 className="mt-3 font-bold">No hay jugadores disponibles ahora</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                    Probá cambiar los filtros o volvé más tarde. También podés abrir tu propia
                    disponibilidad.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
