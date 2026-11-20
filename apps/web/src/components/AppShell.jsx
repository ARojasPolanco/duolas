import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AtSign,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Gamepad2,
  Home,
  Inbox,
  LogOut,
  MessageSquare,
  Radio,
  ShieldAlert,
  Swords,
  Trash2,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import BetaBadge from './BetaBadge.jsx';
import DeleteAccountDialog from './DeleteAccountDialog.jsx';
import RiotDisclaimer from './RiotDisclaimer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMatching } from '../context/MatchingContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { initialsOf } from '../utils/labels.js';

const primaryLinks = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/match', label: 'Match', icon: Swords },
  { to: '/clash', label: 'Clash', icon: Trophy },
  { to: '/aram', label: 'ARAM', icon: Gamepad2 },
  { to: '/disponible', label: 'Disponible', icon: Radio },
  { to: '/busco-1', label: 'Busco 1', icon: ClipboardList },
  { to: '/matches', label: 'Matches', icon: Users },
];

const desktopLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface-2 hover:text-text'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition ${
    isActive ? 'text-accent' : 'text-muted'
  }`;

const NOTIFICATION_ICONS = {
  match_created: Swords,
  invite_received: Inbox,
  invite_accepted: CheckCheck,
  invite_declined: Inbox,
  invite_cancelled: Inbox,
  application_received: ClipboardList,
  application_accepted: CheckCheck,
  application_rejected: ClipboardList,
  application_withdrawn: ClipboardList,
  aram_application_received: ClipboardList,
  aram_application_accepted: CheckCheck,
  aram_application_rejected: ClipboardList,
  aram_application_withdrawn: ClipboardList,
  post_suggested: ClipboardList,
  feedback_revealed: MessageSquare,
  warning_received: ShieldAlert,
  account_suspended: ShieldAlert,
  username_change_requested: AtSign,
  username_change_suggested: AtSign,
  username_changed: CheckCheck,
  username_change_rejected: AtSign,
  match_reminder: Swords,
};

const notificationDateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

const formatNotificationDate = (value) =>
  value ? notificationDateFormatter.format(new Date(value)) : '-';

export default function AppShell({ children, maxWidth = 'max-w-6xl' }) {
  const { user, logout } = useAuth();
  const { candidateCount } = useMatching();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markRead,
    markAllRead,
  } = useNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const candidateBadge = candidateCount > 99 ? '99+' : candidateCount;

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    const closeOnOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [notificationsOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const openNotification = async (notification) => {
    setNotificationsOpen(false);
    try {
      if (!notification.isRead) await markRead(notification.id);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos abrir la notificación.');
      return;
    }

    if (notification.data?.url) navigate(notification.data.url);
  };

  const markAllNotifications = async () => {
    try {
      await markAllRead();
      toast.success('Todas las notificaciones quedaron leídas.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos marcar las notificaciones.');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link
            to="/inicio"
            className="flex min-h-11 shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight"
          >
            Duo<span className="text-accent">LAS</span>
            <BetaBadge />
          </Link>

          <nav
            className="ml-4 hidden items-center gap-1 min-[1200px]:flex"
            aria-label="Navegación principal"
          >
            {primaryLinks.map((link) => {
              const badge = link.to === '/match' && candidateCount ? candidateBadge : null;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={(state) => `${desktopLinkClass(state)} relative`}
                  aria-label={
                    badge ? `${link.label}: ${candidateCount} candidatos disponibles` : undefined
                  }
                >
                  {link.label}
                  {badge ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg">
                      {badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
            <NavLink to="/invitaciones" className={desktopLinkClass}>
              Invitaciones
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((current) => !current);
                  setMenuOpen(false);
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted transition hover:border-accent/50 hover:text-text"
                aria-label={`Notificaciones${unreadCount ? `: ${unreadCount} sin leer` : ''}`}
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} aria-hidden="true" />
                {unreadCount ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen ? (
                <div
                  role="dialog"
                  aria-label="Notificaciones"
                  className="absolute right-0 mt-2 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-bold">Notificaciones</p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {unreadCount ? `${unreadCount} sin leer` : 'Todo al día'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotifications}
                      disabled={!unreadCount}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] font-semibold text-muted disabled:opacity-40"
                    >
                      <CheckCheck size={12} aria-hidden="true" />
                      Marcar todas
                    </button>
                  </div>

                  <div className="max-h-[min(60vh,420px)] overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="space-y-2 p-4">
                        <div className="h-12 animate-pulse rounded-xl bg-surface-2" />
                        <div className="h-12 animate-pulse rounded-xl bg-surface-2" />
                      </div>
                    ) : notifications.length ? (
                      notifications.slice(0, 6).map((notification) => {
                        const Icon = NOTIFICATION_ICONS[notification.type] || Bell;

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => openNotification(notification)}
                            className={`flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition last:border-b-0 hover:bg-surface-2 ${
                              notification.isRead ? 'opacity-75' : ''
                            }`}
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                              <Icon size={15} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start gap-2">
                                <span className="line-clamp-2 flex-1 text-xs font-semibold">
                                  {notification.title}
                                </span>
                                {!notification.isRead ? (
                                  <span
                                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                                    aria-label="Sin leer"
                                  />
                                ) : null}
                              </span>
                              {notification.message ? (
                                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted">
                                  {notification.message}
                                </span>
                              ) : null}
                              <span className="mt-1 block text-[10px] text-muted">
                                {formatNotificationDate(notification.createdAt)}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center text-xs text-muted">
                        No tenés notificaciones todavía.
                      </div>
                    )}
                  </div>

                  <Link
                    to="/notificaciones"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex min-h-11 items-center justify-center border-t border-border text-xs font-semibold text-accent hover:bg-surface-2"
                  >
                    Ver todas
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((current) => !current);
                  setNotificationsOpen(false);
                }}
                className="flex h-11 items-center gap-2 rounded-xl border border-border px-2 transition hover:border-accent/50"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Menú de cuenta"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-[10px] font-extrabold text-accent">
                  {initialsOf(user?.username)}
                </span>
                <span className="hidden max-w-24 truncate text-xs font-semibold sm:block">
                  {user?.username}
                </span>
                <ChevronDown
                  size={14}
                  className={`hidden text-muted transition sm:block ${menuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-bold">{user?.username}</p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      to="/perfil"
                      role="menuitem"
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
                    >
                      <UserRound size={16} aria-hidden="true" />
                      Mi perfil
                    </Link>
                    <Link
                      to="/como-funciona"
                      role="menuitem"
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
                    >
                      <BookOpen size={16} aria-hidden="true" />
                      Cómo funciona
                    </Link>
                    <Link
                      to="/invitaciones"
                      role="menuitem"
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
                    >
                      <ClipboardList size={16} aria-hidden="true" />
                      Invitaciones
                    </Link>
                    <Link
                      to="/notificaciones"
                      role="menuitem"
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
                    >
                      <Bell size={16} aria-hidden="true" />
                      Notificaciones
                    </Link>
                  </div>

                  <div className="border-t border-border p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteOpen(true);
                      }}
                      className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-danger transition hover:bg-danger/10"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Eliminar cuenta
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 pb-28 pt-6 sm:px-6 min-[1200px]:pb-12 ${maxWidth}`}>
        {children}
        <footer className="mt-10 border-t border-border pt-4">
          <nav className="flex flex-wrap gap-x-4 text-[11px] font-semibold text-muted">
            <Link to="/como-funciona" className="inline-flex min-h-11 items-center hover:text-text">
              Cómo funciona
            </Link>
            <Link to="/terminos" className="inline-flex min-h-11 items-center hover:text-text">
              Términos
            </Link>
            <Link to="/privacidad" className="inline-flex min-h-11 items-center hover:text-text">
              Privacidad
            </Link>
            <Link to="/aviso-riot" className="inline-flex min-h-11 items-center hover:text-text">
              Aviso de Riot
            </Link>
          </nav>
          <RiotDisclaimer className="mt-2 max-w-4xl" />
          <p className="mt-2 text-[11px] text-muted">
            Duo LAS está en beta: pueden haber cambios y errores mientras lo probamos.
          </p>
        </footer>
      </main>

      {deleteOpen ? <DeleteAccountDialog onClose={() => setDeleteOpen(false)} /> : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl min-[1200px]:hidden"
        aria-label="Navegación mobile"
      >
        <div className="mx-auto flex max-w-2xl items-stretch">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const badge = link.to === '/match' && candidateCount ? candidateBadge : null;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={mobileLinkClass}
                aria-label={
                  badge ? `${link.label}: ${candidateCount} candidatos disponibles` : undefined
                }
              >
                <span className="relative inline-flex">
                  <Icon size={19} aria-hidden="true" />
                  {badge ? (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg">
                      {badge}
                    </span>
                  ) : null}
                </span>
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
