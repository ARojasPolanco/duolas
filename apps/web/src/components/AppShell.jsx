import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Gamepad2,
  Home,
  LogOut,
  Radio,
  Swords,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import BetaBadge from './BetaBadge.jsx';
import DeleteAccountDialog from './DeleteAccountDialog.jsx';
import RiotDisclaimer from './RiotDisclaimer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMatching } from '../context/MatchingContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { initialsOf } from '../utils/labels.js';

const primaryLinks = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/match', label: 'Match', icon: Swords },
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

export default function AppShell({ children, maxWidth = 'max-w-6xl' }) {
  const { user, logout } = useAuth();
  const { candidateCount } = useMatching();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const candidateBadge = candidateCount > 99 ? '99+' : candidateCount;

  useEffect(() => {
    setMenuOpen(false);
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

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
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

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
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
            <Link
              to="/notificaciones"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted transition hover:border-accent/50 hover:text-text"
              aria-label={`Notificaciones${unreadCount ? `: ${unreadCount} sin leer` : ''}`}
            >
              <Bell size={18} aria-hidden="true" />
              {unreadCount ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
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

      <main className={`mx-auto px-4 pb-28 pt-6 sm:px-6 lg:pb-12 ${maxWidth}`}>
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
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
