import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ban,
  Check,
  Heart,
  Languages,
  Mic,
  MicOff,
  RefreshCw,
  Star,
  Swords,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import CountryBadge from '../components/CountryBadge.jsx';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import RankIcon from '../components/RankIcon.jsx';
import UsernameHint from '../components/UsernameHint.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMatching } from '../context/MatchingContext.jsx';
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
  rankTierForQueue,
} from '../utils/labels.js';

const queueOptions = ['solo_duo', 'flex'];

export default function MatchPage() {
  const { user } = useAuth();
  const { refresh: refreshCandidateCount } = useMatching();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [queue, setQueue] = useState('solo_duo');
  const [role, setRole] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);

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
        await refreshCandidateCount();
        navigate('/matches');
      } else {
        removeCandidate(candidate.profile.id);
        toast.success('Interés enviado.');
        await loadOutgoing();
        await refreshCandidateCount();
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
      await refreshCandidateCount();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos retirar el interés.');
    } finally {
      setActionId(null);
    }
  };

  const handleBlock = (candidate) => {
    setBlockTarget(candidate);
  };

  const confirmBlock = async () => {
    if (!blockTarget) return;

    setActionId(blockTarget.profile.id);

    try {
      await api.post('/v1/blocks', { userId: blockTarget.profile.id });
      removeCandidate(blockTarget.profile.id);
      setOutgoing((current) => current.filter((item) => item.target.id !== blockTarget.profile.id));
      toast.success('Usuario bloqueado.');
      await refreshCandidateCount();
      setBlockTarget(null);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos bloquear al usuario.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Match</p>
            <h1 className="mt-2 text-3xl font-extrabold">Encontrá tu duo</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Candidatos compatibles por rango, roles, horarios, estilo e idioma. Si hay interés
              mutuo, se revela el contacto.
            </p>
          </div>
          <Link
            to="/como-funciona"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-xs font-semibold text-muted transition hover:border-accent/50 hover:text-text"
          >
            ¿Cómo funciona?
          </Link>
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
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
                            {initialsOf(profile.username)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-bold">@{profile.username}</h3>
                            <UsernameHint className="mt-0.5" />
                            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                              <RankIcon tier={rankTierForQueue(profile, queue)} size={16} />
                              <span className="truncate">
                                {formatRank(profile, queue)} · {formatRoles(profile)}
                              </span>
                            </p>
                            {profile.country ? (
                              <p className="mt-0.5 text-[10px] text-muted">
                                <CountryBadge country={profile.country} />
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                          {candidate.score} pts
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-muted">
                        <span className="truncate">
                          {STYLE_LABELS[profile.playStyle] || profile.playStyle}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1">
                          {profile.hasMic ? (
                            <Mic size={12} aria-hidden="true" />
                          ) : (
                            <MicOff size={12} aria-hidden="true" />
                          )}
                          <span className="truncate">{profile.hasMic ? 'Con mic' : 'Sin mic'}</span>
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <Languages size={12} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {profile.languages
                              .map((language) => LANGUAGE_LABELS[language] || language)
                              .join(' · ')}
                          </span>
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <Star size={12} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            Reputación {profile.reputation?.label || 'Nuevo'}
                          </span>
                        </span>
                      </div>

                      {candidate.reasons?.length ? (
                        <ul className="mt-3 grid gap-1 text-[11px] text-muted">
                          {candidate.reasons.slice(0, 3).map((reason) => (
                            <li key={reason} className="flex items-start gap-1.5">
                              <Check
                                size={12}
                                className="mt-0.5 shrink-0 text-accent"
                                aria-hidden="true"
                              />
                              <span>{reason}</span>
                            </li>
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
                          <p className="truncate text-sm font-semibold">@{item.target.username}</p>
                          <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                            <RankIcon tier={item.target.rankTier} size={14} />
                            <span className="truncate">
                              {formatRank(item.target)} · {formatRoles(item.target)}
                            </span>
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

      {blockTarget ? (
        <ConfirmDialog
          title={`Bloquear a ${blockTarget.profile.username}`}
          description="No volverá a aparecer en tus candidatos ni en tus búsquedas."
          confirmLabel="Bloquear"
          busy={actionId === blockTarget.profile.id}
          onConfirm={confirmBlock}
          onClose={() => setBlockTarget(null)}
        />
      ) : null}
    </AppShell>
  );
}
