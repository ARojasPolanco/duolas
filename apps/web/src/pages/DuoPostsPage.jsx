import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Copy,
  Lock,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import CountryBadge from '../components/CountryBadge.jsx';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import RankIcon from '../components/RankIcon.jsx';
import UsernameHint from '../components/UsernameHint.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import { whatsappUrl } from '../utils/contact.js';
import {
  QUEUE_LABELS,
  RANK_LABELS,
  ROLE_LABELS,
  formatRank,
  formatRoles,
  initialsOf,
  rankTierForQueue,
} from '../utils/labels.js';

const roleOptions = Object.keys(ROLE_LABELS);
const queueOptions = Object.keys(QUEUE_LABELS);
const rankOptions = Object.keys(RANK_LABELS);

const POST_STATUS_LABELS = {
  active: 'Activa',
  filled: 'Completa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
};

const POST_STATUS_STYLES = {
  active: 'border-accent/40 bg-accent/10 text-accent',
  filled: 'border-success/40 bg-success/10 text-success',
  expired: 'border-border bg-surface-2 text-muted',
  cancelled: 'border-border bg-surface-2 text-muted',
};

const APPLICATION_STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
};

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));

const rankRange = (post) =>
  `${RANK_LABELS[post.rankMinTier] || post.rankMinTier} a ${
    RANK_LABELS[post.rankMaxTier] || post.rankMaxTier
  }`;

export default function DuoPostsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('explore');
  const [posts, setPosts] = useState([]);
  const [mine, setMine] = useState([]);
  const [applications, setApplications] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mineLoading, setMineLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterQueue, setFilterQueue] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    queue: 'solo_duo',
    rolesNeeded: ['support'],
    rankMinTier: 'gold',
    rankMaxTier: 'platinum',
    note: '',
  });
  const [creating, setCreating] = useState(false);
  const [applyDrafts, setApplyDrafts] = useState({});
  const [applyingId, setApplyingId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [acceptedContact, setAcceptedContact] = useState(null);

  const canInteract = Boolean(user?.emailVerified && user?.profileCompleted);

  const loadPosts = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {};
      if (filterQueue) params.queue = filterQueue;
      if (filterRole) params.role = filterRole;
      const res = await api.get('/v1/duo-posts', { params });
      setPosts(res.data.posts || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar las publicaciones.');
    } finally {
      setLoading(false);
    }
  }, [canInteract, filterQueue, filterRole]);

  const loadMine = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setMine([]);
      setMineLoading(false);
      return;
    }

    setMineLoading(true);

    try {
      const res = await api.get('/v1/duo-posts/mine');
      setMine(res.data.posts || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar tus publicaciones.');
    } finally {
      setMineLoading(false);
    }
  }, [canInteract]);

  useEffect(() => {
    loadPosts();
    loadMine();
  }, [loadPosts, loadMine]);

  const toggleFormRole = (role) => {
    setForm((current) => {
      if (current.rolesNeeded.includes(role)) {
        return {
          ...current,
          rolesNeeded: current.rolesNeeded.filter((item) => item !== role),
        };
      }
      if (current.rolesNeeded.length >= 2) return current;
      return { ...current, rolesNeeded: [...current.rolesNeeded, role] };
    });
  };

  const createPost = async (event) => {
    event.preventDefault();

    if (!form.rolesNeeded.length) {
      toast.error('Elegí al menos un rol.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await api.post('/v1/duo-posts', {
        queue: form.queue,
        rolesNeeded: form.rolesNeeded,
        rankMinTier: form.rankMinTier,
        rankMaxTier: form.rankMaxTier,
        note: form.note.trim() || null,
      });
      toast.success('Publicación creada.');
      setFormOpen(false);
      setForm((current) => ({ ...current, note: '' }));
      await Promise.all([loadPosts(), loadMine()]);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos crear la publicación.');
    } finally {
      setCreating(false);
    }
  };

  const apply = async (post) => {
    setApplyingId(post.id);

    try {
      await api.post(`/v1/duo-posts/${post.id}/apply`, {
        message: (applyDrafts[post.id] || '').trim() || null,
      });
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, myApplicationStatus: 'pending' } : item
        )
      );
      toast.success('Postulación enviada.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos enviar la postulación.');
    } finally {
      setApplyingId(null);
    }
  };

  const loadApplications = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }

    setExpandedPost(postId);
    setApplicationsLoading(true);

    try {
      const res = await api.get(`/v1/duo-posts/${postId}/applications`);
      setApplications((current) => ({ ...current, [postId]: res.data.applications || [] }));
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos cargar las postulaciones.');
      setExpandedPost(null);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const acceptApplication = async (post, application) => {
    setBusy(application.id);

    try {
      const res = await api.post(`/v1/duo-posts/${post.id}/applications/${application.id}/accept`);
      setAcceptedContact({
        username: application.applicant.username,
        riotId: res.data.contact?.riotId,
        discordTag: res.data.contact?.discordTag,
        whatsapp: res.data.contact?.whatsapp,
      });
      setApplications((current) => ({
        ...current,
        [post.id]: (current[post.id] || []).map((item) => {
          if (item.id === application.id) return { ...item, status: 'accepted' };
          if (item.status === 'pending') return { ...item, status: 'rejected' };
          return item;
        }),
      }));
      setMine((current) =>
        current.map((item) => (item.id === post.id ? { ...item, status: 'filled' } : item))
      );
      toast.success('Postulación aceptada. Ya pueden coordinar.');
      await loadMine();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos aceptar la postulación.');
    } finally {
      setBusy(null);
    }
  };

  const rejectApplication = async (post, application) => {
    setBusy(application.id);

    try {
      await api.post(`/v1/duo-posts/${post.id}/applications/${application.id}/reject`);
      setApplications((current) => ({
        ...current,
        [post.id]: (current[post.id] || []).map((item) =>
          item.id === application.id ? { ...item, status: 'rejected' } : item
        ),
      }));
      toast.success('Postulación rechazada.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos rechazar la postulación.');
    } finally {
      setBusy(null);
    }
  };

  const cancelPost = async (post) => {
    const confirmed = window.confirm('¿Cancelar esta publicación?');
    if (!confirmed) return;

    setBusy(post.id);

    try {
      await api.delete(`/v1/duo-posts/${post.id}`);
      setMine((current) =>
        current.map((item) => (item.id === post.id ? { ...item, status: 'cancelled' } : item))
      );
      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success('Publicación cancelada.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos cancelar la publicación.');
    } finally {
      setBusy(null);
    }
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

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Busco 1</p>
            <h1 className="mt-2 text-3xl font-extrabold">Completá tu grupo</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Publicá el lugar libre y recibí postulaciones. Al aceptar una se crea la conexión y el
              contacto se revela.
            </p>
            <Link
              to="/como-funciona"
              className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-accent hover:underline"
            >
              ¿Cómo funciona?
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg"
          >
            <Plus size={15} aria-hidden="true" />
            Publicar
          </button>
        </div>

        <EmailVerificationBanner />

        {!canInteract ? (
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-bold">Primero completá tu cuenta</h2>
            <p className="mt-2 text-sm text-muted">
              Necesitás el email verificado y el perfil completo para publicar o postularte.
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
            {acceptedContact?.riotId ? (
              <section className="rounded-2xl border border-success/40 bg-success/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-success">
                  Postulación aceptada
                </p>
                <h2 className="mt-1 text-lg font-bold">{acceptedContact.username}</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => copy(acceptedContact.riotId, 'Riot ID')}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-left"
                  >
                    <span>
                      <span className="block text-[11px] text-muted">Riot ID</span>
                      <span className="text-sm font-semibold">{acceptedContact.riotId}</span>
                    </span>
                    <Copy size={15} className="text-accent" aria-hidden="true" />
                  </button>
                  {acceptedContact.discordTag ? (
                    <button
                      type="button"
                      onClick={() => copy(acceptedContact.discordTag, 'Discord')}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-[11px] text-muted">Discord</span>
                        <span className="text-sm font-semibold">{acceptedContact.discordTag}</span>
                      </span>
                      <Copy size={15} className="text-accent" aria-hidden="true" />
                    </button>
                  ) : null}

                  {acceptedContact.whatsapp ? (
                    <a
                      href={whatsappUrl(acceptedContact.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-[11px] text-muted">WhatsApp</span>
                        <span className="text-sm font-semibold">{acceptedContact.whatsapp}</span>
                      </span>
                      <MessageCircle size={15} className="text-accent" aria-hidden="true" />
                    </a>
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

            {formOpen ? (
              <section className="rounded-2xl border border-accent/40 bg-surface p-5">
                <h2 className="text-lg font-bold">Nueva publicación</h2>
                <form onSubmit={createPost} className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-muted">
                      Cola
                      <select
                        value={form.queue}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, queue: event.target.value }))
                        }
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
                      <p className="text-xs font-semibold text-muted">Rol que falta</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {roleOptions.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleFormRole(role)}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                              form.rolesNeeded.includes(role)
                                ? 'border-accent bg-accent/15 text-accent'
                                : 'border-border text-muted'
                            }`}
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-muted">
                      Rango mínimo
                      <select
                        value={form.rankMinTier}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            rankMinTier: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                      >
                        {rankOptions.map((tier) => (
                          <option key={tier} value={tier}>
                            {RANK_LABELS[tier]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-muted">
                      Rango máximo
                      <select
                        value={form.rankMaxTier}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            rankMaxTier: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                      >
                        {rankOptions.map((tier) => (
                          <option key={tier} value={tier}>
                            {RANK_LABELS[tier]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-semibold text-muted">
                    Nota (opcional)
                    <textarea
                      value={form.note}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, note: event.target.value }))
                      }
                      maxLength={140}
                      rows={2}
                      placeholder="Ej.: Somos 4, falta support."
                      className="mt-2 w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-muted/60"
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg disabled:opacity-60"
                    >
                      {creating ? 'Publicando...' : 'Publicar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            <div className="flex gap-2">
              {[
                { value: 'explore', label: 'Explorar' },
                { value: 'mine', label: 'Mis publicaciones' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTab(option.value)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold ${
                    tab === option.value ? 'bg-accent text-bg' : 'border border-border text-muted'
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

            {tab === 'explore' ? (
              <section className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
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
                    onClick={loadPosts}
                    className="col-span-2 inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted sm:w-11"
                    aria-label="Recargar publicaciones"
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[0, 1].map((item) => (
                      <div
                        key={item}
                        className="h-48 animate-pulse rounded-2xl border border-border bg-surface"
                      />
                    ))}
                  </div>
                ) : posts.length ? (
                  <div className="space-y-3">
                    {posts.map((post) => {
                      const applying = applyingId === post.id;

                      return (
                        <article
                          key={post.id}
                          className="rounded-2xl border border-border bg-surface p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
                                {initialsOf(post.owner?.username)}
                              </div>
                              <div className="min-w-0">
                                <h2 className="truncate font-bold">@{post.owner?.username}</h2>
                                <UsernameHint className="mt-0.5" />
                                <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                                  {post.owner ? (
                                    <RankIcon
                                      tier={rankTierForQueue(post.owner, post.queue)}
                                      size={16}
                                    />
                                  ) : null}
                                  <span className="truncate">
                                    {post.owner ? formatRank(post.owner, post.queue) : 'Sin rango'}{' '}
                                    � {post.owner ? formatRoles(post.owner) : 'Sin roles'}
                                  </span>
                                </p>
                                {post.owner?.country ? (
                                  <p className="mt-0.5 text-[10px] text-muted">
                                    <CountryBadge country={post.owner.country} />
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted">
                              {QUEUE_LABELS[post.queue] || post.queue}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2">
                            <p>
                              <span className="font-semibold text-text">Busca:</span>{' '}
                              {post.rolesNeeded
                                .map((role) => ROLE_LABELS[role] || role)
                                .join(' / ')}
                            </p>
                            <p>
                              <span className="font-semibold text-text">Rango:</span>{' '}
                              {rankRange(post)}
                            </p>
                          </div>

                          {post.note ? (
                            <p className="mt-3 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-muted">
                              {post.note}
                            </p>
                          ) : null}

                          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                            <Clock size={11} aria-hidden="true" />
                            Vence {formatDateTime(post.expiresAt)}
                          </p>

                          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                            <Lock size={11} aria-hidden="true" />
                            El contacto se revela si aceptan tu postulación.
                          </p>

                          {post.myApplicationStatus ? (
                            <p className="mt-4 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs font-semibold text-muted">
                              Tu postulación:{' '}
                              {APPLICATION_STATUS_LABELS[post.myApplicationStatus] ||
                                post.myApplicationStatus}
                            </p>
                          ) : (
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                              <input
                                value={applyDrafts[post.id] || ''}
                                onChange={(event) =>
                                  setApplyDrafts((current) => ({
                                    ...current,
                                    [post.id]: event.target.value,
                                  }))
                                }
                                maxLength={140}
                                placeholder="Mensaje corto para el dueño"
                                className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-xs text-text placeholder:text-muted/60"
                              />
                              <button
                                type="button"
                                onClick={() => apply(post)}
                                disabled={applying}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg disabled:opacity-60"
                              >
                                <Send size={14} aria-hidden="true" />
                                Postularme
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                    <Users className="mx-auto text-accent" size={30} aria-hidden="true" />
                    <h2 className="mt-3 font-bold">No hay Busco 1 activos</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                      Probá cambiar los filtros o publicá tu propio lugar libre.
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <section className="space-y-3">
                {mineLoading ? (
                  <div className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
                ) : mine.length ? (
                  mine.map((post) => {
                    const expanded = expandedPost === post.id;
                    const postApplications = applications[post.id] || [];

                    return (
                      <article
                        key={post.id}
                        className="rounded-2xl border border-border bg-surface p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-bold">
                                {QUEUE_LABELS[post.queue] || post.queue} ·{' '}
                                {post.rolesNeeded
                                  .map((role) => ROLE_LABELS[role] || role)
                                  .join(' / ')}
                              </h2>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                  POST_STATUS_STYLES[post.status] || POST_STATUS_STYLES.expired
                                }`}
                              >
                                {POST_STATUS_LABELS[post.status] || post.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              Rango {rankRange(post)} · Vence {formatDateTime(post.expiresAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-border px-3 py-1 text-[11px] text-muted">
                              {post.applicationsCount} postulaciones
                            </span>
                            {post.status === 'active' ? (
                              <button
                                type="button"
                                onClick={() => cancelPost(post)}
                                disabled={busy === post.id}
                                className="rounded-lg border border-border p-2 text-danger disabled:opacity-60"
                                aria-label="Cancelar publicación"
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {post.note ? (
                          <p className="mt-3 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-muted">
                            {post.note}
                          </p>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => loadApplications(post.id)}
                          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent"
                        >
                          <ClipboardList size={14} aria-hidden="true" />
                          {expanded ? 'Ocultar postulaciones' : 'Ver postulaciones'}
                          {expanded ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          )}
                        </button>

                        {expanded ? (
                          applicationsLoading ? (
                            <div className="mt-3 h-20 animate-pulse rounded-xl bg-surface-2" />
                          ) : postApplications.length ? (
                            <div className="mt-3 space-y-2">
                              {postApplications.map((application) => {
                                const applicationBusy = busy === application.id;
                                const pending = application.status === 'pending';

                                return (
                                  <div
                                    key={application.id}
                                    className="rounded-xl border border-border bg-bg p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-[11px] font-extrabold text-accent">
                                          {initialsOf(application.applicant.username)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold">
                                            @{application.applicant.username}
                                          </p>
                                          <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                                            <RankIcon
                                              tier={rankTierForQueue(
                                                application.applicant,
                                                post.queue
                                              )}
                                              size={14}
                                            />
                                            <span className="truncate">
                                              {formatRank(application.applicant, post.queue)} �{' '}
                                              {formatRoles(application.applicant)}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted">
                                          {APPLICATION_STATUS_LABELS[application.status] ||
                                            application.status}
                                        </span>
                                        <span className="rounded-full bg-accent/15 px-2 py-1 text-[10px] font-bold text-accent">
                                          {application.score} pts
                                        </span>
                                      </div>
                                    </div>

                                    {application.message ? (
                                      <p className="mt-2 text-xs text-muted">
                                        “{application.message}”
                                      </p>
                                    ) : null}

                                    {pending && post.status === 'active' ? (
                                      <div className="mt-3 flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => acceptApplication(post, application)}
                                          disabled={applicationBusy}
                                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[11px] font-bold text-bg disabled:opacity-60"
                                        >
                                          <Check size={13} aria-hidden="true" />
                                          Aceptar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => rejectApplication(post, application)}
                                          disabled={applicationBusy}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-danger disabled:opacity-60"
                                        >
                                          <X size={13} aria-hidden="true" />
                                          Rechazar
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="mt-3 rounded-xl border border-border bg-bg px-3 py-2.5 text-xs text-muted">
                              Todavía no hay postulaciones.
                            </p>
                          )
                        ) : null}
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                    <ClipboardList className="mx-auto text-accent" size={30} aria-hidden="true" />
                    <h2 className="mt-3 font-bold">No tenés publicaciones</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                      Publicá un Busco 1 para que otros jugadores se postulen.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg"
                    >
                      Publicar Busco 1
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
