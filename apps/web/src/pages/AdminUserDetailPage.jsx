import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Gavel,
  MailCheck,
  MailX,
  Radio,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import AdminShell from '../components/AdminShell.jsx';
import api from '../config/api.js';
import {
  COUNTRY_LABELS,
  LANGUAGE_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  ROLE_LABELS,
  STYLE_LABELS,
  formatRank,
  formatRoles,
  initialsOf,
} from '../utils/labels.js';

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeZone: 'America/Argentina/Buenos_Aires',
});

const formatDateTime = (value) => (value ? dateTimeFormatter.format(new Date(value)) : '-');
const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : '-');

const SANCTION_LABELS = {
  warned: 'Advertencia',
  suspended_7d: 'Suspensión 7 días',
  suspended_30d: 'Suspensión 30 días',
  suspended_permanent: 'Suspensión permanente',
};

const REPORT_STATUS_STYLES = {
  open: 'border-gold/40 bg-gold/10 text-gold',
  reviewing: 'border-accent/40 bg-accent/10 text-accent',
  resolved: 'border-success/40 bg-success/10 text-success',
  dismissed: 'border-border bg-surface-2 text-muted',
};

const Info = ({ label, children }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
    <dd className="mt-1 text-sm font-semibold text-text">{children}</dd>
  </div>
);

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/v1/admin/users/${id}`);
      setUser(res.data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar el usuario.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <Link
          to="/admin/usuarios"
          className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted hover:text-text"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Volver a usuarios
        </Link>

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-2xl border border-border bg-surface" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
              <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
            </div>
          </div>
        ) : user ? (
          <>
            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-lg font-extrabold text-accent">
                    {initialsOf(user.username)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-2xl font-extrabold">{user.username}</h1>
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                          user.role === 'admin'
                            ? 'border-gold/40 bg-gold/10 text-gold'
                            : 'border-border bg-surface-2 text-muted'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Jugador'}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                          user.isDeleted || user.status === 'suspended'
                            ? 'border-danger/40 bg-danger/10 text-danger'
                            : 'border-success/40 bg-success/10 text-success'
                        }`}
                      >
                        {user.isDeleted
                          ? user.deletionScheduledFor
                            ? 'Baja pendiente'
                            : 'Eliminado'
                          : user.status === 'suspended'
                            ? 'Suspendido'
                            : 'Activo'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                  <div className="rounded-xl border border-border bg-bg px-4 py-3">
                    <p className="text-lg font-extrabold">{user.stats.openReports}</p>
                    <p className="text-[10px] text-muted">Reportes abiertos</p>
                  </div>
                  <div className="rounded-xl border border-border bg-bg px-4 py-3">
                    <p className="text-lg font-extrabold">{user.stats.sanctions}</p>
                    <p className="text-[10px] text-muted">Sanciones</p>
                  </div>
                  <div className="rounded-xl border border-border bg-bg px-4 py-3">
                    <p className="text-lg font-extrabold">{user.stats.activeConnections}</p>
                    <p className="text-[10px] text-muted">Matches activos</p>
                  </div>
                  <div className="rounded-xl border border-border bg-bg px-4 py-3">
                    <p className="text-lg font-extrabold">{user.warningCount}</p>
                    <p className="text-[10px] text-muted">Advertencias</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2">
                  <UserRound className="text-accent" size={18} aria-hidden="true" />
                  <h2 className="text-lg font-bold">Cuenta</h2>
                </div>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Info label="ID">{user.id}</Info>
                  <Info label="Rol">{user.role === 'admin' ? 'Admin' : 'Jugador'}</Info>
                  <Info label="Email">
                    <span className="inline-flex items-center gap-1.5">
                      {user.emailVerified ? (
                        <MailCheck size={14} className="text-success" aria-hidden="true" />
                      ) : (
                        <MailX size={14} className="text-danger" aria-hidden="true" />
                      )}
                      {user.emailVerified ? 'Verificado' : 'Pendiente'}
                    </span>
                  </Info>
                  <Info label="Alta">{formatDate(user.createdAt)}</Info>
                  <Info label="Último login">{formatDateTime(user.lastLoginAt)}</Info>
                  <Info label="Última actividad">{formatDateTime(user.lastActiveAt)}</Info>
                  <Info label="Suspensión">
                    {user.status === 'suspended'
                      ? user.suspendedUntil
                        ? `Hasta ${formatDateTime(user.suspendedUntil)}`
                        : 'Permanente'
                      : 'Sin suspensión'}
                  </Info>
                  <Info label="Baja">
                    {user.isDeleted
                      ? user.deletionScheduledFor
                        ? `Programada para ${formatDate(user.deletionScheduledFor)}`
                        : 'Eliminada'
                      : 'No solicitada'}
                  </Info>
                </dl>
                {user.suspensionReason ? (
                  <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs leading-relaxed text-danger">
                    Motivo de suspensión: {user.suspensionReason}
                  </p>
                ) : null}
              </section>

              <section className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-accent" size={18} aria-hidden="true" />
                  <h2 className="text-lg font-bold">Perfil de jugador</h2>
                </div>

                {user.profile ? (
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Info label="Riot ID">{user.profile.riotId}</Info>
                    <Info label="Discord">{user.profile.discordTag || '-'}</Info>
                    <Info label="Rango Solo/Dúo">{formatRank(user.profile, 'solo_duo')}</Info>
                    <Info label="Rango Flex">{formatRank(user.profile, 'flex')}</Info>
                    <Info label="Roles">{formatRoles(user.profile)}</Info>
                    <Info label="País">
                      {COUNTRY_LABELS[user.profile.country] || user.profile.country || '-'}
                    </Info>
                    <Info label="Estilo">
                      {STYLE_LABELS[user.profile.playStyle] || user.profile.playStyle || '-'}
                    </Info>
                    <Info label="Idiomas">
                      {(user.profile.languages || [])
                        .map((language) => LANGUAGE_LABELS[language] || language)
                        .join(', ') || '-'}
                    </Info>
                    <Info label="Micrófono">{user.profile.hasMic ? 'Sí' : 'No'}</Info>
                    <Info label="Reputación">
                      {user.profile.reputation.score}% · {user.profile.reputation.positive}{' '}
                      positivos / {user.profile.reputation.negative} negativos
                    </Info>
                    <Info label="Horarios">
                      {(user.profile.scheduleBlocks || []).length} bloques
                    </Info>
                    <Info label="Perfil completo">{user.profileCompleted ? 'Sí' : 'No'}</Info>
                    <Info label="Origen del rango">{user.profile.rankSource || '-'}</Info>
                    <Info label="Origen del rango Flex">{user.profile.flexRankSource || '-'}</Info>
                  </dl>
                ) : (
                  <p className="mt-4 rounded-xl border border-border bg-bg p-4 text-sm text-muted">
                    Esta cuenta no tiene perfil de jugador. Es normal en cuentas administrativas.
                  </p>
                )}

                {user.profile?.bio ? (
                  <p className="mt-4 rounded-xl border border-border bg-bg p-3 text-xs leading-relaxed text-muted">
                    {user.profile.bio}
                  </p>
                ) : null}
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-danger" size={18} aria-hidden="true" />
                  <h2 className="text-lg font-bold">Reportes recibidos</h2>
                  <span className="ml-auto rounded-full border border-border px-2 py-1 text-[10px] text-muted">
                    {user.stats.totalReports} total
                  </span>
                </div>

                {user.reports.length ? (
                  <ul className="mt-4 space-y-2">
                    {user.reports.map((report) => (
                      <li key={report.id} className="rounded-xl border border-border bg-bg p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            {REPORT_REASON_LABELS[report.reason] || report.reason}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              REPORT_STATUS_STYLES[report.status] || REPORT_STATUS_STYLES.open
                            }`}
                          >
                            {REPORT_STATUS_LABELS[report.status] || report.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          {report.reporter?.username || 'Usuario'} ·{' '}
                          {formatDateTime(report.createdAt)}
                        </p>
                        {report.details ? (
                          <p className="mt-2 text-xs leading-relaxed text-muted">
                            {report.details}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted">Sin reportes recibidos.</p>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2">
                  <Gavel className="text-accent" size={18} aria-hidden="true" />
                  <h2 className="text-lg font-bold">Sanciones</h2>
                </div>

                {user.sanctions.length ? (
                  <ul className="mt-4 space-y-2">
                    {user.sanctions.map((sanction) => (
                      <li key={sanction.id} className="rounded-xl border border-border bg-bg p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            {SANCTION_LABELS[sanction.action] || sanction.action}
                          </p>
                          <span className="text-[10px] text-muted">
                            {formatDateTime(sanction.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{sanction.reason}</p>
                        <p className="mt-1 text-[10px] text-muted">
                          Por {sanction.admin?.username || 'admin'}
                          {sanction.expiresAt
                            ? ` · vence ${formatDateTime(sanction.expiresAt)}`
                            : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted">Sin sanciones registradas.</p>
                )}

                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Radio className="text-accent" size={16} aria-hidden="true" />
                    Disponible ya
                  </div>
                  {user.availability ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      Activo como{' '}
                      {user.availability.roles.map((role) => ROLE_LABELS[role] || role).join(' / ')}{' '}
                      · vence {formatDateTime(user.availability.expiresAt)}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Sin disponibilidad activa.</p>
                  )}
                  <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
                    <Clock3 size={12} aria-hidden="true" />
                    {user.stats.totalConnections} conexiones históricas
                  </p>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
