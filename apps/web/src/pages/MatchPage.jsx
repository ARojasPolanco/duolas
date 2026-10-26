import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ban, Heart, RefreshCw, Swords, X } from 'lucide-react';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import {
  LANGUAGE_LABELS,
  QUEUE_LABELS,
  ROLE_LABELS,
  STYLE_LABELS,
  formatRank,
  formatRoles,
  initialsOf,
} from '../utils/labels.js';

const queueOptions = ['solo_duo', 'flex'];

export default function MatchPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [queue, setQueue] = useState('solo_duo');
  const [role, setRole] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const canInteract = Boolean(user?.emailVerified && user?.profileCompleted);

  const load = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.get('/v1/matching/candidates', {
        params: { queue, ...(role ? { role } : {}) },
      });
      setCandidates(res.data.candidates || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'No pudimos cargar los candidatos. Intentá de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }, [canInteract, queue, role]);

  const loadOutgoing = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setOutgoing([]);
      return;
    }

    try {
      const res = await api.get('/v1/matching/likes');
      setOutgoing(res.data.outgoing || []);
    } catch (_error) {
      setOutgoing([]);
    }
  }, [canInteract]);

  useEffect(() => {
    load();
    loadOutgoing();
  }, [load, loadOutgoing]);

  const removeCandidate = (userId) => {
    setCandidates((current) => current.filter((item) => item.profile.id !== userId));
  };

  const handleLike = async (candidate) => {
    setActionId(candidate.profile.id);

    try {
      const res = await api.post('/v1/matching/likes', {
        targetUserId: candidate.profile.id,
      });

      if (res.data.matched) {
        toast.success('¡Es un match! Ya pueden coordinar su duo.');
        navigate('/matches');
      } else {
        removeCandidate(candidate.profile.id);
        toast.success('Interés enviado.');
        await loadOutgoing();
      }
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos registrar el interés.');
    } finally {
      setActionId(null);
    }
  };

  const handlePass = (candidate) => {
    removeCandidate(candidate.profile.id);
  };

  const handleUnlike = async (targetUserId) => {
    setActionId(targetUserId);
    try {
      await api.delete(`/v1/matching/likes/${targetUserId}`);
      setOutgoing((current) => current.filter((item) => item.target.id !== targetUserId));
      toast.success('Interés retirado.');
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos retirar el interés.');
    } finally {
      setActionId(null);
    }
  };

  const handleBlock = async (candidate) => {
    const confirmed = window.confirm(
      `¿Bloquear a ${candidate.profile.username}? No volverá a aparecer en tus candidatos.`
    );
    if (!confirmed) return;

    setActionId(candidate.profile.id);

    try {
      await api.post('/v1/blocks', { userId: candidate.profile.id });
      removeCandidate(candidate.profile.id);
      setOutgoing((current) => current.filter((item) => item.target.id !== candidate.profile.id));
      toast.success('Usuario bloqueado.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos bloquear al usuario.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-5 py-8 text-text">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/inicio" className="text-xl font-extrabold tracking-tight">
            Duo<span className="text-accent">LAS</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link to="/inicio" className="text-muted">
              Inicio
            </Link>
            <Link to="/disponible" className="text-muted">
              Disponible
            </Link>
            <Link to="/busco-1" className="text-muted">
              Busco 1
            </Link>
            <Link to="/invitaciones" className="text-muted">
              Invitaciones
            </Link>
            <Link to="/matches" className="text-muted">
              Matches
            </Link>
          </nav>
        </header>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Match</p>
          <h1 className="mt-2 text-3xl font-extrabold">Encontrá tu duo</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Candidatos compatibles por rango, roles, horarios, estilo e idioma. Si hay interés
            mutuo, se revela el contacto.
          </p>
        </div>

        {!user?.emailVerified ? <EmailVerificationBanner /> : null}

        {!canInteract ? (
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-bold">Primero completá tu cuenta</h2>
            <p className="mt-2 text-sm text-muted">
              Necesitás el email verificado y el perfil completo para ver candidatos.
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
            <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {queueOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setQueue(option)}
                    className={`rounded-lg px-4 py-2 text-xs font-bold ${
                      queue === option ? 'bg-accent text-bg' : 'border border-border text-muted'
                    }`}
                  >
                    {QUEUE_LABELS[option]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text"
                >
                  <option value="">Todos los roles</option>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={load}
                  className="rounded-lg border border-border p-2 text-muted"
                  aria-label="Recargar candidatos"
                >
                  <RefreshCw size={16} aria-hidden="true" />
                </button>
              </div>
            </section>

            {error ? (
              <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1].map((item) => (
                  <div
                    key={item}
                    className="h-64 animate-pulse rounded-2xl border border-border bg-surface"
                  />
                ))}
              </div>
            ) : null}

            {!loading && !error && candidates.length === 0 ? (
              <section className="rounded-2xl border border-border bg-surface p-8 text-center">
                <Swords className="mx-auto text-accent" size={32} aria-hidden="true" />
                <h2 className="mt-4 text-lg font-bold">No encontramos duos compatibles</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  Probá ampliar tus horarios o volvé más tarde. También podés revisar que tu rango y
                  roles estén actualizados.
                </p>
                <Link
                  to="/onboarding"
                  className="mt-5 inline-block rounded-xl border border-border px-5 py-3 text-sm font-semibold"
                >
                  Editar perfil
                </Link>
              </section>
            ) : null}

            {!loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {candidates.map((candidate) => {
                  const profile = candidate.profile;
                  const busy = actionId === profile.id;

                  return (
                    <article
                      key={profile.id}
                      className="rounded-2xl border border-border bg-surface p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
                            {initialsOf(profile.username)}
                          </div>
                          <div>
                            <h3 className="font-bold">{profile.username}</h3>
                            <p className="text-xs text-muted">
                              {formatRank(profile)} · {formatRoles(profile)}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                          {candidate.score} pts
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted">
                        <span className="rounded-full border border-border px-2 py-1">
                          {STYLE_LABELS[profile.playStyle] || profile.playStyle}
                        </span>
                        <span className="rounded-full border border-border px-2 py-1">
                          {profile.hasMic ? 'Con mic' : 'Sin mic'}
                        </span>
                        {profile.languages.map((language) => (
                          <span
                            key={language}
                            className="rounded-full border border-border px-2 py-1"
                          >
                            {LANGUAGE_LABELS[language] || language}
                          </span>
                        ))}
                      </div>

                      {candidate.reasons?.length ? (
                        <ul className="mt-4 space-y-1 text-xs text-muted">
                          {candidate.reasons.map((reason) => (
                            <li key={reason}>· {reason}</li>
                          ))}
                        </ul>
                      ) : null}

                      {profile.bio ? (
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                          {profile.bio}
                        </p>
                      ) : null}

                      <div className="mt-5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLike(candidate)}
                          disabled={busy}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg disabled:opacity-60"
                        >
                          <Heart size={15} aria-hidden="true" />
                          Me interesa
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePass(candidate)}
                          disabled={busy}
                          className="rounded-xl border border-border p-2.5 text-muted disabled:opacity-60"
                          aria-label={`Pasar a ${profile.username}`}
                        >
                          <X size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlock(candidate)}
                          disabled={busy}
                          className="rounded-xl border border-border p-2.5 text-danger disabled:opacity-60"
                          aria-label={`Bloquear a ${profile.username}`}
                        >
                          <Ban size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}

            {outgoing.length ? (
              <section className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Likes enviados</h2>
                    <p className="text-xs text-muted">
                      Podés retirar un interés mientras esperás que sea mutuo.
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-1 text-xs text-muted">
                    {outgoing.length}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {outgoing.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[11px] font-extrabold text-accent">
                          {initialsOf(item.target.username)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.target.username}</p>
                          <p className="truncate text-[11px] text-muted">
                            {formatRank(item.target)} · {formatRoles(item.target)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlike(item.target.id)}
                        disabled={actionId === item.target.id}
                        className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-danger disabled:opacity-60"
                      >
                        Retirar
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
