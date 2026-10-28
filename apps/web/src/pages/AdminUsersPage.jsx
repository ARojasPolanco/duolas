import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  MailCheck,
  MailX,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react';
import AdminShell from '../components/AdminShell.jsx';
import api from '../config/api.js';
import { formatRank, formatRoles, initialsOf } from '../utils/labels.js';

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

const formatDateTime = (value) => (value ? dateTimeFormatter.format(new Date(value)) : '-');

const roleStyles = {
  admin: 'border-gold/40 bg-gold/10 text-gold',
  player: 'border-border bg-surface-2 text-muted',
};

const stateLabel = (user) => {
  if (user.isDeleted) {
    return user.deletionScheduledFor ? 'Baja pendiente' : 'Eliminado';
  }
  return user.status === 'suspended' ? 'Suspendido' : 'Activo';
};

const stateStyles = (user) => {
  if (user.isDeleted) return 'border-danger/40 bg-danger/10 text-danger';
  if (user.status === 'suspended') return 'border-danger/40 bg-danger/10 text-danger';
  return 'border-success/40 bg-success/10 text-success';
};

const selectClass =
  'w-full min-w-0 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const [search, setSearch] = useState(urlParams.get('search') || '');
  const [role, setRole] = useState(urlParams.get('role') || '');
  const [status, setStatus] = useState(urlParams.get('status') || '');
  const [account, setAccount] = useState(urlParams.get('account') || 'active');
  const [emailVerified, setEmailVerified] = useState(urlParams.get('emailVerified') || '');
  const [profileCompleted, setProfileCompleted] = useState(urlParams.get('profileCompleted') || '');
  const [page, setPage] = useState(Number(urlParams.get('page')) || 1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        account: account || 'active',
        page,
        limit: 20,
      };
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (status) params.status = status;
      if (emailVerified) params.emailVerified = emailVerified;
      if (profileCompleted) params.profileCompleted = profileCompleted;

      const res = await api.get('/v1/admin/users', { params });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [account, emailVerified, page, profileCompleted, role, search, status]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const openUser = (userId) => {
    navigate(`/admin/usuarios/${userId}`);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
            <h1 className="mt-2 text-3xl font-extrabold">Usuarios</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Cuentas, perfiles, verificación, actividad y señales de moderación.
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

        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <label className="relative block sm:col-span-2">
              <span className="sr-only">Buscar usuario</span>
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={resetPage(setSearch)}
                maxLength={100}
                placeholder="Buscar username o email"
                className="w-full min-w-0 rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-xs text-text placeholder:text-muted/70"
              />
            </label>
            <select value={role} onChange={resetPage(setRole)} className={selectClass}>
              <option value="">Todos los roles</option>
              <option value="player">Jugador</option>
              <option value="admin">Admin</option>
            </select>
            <select value={status} onChange={resetPage(setStatus)} className={selectClass}>
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
            </select>
            <select value={account} onChange={resetPage(setAccount)} className={selectClass}>
              <option value="active">Cuentas activas</option>
              <option value="pending_deletion">Baja pendiente</option>
              <option value="deleted">Eliminadas</option>
              <option value="all">Todas</option>
            </select>
            <select
              value={emailVerified}
              onChange={resetPage(setEmailVerified)}
              className={selectClass}
            >
              <option value="">Email: todos</option>
              <option value="true">Email verificado</option>
              <option value="false">Email pendiente</option>
            </select>
            <select
              value={profileCompleted}
              onChange={resetPage(setProfileCompleted)}
              className={selectClass}
            >
              <option value="">Perfil: todos</option>
              <option value="true">Perfil completo</option>
              <option value="false">Perfil incompleto</option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
            <span>
              {pagination
                ? `${pagination.total} cuenta${pagination.total === 1 ? '' : 's'}`
                : 'Cargando cuentas'}
            </span>
            {pagination ? (
              <span>
                Página {pagination.page} de {pagination.totalPages}
              </span>
            ) : null}
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <Users className="mx-auto text-accent" size={30} aria-hidden="true" />
            <h2 className="mt-3 font-bold">No encontramos usuarios</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Probá cambiar la búsqueda o los filtros.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Usuario</th>
                    <th className="px-4 py-3 font-semibold">Rol</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Perfil</th>
                    <th className="px-4 py-3 text-center font-semibold">Reportes</th>
                    <th className="px-4 py-3 font-semibold">Último acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      tabIndex={0}
                      onClick={() => openUser(user.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openUser(user.id);
                        }
                      }}
                      className="cursor-pointer border-b border-border/70 transition last:border-b-0 hover:bg-surface-2/70"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[11px] font-extrabold text-accent">
                            {initialsOf(user.username)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{user.username}</p>
                            <p className="truncate text-xs text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                            roleStyles[user.role] || roleStyles.player
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Jugador'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${stateStyles(
                            user
                          )}`}
                        >
                          {stateLabel(user)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold">
                          {user.profileCompleted ? 'Completo' : 'Incompleto'}
                        </p>
                        <p className="text-[11px] text-muted">
                          {user.profile
                            ? `${formatRank(user.profile)} · ${formatRoles(user.profile)}`
                            : 'Sin perfil de jugador'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={
                            user.counts.openReports ? 'font-bold text-danger' : 'text-muted'
                          }
                        >
                          {user.counts.openReports}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatDateTime(user.lastActiveAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {users.map((user) => (
                <Link
                  key={user.id}
                  to={`/admin/usuarios/${user.id}`}
                  className="block rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-extrabold text-accent">
                      {initialsOf(user.username)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{user.username}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                        roleStyles[user.role] || roleStyles.player
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Jugador'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold">
                    <span className={`rounded-full border px-2 py-1 ${stateStyles(user)}`}>
                      {stateLabel(user)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted">
                      {user.emailVerified ? (
                        <MailCheck size={11} aria-hidden="true" />
                      ) : (
                        <MailX size={11} aria-hidden="true" />
                      )}
                      {user.emailVerified ? 'Email verificado' : 'Email pendiente'}
                    </span>
                    <span className="rounded-full border border-border px-2 py-1 text-muted">
                      {user.profileCompleted ? 'Perfil completo' : 'Perfil incompleto'}
                    </span>
                    {user.counts.openReports ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-2 py-1 text-danger">
                        <ShieldAlert size={11} aria-hidden="true" />
                        {user.counts.openReports} reporte
                        {user.counts.openReports === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-[11px] text-muted">
                    Último acceso: {formatDateTime(user.lastActiveAt)}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-muted disabled:opacity-40"
            >
              <ChevronLeft size={15} aria-hidden="true" />
              Anterior
            </button>
            <span className="text-xs text-muted">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={page >= pagination.totalPages}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-muted disabled:opacity-40"
            >
              Siguiente
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
