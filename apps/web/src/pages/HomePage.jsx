import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, LogOut, Pencil, RefreshCw, Swords, UserRoundCheck, Users } from 'lucide-react';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import HowItWorksCarousel from '../components/HowItWorksCarousel.jsx';
import PlayerPreviewCard from '../components/PlayerPreviewCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import { formatRank, formatRoles, initialsOf } from '../utils/labels.js';

const statCard = 'rounded-xl border border-border bg-bg p-4';
const actionLink =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const canInteract = Boolean(user?.emailVerified && user?.profileCompleted);

  const loadProfile = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setProfileLoading(false);
      return;
    }

    try {
      const res = await api.get('/v1/profiles/me');
      setProfile(res.data.profile);
    } catch (_error) {
      setError('No pudimos cargar tu perfil. Probá recargar la página.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    if (!canInteract || !localStorage.getItem('token')) {
      setCandidates([]);
      setCandidatesLoading(false);
      return;
    }

    setCandidatesLoading(true);
    try {
      const res = await api.get('/v1/matching/candidates', { params: { limit: 4 } });
      setCandidates(res.data.candidates || []);
    } catch (_error) {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }, [canInteract]);

  const loadMatches = useCallback(async () => {
    if (!canInteract || !localStorage.getItem('token')) {
      setMatches([]);
      setMatchesLoading(false);
      return;
    }

    setMatchesLoading(true);
    try {
      const res = await api.get('/v1/matching/matches');
      setMatches(res.data.matches || []);
    } catch (_error) {
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  }, [canInteract]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadCandidates();
    loadMatches();
  }, [loadCandidates, loadMatches]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const copy = async (value, label) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch (_error) {
      toast.error('No pudimos copiar. Copialo manualmente.');
    }
  };

  const handleLike = async (player) => {
    setBusyId(player.id);
    try {
      const res = await api.post('/v1/matching/likes', { targetUserId: player.id });

      if (res.data.matched) {
        toast.success('¡Es un match! Ya pueden coordinar su duo.');
      } else {
        toast.success('Interés enviado.');
      }

      await Promise.all([loadCandidates(), loadMatches()]);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos registrar el interés.');
    } finally {
      setBusyId(null);
    }
  };

  const handleBlock = async (player) => {
    const confirmed = window.confirm(
      `¿Bloquear a ${player.username}? No volverá a aparecer en tus candidatos.`
    );
    if (!confirmed) return;

    setBusyId(player.id);
    try {
      await api.post('/v1/blocks', { userId: player.id });
      setCandidates((current) => current.filter((item) => item.profile.id !== player.id));
      toast.success('Usuario bloqueado.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos bloquear al usuario.');
    } finally {
      setBusyId(null);
    }
  };

  const ownRiotId = profile?.riotId;
  const ownDiscord = profile?.discordTag;

  return (
    <div className="min-h-screen bg-bg px-5 py-8 text-text">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">
            Duo<span className="text-accent">LAS</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <Link to="/match" className="text-muted hover:text-text">
              Match
            </Link>
            <Link to="/matches" className="text-muted hover:text-text">
              Matches
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted"
            >
              <LogOut size={15} aria-hidden="true" />
              Salir
            </button>
          </nav>
        </header>

        <EmailVerificationBanner />

        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Tu cuenta
              </p>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Hola, {user?.username}.</h1>
              <p className="mt-2 text-sm text-muted">{user?.email}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className={statCard}>
                  <p className="text-xs text-muted">Rango</p>
                  <p className="mt-1 text-sm font-semibold">
                    {profile ? formatRank(profile) : 'Sin perfil'}
                  </p>
                </div>
                <div className={statCard}>
                  <p className="text-xs text-muted">Roles</p>
                  <p className="mt-1 text-sm font-semibold">
                    {profile ? formatRoles(profile) : 'Sin roles'}
                  </p>
                </div>
                <div className={statCard}>
                  <p className="text-xs text-muted">Reputación</p>
                  <p className="mt-1 text-sm font-semibold">
                    {profile?.reputation?.label || 'Nuevo'}
                  </p>
                </div>
                <div className={statCard}>
                  <p className="text-xs text-muted">Cuenta</p>
                  <p className="mt-1 text-sm font-semibold">
                    {user?.emailVerified ? 'Email verificado' : 'Email pendiente'}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  to="/match"
                  className={`${actionLink} bg-accent text-bg hover:bg-accent-strong`}
                >
                  <Swords size={16} aria-hidden="true" />
                  Buscar duo
                </Link>
                <Link to="/matches" className={`${actionLink} border border-border text-text`}>
                  <Users size={16} aria-hidden="true" />
                  Ver matches
                </Link>
                <Link to="/onboarding" className={`${actionLink} border border-border text-muted`}>
                  <Pencil size={16} aria-hidden="true" />
                  Editar perfil
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-bg p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-lg font-extrabold text-accent">
                  {initialsOf(user?.username)}
                </div>
                <div>
                  <p className="font-bold">{user?.username}</p>
                  <p className="text-xs text-muted">
                    {profile ? formatRank(profile) : 'Completá tu perfil'}
                  </p>
                </div>
              </div>

              {profileLoading ? (
                <div className="mt-5 h-20 animate-pulse rounded-xl bg-surface-2" />
              ) : profile ? (
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => copy(ownRiotId, 'Riot ID')}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left"
                  >
                    <span>
                      <span className="block text-[10px] uppercase tracking-wide text-muted">
                        Riot ID
                      </span>
                      <span className="text-sm font-semibold">{ownRiotId}</span>
                    </span>
                    <Copy size={14} className="text-accent" aria-hidden="true" />
                  </button>

                  {ownDiscord ? (
                    <button
                      type="button"
                      onClick={() => copy(ownDiscord, 'Discord')}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left"
                    >
                      <span>
                        <span className="block text-[10px] uppercase tracking-wide text-muted">
                          Discord
                        </span>
                        <span className="text-sm font-semibold">{ownDiscord}</span>
                      </span>
                      <Copy size={14} className="text-accent" aria-hidden="true" />
                    </button>
                  ) : null}

                  <p className="pt-1 text-[11px] leading-relaxed text-muted">
                    Tu Riot ID y Discord solo se muestran a las personas con las que concretás un
                    match.
                  </p>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-sm text-muted">
                    Todavía no completaste tu perfil. Es el primer paso para ver candidatos.
                  </p>
                  <Link to="/onboarding" className={`${actionLink} mt-3 bg-accent text-bg`}>
                    <UserRoundCheck size={16} aria-hidden="true" />
                    Completar ahora
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <HowItWorksCarousel compact />

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Match</p>
              <h2 className="mt-2 text-2xl font-extrabold">Jugadores para vos</h2>
              <p className="mt-1 text-sm text-muted">Ordenados por afinidad según tu perfil.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  loadCandidates();
                  loadMatches();
                }}
                className="rounded-lg border border-border p-2 text-muted"
                aria-label="Actualizar jugadores"
              >
                <RefreshCw size={16} aria-hidden="true" />
              </button>
              <Link
                to="/match"
                className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg"
              >
                Ver todos
              </Link>
            </div>
          </div>

          {!canInteract ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
              Verificá tu email y completá tu perfil para empezar a ver jugadores compatibles.
            </div>
          ) : candidatesLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-60 animate-pulse rounded-2xl border border-border bg-surface"
                />
              ))}
            </div>
          ) : candidates.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {candidates.map((candidate) => (
                <PlayerPreviewCard
                  key={candidate.profile.id}
                  player={candidate.profile}
                  score={candidate.score}
                  reasons={candidate.reasons}
                  busy={busyId === candidate.profile.id}
                  onLike={handleLike}
                  onBlock={handleBlock}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
              No encontramos jugadores compatibles con tus filtros actuales. Probá ampliar tus
              horarios o volver más tarde.
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Conexiones
              </p>
              <h2 className="mt-2 text-2xl font-extrabold">Tus matches</h2>
            </div>
            <Link to="/matches" className="text-xs font-semibold text-accent hover:underline">
              Ver todos
            </Link>
          </div>

          {matchesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-surface"
                />
              ))}
            </div>
          ) : matches.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.slice(0, 2).map((match) => (
                <article key={match.id} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
                      {initialsOf(match.other.username)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{match.other.username}</p>
                      <p className="truncate text-xs text-muted">
                        {formatRank(match.other)} · {formatRoles(match.other)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copy(match.contact.riotId, 'Riot ID')}
                    className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 text-left"
                  >
                    <span>
                      <span className="block text-[10px] uppercase tracking-wide text-muted">
                        Riot ID
                      </span>
                      <span className="text-sm font-semibold">{match.contact.riotId}</span>
                    </span>
                    <Copy size={14} className="text-accent" aria-hidden="true" />
                  </button>

                  <Link
                    to="/matches"
                    className="mt-3 block text-center text-xs font-semibold text-accent hover:underline"
                  >
                    Abrir match
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
              Todavía no tenés matches. Cuando haya interés mutuo, el contacto aparece acá.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
