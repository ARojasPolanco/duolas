import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Radio,
  RefreshCw,
  ShieldAlert,
  UserRoundCheck,
  UserX,
  Users,
} from 'lucide-react';
import AdminShell from '../components/AdminShell.jsx';
import api from '../config/api.js';

const numberFormatter = new Intl.NumberFormat('es-AR');
const formatNumber = (value) => numberFormatter.format(Number(value || 0));

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
    detail: 'Conexiones vigentes',
    icon: Clock3,
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
