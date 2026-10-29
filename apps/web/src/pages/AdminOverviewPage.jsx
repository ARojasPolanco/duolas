import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Heart,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  UserRoundCheck,
  UserX,
  Users,
} from 'lucide-react';
import AdminShell from '../components/AdminShell.jsx';
import api from '../config/api.js';

const numberFormatter = new Intl.NumberFormat('es-AR');
const formatNumber = (value) => numberFormatter.format(Number(value || 0));

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : '-');

const LIKE_STATUS = {
  pending: { label: 'Pendiente', className: 'border-gold/40 bg-gold/10 text-gold' },
  matched: { label: 'Match', className: 'border-success/40 bg-success/10 text-success' },
  cancelled: { label: 'Cancelado', className: 'border-border bg-surface-2 text-muted' },
};

const MATCH_STATUS = {
  active: { label: 'Activo', className: 'border-success/40 bg-success/10 text-success' },
  archived: { label: 'Archivado', className: 'border-border bg-surface-2 text-muted' },
};

const MATCH_SOURCE = {
  like: 'Like',
  availability: 'Disponible ya',
  post: 'Busco 1',
};

const statusBadge = (status, map) => {
  const value = map[status] || {
    label: status,
    className: 'border-border bg-surface-2 text-muted',
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${value.className}`}>
      {value.label}
    </span>
  );
};

const cards = (overview) => [
  {
    label: 'Usuarios activos',
    value: overview.users,
    detail: `${formatNumber(overview.players)} jugadores · ${formatNumber(
      overview.admins
    )} ${overview.admins === 1 ? 'admin' : 'admins'}`,
    icon: Users,
    to: '/admin/usuarios',
  },
  {
    label: 'Nuevos esta semana',
    value: overview.newUsers7d,
    detail: 'Altas de los últimos 7 días',
    icon: Activity,
    to: '/admin/usuarios',
  },
  {
    label: 'Email verificado',
    value: overview.emailVerified,
    detail: 'Cuentas activas con email confirmado',
    icon: UserRoundCheck,
    to: '/admin/usuarios?emailVerified=true',
  },
  {
    label: 'Perfiles completos',
    value: overview.profilesComplete,
    detail: 'Jugadores listos para match',
    icon: CheckCircle2,
    to: '/admin/usuarios?profileCompleted=true',
  },
  {
    label: 'Suspendidos',
    value: overview.suspended,
    detail: 'Cuentas activas con suspensión vigente',
    icon: UserX,
    to: '/admin/usuarios?status=suspended',
  },
  {
    label: 'Reportes abiertos',
    value: overview.openReports,
    detail: 'Pendientes de revisión',
    icon: ShieldAlert,
    to: '/admin/reportes',
  },
  {
    label: 'Matches activos',
    value: overview.activeConnections,
    detail: `${formatNumber(overview.matches24h)} en 24 h · ${formatNumber(
      overview.matchesTotal
    )} totales`,
    icon: Clock3,
    to: '/admin/usuarios',
  },
  {
    label: 'Likes enviados',
    value: overview.likesTotal,
    detail: `${formatNumber(overview.likes24h)} en las últimas 24 h`,
    icon: Heart,
    to: '/admin/usuarios',
  },
  {
    label: 'Likes pendientes',
    value: overview.likesPending,
    detail: 'Esperando respuesta',
    icon: Send,
    to: '/admin/usuarios',
  },
  {
    label: 'Disponibles ahora',
    value: overview.activeAvailability,
    detail: 'Sesiones de Disponible ya activas',
    icon: Radio,
    to: '/admin/usuarios',
  },
  {
    label: 'Bajas pendientes',
    value: overview.pendingDeletions,
    detail: 'Cuentas dentro del plazo de 30 días',
    icon: UserX,
    to: '/admin/usuarios?account=pending_deletion',
  },
];

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/v1/admin/overview');
      setOverview(res.data.overview);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar el resumen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
            <h1 className="mt-2 text-3xl font-extrabold">Resumen general</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Estado operativo de la comunidad, moderación y actividad del producto.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-muted"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : overview ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards(overview).map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  to={card.to}
                  className="rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/60 hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-muted">{card.label}</p>
                    <Icon className="text-accent" size={18} aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-3xl font-extrabold">{formatNumber(card.value)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{card.detail}</p>
                </Link>
              );
            })}
          </div>
        ) : null}

        {overview ? (
          <section id="actividad" className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Actividad
                  </p>
                  <h2 className="mt-1 text-lg font-bold">Últimos likes</h2>
                </div>
                <Heart className="text-accent" size={20} aria-hidden="true" />
              </div>

              {overview.recentLikes?.length ? (
                <div className="mt-4 divide-y divide-border">
                  {overview.recentLikes.map((like) => (
                    <div
                      key={like.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {like.from ? (
                            <Link
                              to={`/admin/usuarios/${like.from.id}`}
                              className="text-accent hover:underline"
                            >
                              {like.from.username}
                            </Link>
                          ) : (
                            'Usuario'
                          )}
                          <span className="px-1.5 text-muted">→</span>
                          {like.to ? (
                            <Link
                              to={`/admin/usuarios/${like.to.id}`}
                              className="text-accent hover:underline"
                            >
                              {like.to.username}
                            </Link>
                          ) : (
                            'Usuario'
                          )}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">{formatDate(like.createdAt)}</p>
                      </div>
                      {statusBadge(like.status, LIKE_STATUS)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-border bg-bg px-4 py-5 text-sm text-muted">
                  Todavía no hay likes registrados.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Actividad
                  </p>
                  <h2 className="mt-1 text-lg font-bold">Últimos matches</h2>
                </div>
                <Clock3 className="text-accent" size={20} aria-hidden="true" />
              </div>

              {overview.recentMatches?.length ? (
                <div className="mt-4 divide-y divide-border">
                  {overview.recentMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {match.users.map((user, index) => (
                            <span key={user.id}>
                              {index > 0 ? <span className="px-1.5 text-muted">↔</span> : null}
                              <Link
                                to={`/admin/usuarios/${user.id}`}
                                className="text-accent hover:underline"
                              >
                                {user.username}
                              </Link>
                            </span>
                          ))}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {MATCH_SOURCE[match.source] || match.source} ·{' '}
                          {formatDate(match.createdAt)}
                        </p>
                      </div>
                      {statusBadge(match.status, MATCH_STATUS)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-border bg-bg px-4 py-5 text-sm text-muted">
                  Todavía no hay matches registrados.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-3">
          <Link
            to="/admin/usuarios"
            className="rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/60"
          >
            <Users className="text-accent" size={22} aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold">Explorar usuarios</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Buscá cuentas, revisá perfiles, sanciones, reportes y actividad.
            </p>
          </Link>
          <Link
            to="/admin/reportes"
            className="rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/60"
          >
            <ShieldAlert className="text-accent" size={22} aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold">Moderación</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Resolvé reportes abiertos y aplicá advertencias o suspensiones.
            </p>
          </Link>
          <Link
            to="/admin/metrics"
            className="rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/60"
          >
            <BarChart3 className="text-accent" size={22} aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold">Métricas del MVP</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Revisá tiempo al primer duo, retención y uso de Disponible ya.
            </p>
          </Link>
        </section>
      </div>
    </AdminShell>
  );
}
