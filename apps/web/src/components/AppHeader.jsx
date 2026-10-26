import { Link, NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-xs font-semibold transition ${
    isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:text-text'
  }`;

const links = [
  { to: '/inicio', label: 'Inicio' },
  { to: '/match', label: 'Match' },
  { to: '/disponible', label: 'Disponible' },
  { to: '/busco-1', label: 'Busco 1' },
  { to: '/invitaciones', label: 'Invitaciones' },
  { to: '/matches', label: 'Matches' },
];

export default function AppHeader() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const visibleLinks =
    user?.role === 'admin' ? [...links, { to: '/admin/reportes', label: 'Reportes' }] : links;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link to="/inicio" className="text-xl font-extrabold tracking-tight">
        Duo<span className="text-accent">LAS</span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap items-center gap-1">
          {visibleLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/notificaciones"
          className="relative rounded-lg border border-border p-2 text-muted hover:text-text"
          aria-label={`Notificaciones${unreadCount ? `: ${unreadCount} sin leer` : ''}`}
        >
          <Bell size={16} aria-hidden="true" />
          {unreadCount ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
