import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Crown,
  Plus,
  RefreshCw,
  ShieldCheck,
  Swords,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { CLASH_EVENT_ENDS_AT, CLASH_ROLES } from '@duo-las/shared/constants';
import AppShell from '../components/AppShell.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import CountryBadge from '../components/CountryBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import { RANK_LABELS, ROLE_LABELS, formatRank, initialsOf } from '../utils/labels.js';

const DAY_LABELS = {
  saturday: 'Sábado 21/11',
  sunday: 'Domingo 22/11',
  both: 'Sábado y domingo',
};

const STATUS_LABELS = {
  active: 'Buscando',
  filled: 'Completo',
  expired: 'Vencido',
  cancelled: 'Cancelado',
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
};

const STATUS_STYLES = {
  active: 'border-accent/40 bg-accent/10 text-accent',
  filled: 'border-success/40 bg-success/10 text-success',
  expired: 'border-border bg-surface-2 text-muted',
  cancelled: 'border-border bg-surface-2 text-muted',
  pending: 'border-gold/40 bg-gold/10 text-gold',
  accepted: 'border-success/40 bg-success/10 text-success',
  rejected: 'border-danger/40 bg-danger/10 text-danger',
  withdrawn: 'border-border bg-surface-2 text-muted',
};

const roleOptions = CLASH_ROLES;
const rankOptions = Object.keys(RANK_LABELS);
const eventActive = new Date(CLASH_EVENT_ENDS_AT) > new Date();

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

const badge = (status) => (
  <span
    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
      STATUS_STYLES[status] || STATUS_STYLES.expired
    }`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

function PlayerLine({ profile, role, captain = false }) {
  if (!profile) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[10px] font-extrabold text-accent">
        {initialsOf(profile.username)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-xs font-semibold">
          @{profile.username}
          {captain ? <Crown size={12} className="shrink-0 text-gold" aria-label="Capitán" /> : null}
        </p>
        <p className="truncate text-[10px] text-muted">
          {ROLE_LABELS[role] || role} · {formatRank(profile)}
        </p>
      </div>
      {profile.country ? <CountryBadge country={profile.country} /> : null}
    </div>
  );
}

export default function ClashPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { notifications } = useNotifications();
  const [tab, setTab] = useState('teams');
  const [posts, setPosts] = useState([]);
  const [mine, setMine] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [applicationsByPost, setApplicationsByPost] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    teamName: '',
    day: 'saturday',
    captainRole: 'mid',
    rolesNeeded: ['jungle', 'support'],
    rankMinTier: 'gold',
    rankMaxTier: 'platinum',
    note: '',
  });
  const [applyDrafts, setApplyDrafts] = useState({});
  const [applyingId, setApplyingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const canInteract = Boolean(user?.emailVerified && user?.profileCompleted);
  const managedPost =
    mine.find((post) => post.status === 'active') ||
    mine.find((post) => post.status === 'filled') ||
    null;
  const managedApplications = managedPost ? applicationsByPost[managedPost.id] || [] : [];
  const visiblePosts = managedPost ? posts.filter((post) => post.id !== managedPost.id) : posts;

  const loadPosts = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract || !eventActive) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterDay) params.day = filterDay;
      if (filterRole) params.role = filterRole;
      const res = await api.get('/v1/clash/posts', { params });
      setPosts(res.data.posts || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar los equipos Clash.');
    } finally {
      setLoading(false);
    }
  }, [canInteract, filterDay, filterRole]);

  const loadMine = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) return;
    try {
      const [mineRes, applicationsRes] = await Promise.all([
        api.get('/v1/clash/mine'),
        api.get('/v1/clash/applications'),
      ]);
      setMine(mineRes.data.posts || []);
      setMyApplications(applicationsRes.data.applications || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar tus equipos Clash.');
    }
  }, [canInteract]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadPosts(), loadMine()]);
  }, [loadPosts, loadMine]);

  const fetchApplications = useCallback(async (postId) => {
    const res = await api.get(`/v1/clash/posts/${postId}/applications`);
    setApplicationsByPost((current) => ({
      ...current,
      [postId]: res.data.applications || [],
    }));
    return res.data.applications || [];
  }, []);

  useEffect(() => {
    if (!managedPost) return;
    if (applicationsByPost[managedPost.id] !== undefined) return;

    fetchApplications(managedPost.id).catch(() => {});
  }, [managedPost, applicationsByPost, fetchApplications]);

  const latestNotification = notifications[0];
  const managedPostId = managedPost?.id;

  useEffect(() => {
    if (latestNotification?.type !== 'application_received') return;
    if (latestNotification.data?.url !== '/clash') return;

    reloadAll().catch(() => {});
    if (managedPostId && latestNotification.data?.postId === managedPostId) {
      fetchApplications(managedPostId).catch(() => {});
    }
  }, [latestNotification?.id, managedPostId, reloadAll, fetchApplications]);

  useEffect(() => {
    if (!managedPostId) return undefined;

    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      reloadAll().catch(() => {});
      fetchApplications(managedPostId).catch(() => {});
    }, 30000);

    return () => clearInterval(timer);
  }, [managedPostId, reloadAll, fetchApplications]);

  const toggleRole = (role) => {
    if (role === form.captainRole) {
      toast.error('Ese rol ya lo ocupa el capitán.');
      return;
    }

    setForm((current) => {
      if (current.rolesNeeded.includes(role)) {
        return {
          ...current,
          rolesNeeded: current.rolesNeeded.filter((item) => item !== role),
        };
      }
      if (current.rolesNeeded.length >= 4) return current;
      return { ...current, rolesNeeded: [...current.rolesNeeded, role] };
    });
  };

  const setCaptainRole = (captainRole) => {
    setForm((current) => ({
      ...current,
      captainRole,
      rolesNeeded: current.rolesNeeded.filter((role) => role !== captainRole),
    }));
  };

  const createTeam = async (event) => {
    event.preventDefault();
    if (!form.rolesNeeded.length) {
      toast.error('Elegí al menos un rol para buscar.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/v1/clash/posts', {
        ...form,
        note: form.note.trim() || null,
      });
      toast.success('Equipo Clash publicado.');
      setFormOpen(false);
      setForm((current) => ({ ...current, teamName: '', note: '' }));
      await reloadAll();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos crear el equipo.');
    } finally {
      setCreating(false);
    }
  };

  const applyToPost = async (post) => {
    const draft = applyDrafts[post.id] || {};
    const role = draft.role || post.rolesRemaining[0];
    if (!role) {
      toast.error('No quedan roles disponibles.');
      return;
    }

    setApplyingId(post.id);
    try {
      await api.post(`/v1/clash/posts/${post.id}/apply`, {
        role,
        message: draft.message?.trim() || null,
      });
      toast.success(`Postulación enviada como ${ROLE_LABELS[role] || role}.`);
      setApplyDrafts((current) => ({ ...current, [post.id]: {} }));
      await reloadAll();
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
    if (applicationsByPost[postId]) return;

    try {
      await fetchApplications(postId);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos cargar las postulaciones.');
    }
  };

  const resolveApplication = async (post, application, action) => {
    setBusyId(application.id);
    try {
      const res = await api.post(
        `/v1/clash/posts/${post.id}/applications/${application.id}/${action}`
      );
      if (action === 'accept') {
        toast.success(
          res.data.isFull ? 'Equipo completo. Ya pueden coordinar.' : 'Jugador aceptado.'
        );
      } else {
        toast.success('Postulación rechazada.');
      }
      await fetchApplications(post.id);
      setExpandedPost(post.id);
      await reloadAll();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos resolver la postulación.');
    } finally {
      setBusyId(null);
    }
  };

  const withdrawApplication = async (application) => {
    setBusyId(application.id);
    try {
      await api.delete(`/v1/clash/posts/${application.post.id}/applications/${application.id}`);
      toast.success('Postulación retirada.');
      await reloadAll();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos retirar la postulación.');
    } finally {
      setBusyId(null);
    }
  };

  const cancelPost = async () => {
    if (!cancelTarget) return;
    setBusyId(cancelTarget.id);
    try {
      await api.delete(`/v1/clash/posts/${cancelTarget.id}`);
      toast.success('Equipo Clash cancelado.');
      setCancelTarget(null);
      await reloadAll();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos cancelar el equipo.');
    } finally {
      setBusyId(null);
    }
  };

  if (!canInteract) {
    return (
      <AppShell maxWidth="max-w-5xl">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <Swords className="mx-auto text-accent" size={34} aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-extrabold">Clash LFG</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
            Para crear o unirte a un equipo Clash necesitás email verificado y perfil completo.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-5">
        <section className="rounded-2xl border border-gold/40 bg-gold/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                Evento temporal
              </p>
              <h1 className="mt-1 text-3xl font-extrabold">Clash LFG</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gold/90">
                Worlds Clash: sábado 21/11 y domingo 22/11. Armá o unite a un equipo para jugar
                Clash. El lock-in de LAS cierra cerca de las 21:00 ART; confirmá el horario exacto
                en el cliente de LoL.
              </p>
            </div>
            <Swords size={34} className="text-gold" aria-hidden="true" />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-gold/80">
            Duo LAS no organiza el torneo: solo ayuda a coordinar equipos. El equipo se crea y se
            invita desde el cliente de League of Legends. Cada jugador necesita nivel 30, SMS
            verificado y ticket. No se permiten pagos, apuestas ni premios.
          </p>
        </section>

        {!eventActive ? (
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
            El evento Clash terminó. Los equipos quedaron archivados.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {managedPost ? (
          <section className="rounded-2xl border border-accent/35 bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  Tu equipo Clash
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="mt-1 text-2xl font-extrabold">{managedPost.teamName}</h2>
                  {badge(managedPost.status)}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {DAY_LABELS[managedPost.day]} · {managedPost.teamSize}/{managedPost.maxSize}{' '}
                  integrantes · {managedPost.pendingApplicationsCount}{' '}
                  {managedPost.pendingApplicationsCount === 1
                    ? 'postulación pendiente'
                    : 'postulaciones pendientes'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab('mine')}
                className="inline-flex min-h-10 items-center rounded-xl border border-accent/40 px-3 text-xs font-bold text-accent"
              >
                Gestionar equipo
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <PlayerLine profile={managedPost.owner} role={managedPost.captainRole} captain />
              {managedPost.members.map((member) => (
                <PlayerLine
                  key={`${member.profile.id}-${member.role}`}
                  profile={member.profile}
                  role={member.role}
                />
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted">Postulaciones</p>
                <span className="text-[10px] text-muted">Se actualizan en vivo</span>
              </div>

              {managedApplications.length ? (
                <div className="mt-2 grid gap-2">
                  {managedApplications.slice(0, 8).map((application) => (
                    <div key={application.id} className="rounded-xl border border-border bg-bg p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">
                            @{application.applicant.username} · {ROLE_LABELS[application.role]}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            {formatRank(application.applicant)}
                          </p>
                          {application.message ? (
                            <p className="mt-2 text-xs text-muted">{application.message}</p>
                          ) : null}
                        </div>
                        {badge(application.status)}
                      </div>

                      {application.contact ? (
                        <div className="mt-3 rounded-lg border border-success/30 bg-success/10 p-2.5 text-[11px] text-success">
                          <p className="font-bold">
                            Contacto para invitar a @{application.applicant.username}
                          </p>
                          <p className="mt-1">Riot ID: {application.contact.riotId}</p>
                          {application.contact.discordTag ? (
                            <p>Discord: {application.contact.discordTag}</p>
                          ) : null}
                          {application.contact.whatsapp ? (
                            <p>WhatsApp: {application.contact.whatsapp}</p>
                          ) : null}
                          <Link
                            to="/matches"
                            className="mt-2 inline-flex min-h-8 items-center rounded-lg border border-success/30 px-2.5 text-[10px] font-bold text-success"
                          >
                            Abrir en Matches
                          </Link>
                        </div>
                      ) : null}

                      {application.status === 'pending' ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => resolveApplication(managedPost, application, 'accept')}
                            disabled={busyId === application.id}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[11px] font-bold text-bg disabled:opacity-60"
                          >
                            <Check size={13} aria-hidden="true" />
                            Aceptar
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveApplication(managedPost, application, 'reject')}
                            disabled={busyId === application.id}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-semibold text-muted disabled:opacity-60"
                          >
                            <X size={13} aria-hidden="true" />
                            Rechazar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted">
                  Todavía no hay postulaciones para tu equipo.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {[
            ['teams', 'Equipos'],
            ['applications', 'Mis postulaciones'],
            ['mine', 'Mis equipos'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`min-h-10 rounded-xl border px-4 text-xs font-bold ${
                tab === value
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border text-muted'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFormOpen((current) => !current)}
            disabled={!eventActive}
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-bg disabled:opacity-50"
          >
            <Plus size={15} aria-hidden="true" />
            Crear equipo
          </button>
          <button
            type="button"
            onClick={reloadAll}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-muted"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {formOpen ? (
          <form onSubmit={createTeam} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-bold">Crear equipo Clash</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-muted">
                Nombre del equipo
                <input
                  required
                  minLength={3}
                  maxLength={40}
                  value={form.teamName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, teamName: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
                  placeholder="Los Pibes del Clash"
                />
              </label>
              <label className="block text-xs font-semibold text-muted">
                Día
                <select
                  value={form.day}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, day: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
                >
                  <option value="saturday">Sábado 21/11</option>
                  <option value="sunday">Domingo 22/11</option>
                  <option value="both">Sábado y domingo</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-muted">
                Tu rol (capitán)
                <select
                  value={form.captainRole}
                  onChange={(event) => setCaptainRole(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-muted">
                Rango mínimo
                <select
                  value={form.rankMinTier}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, rankMinTier: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
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
                    setForm((current) => ({ ...current, rankMaxTier: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
                >
                  {rankOptions.map((tier) => (
                    <option key={tier} value={tier}>
                      {RANK_LABELS[tier]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-muted">Roles que buscás</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roleOptions.map((role) => {
                  const selected = form.rolesNeeded.includes(role);
                  const disabled = role === form.captainRole;
                  return (
                    <button
                      key={role}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleRole(role)}
                      className={`min-h-9 rounded-full border px-3 text-[11px] font-semibold ${
                        selected
                          ? 'border-accent bg-accent text-bg'
                          : 'border-border text-muted disabled:opacity-40'
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 block text-xs font-semibold text-muted">
              Nota
              <textarea
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                maxLength={280}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
                placeholder="Horario, requisitos, estilo de juego..."
              />
            </label>

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="min-h-11 flex-1 rounded-xl bg-accent px-4 text-sm font-bold text-bg disabled:opacity-60"
              >
                {creating ? 'Publicando...' : 'Publicar equipo'}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-muted"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {tab === 'teams' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <select
                value={filterDay}
                onChange={(event) => setFilterDay(event.target.value)}
                className="min-h-10 rounded-xl border border-border bg-surface px-3 text-xs text-text"
              >
                <option value="">Todos los días</option>
                <option value="saturday">Sábado</option>
                <option value="sunday">Domingo</option>
              </select>
              <select
                value={filterRole}
                onChange={(event) => setFilterRole(event.target.value)}
                className="min-h-10 rounded-xl border border-border bg-surface px-3 text-xs text-text"
              >
                <option value="">Todos los roles</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
            ) : visiblePosts.length ? (
              visiblePosts.map((post) => {
                const draft = applyDrafts[post.id] || {};
                const selectedRole = draft.role || post.rolesRemaining[0] || '';
                const canApply =
                  !post.isMine && post.status === 'active' && post.rolesRemaining.length > 0;

                return (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-border bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-extrabold">{post.teamName}</h2>
                          {badge(post.status)}
                          <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted">
                            {DAY_LABELS[post.day]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {post.teamSize}/{post.maxSize} integrantes · Busca {rankRange(post)}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted">
                        Creado {formatDateTime(post.createdAt)}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <PlayerLine profile={post.owner} role={post.captainRole} captain />
                      {post.members.map((member) => (
                        <PlayerLine
                          key={`${member.profile.id}-${member.role}`}
                          profile={member.profile}
                          role={member.role}
                        />
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-[11px] font-semibold text-muted">Busca:</span>
                      {post.rolesRemaining.length ? (
                        post.rolesRemaining.map((role) => (
                          <span
                            key={role}
                            className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent"
                          >
                            {ROLE_LABELS[role]}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-semibold text-success">
                          Equipo completo
                        </span>
                      )}
                    </div>

                    {post.note ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted">{post.note}</p>
                    ) : null}

                    {post.isMine ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={() => loadApplications(post.id)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-accent"
                        >
                          <Users size={14} aria-hidden="true" />
                          Postulaciones ({post.pendingApplicationsCount}{' '}
                          {post.pendingApplicationsCount === 1 ? 'pendiente' : 'pendientes'})
                        </button>
                        {post.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(post)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-danger/40 px-3 text-xs font-semibold text-danger"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            Cancelar equipo
                          </button>
                        ) : null}
                      </div>
                    ) : post.myApplicationStatus ? (
                      <div className="mt-4 border-t border-border pt-4">
                        {badge(post.myApplicationStatus)}
                        <p className="mt-2 text-[11px] text-muted">
                          Tu postulación ya fue enviada. Si te aceptan, el contacto aparece en
                          Matches.
                        </p>
                      </div>
                    ) : canApply ? (
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                          <select
                            value={selectedRole}
                            onChange={(event) =>
                              setApplyDrafts((current) => ({
                                ...current,
                                [post.id]: { ...current[post.id], role: event.target.value },
                              }))
                            }
                            className="min-h-10 rounded-xl border border-border bg-bg px-3 text-xs text-text"
                          >
                            {post.rolesRemaining.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          <input
                            value={draft.message || ''}
                            onChange={(event) =>
                              setApplyDrafts((current) => ({
                                ...current,
                                [post.id]: { ...current[post.id], message: event.target.value },
                              }))
                            }
                            maxLength={280}
                            placeholder="Mensaje para el capitán (opcional)"
                            className="min-h-10 rounded-xl border border-border bg-bg px-3 text-xs text-text focus:border-accent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => applyToPost(post)}
                            disabled={applyingId === post.id}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-bg disabled:opacity-60"
                          >
                            <UserPlus size={14} aria-hidden="true" />
                            {applyingId === post.id ? 'Enviando...' : 'Postularme'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 border-t border-border pt-4 text-[11px] text-muted">
                        Este equipo ya no acepta postulaciones.
                      </p>
                    )}

                    {expandedPost === post.id ? (
                      <div className="mt-4 space-y-2 border-t border-border pt-4">
                        <p className="text-xs font-bold text-muted">Postulaciones</p>
                        {applicationsByPost[post.id]?.length ? (
                          applicationsByPost[post.id].map((application) => (
                            <div
                              key={application.id}
                              className="rounded-xl border border-border bg-bg p-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold">
                                    @{application.applicant.username} ·{' '}
                                    {ROLE_LABELS[application.role]}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-muted">
                                    {formatRank(application.applicant)}
                                  </p>
                                  {application.message ? (
                                    <p className="mt-2 text-xs text-muted">{application.message}</p>
                                  ) : null}
                                </div>
                                {badge(application.status)}
                              </div>
                              {application.contact ? (
                                <div className="mt-3 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success">
                                  <p className="font-bold">
                                    Contacto para invitar a {application.applicant.username}:
                                  </p>
                                  <p className="mt-1">Riot ID: {application.contact.riotId}</p>
                                  {application.contact.discordTag ? (
                                    <p>Discord: {application.contact.discordTag}</p>
                                  ) : null}
                                  {application.contact.whatsapp ? (
                                    <p>WhatsApp: {application.contact.whatsapp}</p>
                                  ) : null}
                                  <Link
                                    to="/matches"
                                    className="mt-2 inline-flex min-h-9 items-center rounded-lg border border-success/30 px-3 text-[11px] font-bold text-success"
                                  >
                                    Abrir en Matches
                                  </Link>
                                </div>
                              ) : null}
                              {application.status === 'pending' ? (
                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => resolveApplication(post, application, 'accept')}
                                    disabled={busyId === application.id}
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[11px] font-bold text-bg disabled:opacity-60"
                                  >
                                    <Check size={13} aria-hidden="true" />
                                    Aceptar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => resolveApplication(post, application, 'reject')}
                                    disabled={busyId === application.id}
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-semibold text-muted disabled:opacity-60"
                                  >
                                    <X size={13} aria-hidden="true" />
                                    Rechazar
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted">Todavía no hay postulaciones.</p>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
                Todavía no hay equipos Clash publicados. Creá el primero.
              </div>
            )}
          </div>
        ) : null}

        {tab === 'applications' ? (
          <div className="space-y-3">
            {myApplications.length ? (
              myApplications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted">
                        {application.post.teamName} · {DAY_LABELS[application.post.day]}
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        Te postulaste como {ROLE_LABELS[application.role]}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Capitán @{application.post.owner.username} ·{' '}
                        {formatRank(application.post.owner)}
                      </p>
                    </div>
                    {badge(application.status)}
                  </div>
                  {application.contact ? (
                    <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success">
                      <p className="font-bold">
                        Ya estás dentro. Coordiná por Matches o por estos contactos:
                      </p>
                      <p className="mt-1">Riot ID: {application.contact.riotId}</p>
                      {application.contact.discordTag ? (
                        <p>Discord: {application.contact.discordTag}</p>
                      ) : null}
                      {application.contact.whatsapp ? (
                        <p>WhatsApp: {application.contact.whatsapp}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {application.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => withdrawApplication(application)}
                      disabled={busyId === application.id}
                      className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-semibold text-muted disabled:opacity-60"
                    >
                      <X size={13} aria-hidden="true" />
                      Retirar postulación
                    </button>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
                No te postulaste a ningún equipo Clash todavía.
              </div>
            )}
          </div>
        ) : null}

        {tab === 'mine' ? (
          <div className="space-y-3">
            {mine.length ? (
              mine.map((post) => (
                <article key={post.id} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-extrabold">{post.teamName}</h2>
                        {badge(post.status)}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {DAY_LABELS[post.day]} · {post.teamSize}/{post.maxSize} integrantes ·{' '}
                        {post.pendingApplicationsCount} pendientes
                      </p>
                    </div>
                    {post.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(post)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-danger/40 px-3 text-xs font-semibold text-danger"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.rolesRemaining.length ? (
                      post.rolesRemaining.map((role) => (
                        <span
                          key={role}
                          className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent"
                        >
                          Falta {ROLE_LABELS[role]}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] font-semibold text-success">
                        Equipo completo
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <PlayerLine profile={post.owner} role={post.captainRole} captain />
                    {post.members.map((member) => (
                      <PlayerLine
                        key={`${member.profile.id}-${member.role}`}
                        profile={member.profile}
                        role={member.role}
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => loadApplications(post.id)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-accent"
                    >
                      <Users size={14} aria-hidden="true" />
                      {expandedPost === post.id ? 'Ocultar detalles' : 'Ver postulaciones'}
                    </button>
                    {post.pendingApplicationsCount ? (
                      <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold text-gold">
                        {post.pendingApplicationsCount}{' '}
                        {post.pendingApplicationsCount === 1 ? 'pendiente' : 'pendientes'}
                      </span>
                    ) : null}
                  </div>

                  {expandedPost === post.id ? (
                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                      {applicationsByPost[post.id]?.length ? (
                        applicationsByPost[post.id].map((application) => (
                          <div
                            key={application.id}
                            className="rounded-xl border border-border bg-bg p-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold">
                                  @{application.applicant.username} ·{' '}
                                  {ROLE_LABELS[application.role]}
                                </p>
                                <p className="mt-0.5 text-[10px] text-muted">
                                  {formatRank(application.applicant)}
                                </p>
                                {application.message ? (
                                  <p className="mt-2 text-xs text-muted">{application.message}</p>
                                ) : null}
                              </div>
                              {badge(application.status)}
                            </div>

                            {application.contact ? (
                              <div className="mt-3 rounded-lg border border-success/30 bg-success/10 p-2.5 text-[11px] text-success">
                                <p className="font-bold">
                                  Contacto para invitar a @{application.applicant.username}
                                </p>
                                <p className="mt-1">Riot ID: {application.contact.riotId}</p>
                                {application.contact.discordTag ? (
                                  <p>Discord: {application.contact.discordTag}</p>
                                ) : null}
                                {application.contact.whatsapp ? (
                                  <p>WhatsApp: {application.contact.whatsapp}</p>
                                ) : null}
                                <Link
                                  to="/matches"
                                  className="mt-2 inline-flex min-h-8 items-center rounded-lg border border-success/30 px-2.5 text-[10px] font-bold text-success"
                                >
                                  Abrir en Matches
                                </Link>
                              </div>
                            ) : null}

                            {application.status === 'pending' ? (
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => resolveApplication(post, application, 'accept')}
                                  disabled={busyId === application.id}
                                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[11px] font-bold text-bg disabled:opacity-60"
                                >
                                  <Check size={13} aria-hidden="true" />
                                  Aceptar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => resolveApplication(post, application, 'reject')}
                                  disabled={busyId === application.id}
                                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-semibold text-muted disabled:opacity-60"
                                >
                                  <X size={13} aria-hidden="true" />
                                  Rechazar
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted">
                          Todavía no hay postulaciones para este equipo.
                        </p>
                      )}
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
                No tenés equipos Clash creados.
              </div>
            )}
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-surface p-4 text-[11px] leading-relaxed text-muted">
          <ShieldCheck size={14} className="mr-1 inline text-accent" aria-hidden="true" />
          El Riot ID y los contactos se revelan recién cuando el capitán acepta la postulación. Duo
          LAS no crea el equipo en Riot ni administra tickets, brackets o premios.
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancelar equipo Clash"
        description="El equipo dejará de aceptar postulaciones y se avisará a los jugadores aceptados. No se puede deshacer."
        confirmLabel="Cancelar equipo"
        tone="danger"
        busy={busyId === cancelTarget?.id}
        onConfirm={cancelPost}
        onClose={() => {
          if (busyId !== cancelTarget?.id) setCancelTarget(null);
        }}
      />
    </AppShell>
  );
}
