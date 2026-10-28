import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, LayoutDashboard, LogOut, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/reportes', label: 'Reportes', icon: ShieldAlert },
  { to: '/admin/metrics', label: 'Métricas', icon: BarChart3 },
];

const desktopLinkClass = ({ isActive }) =>
  `inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
    isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface-2 hover:text-text'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${
    isActive ? 'bg-accent/15 text-accent' : 'text-muted'
  }`;

export default function AdminShell({ children, maxWidth = 'max-w-6xl' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link
            to="/admin"
            className="flex min-h-11 shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight"
          >
            <span>
              Duo<span className="text-accent">LAS</span>
            </span>
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
              Admin
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Navegación admin">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink key={link.to} to={link.to} end={link.end} className={desktopLinkClass}>
                  <Icon size={16} aria-hidden="true" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden max-w-40 truncate text-xs font-semibold text-muted sm:block">
              {user?.username}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted transition hover:border-danger/50 hover:text-danger"
              aria-label="Cerrar sesión"
            >
              <LogOut size={17} aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-1 lg:hidden"
          aria-label="Navegación admin mobile"
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} end={link.end} className={mobileLinkClass}>
                <Icon size={15} aria-hidden="true" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className={`mx-auto px-4 pb-12 pt-6 sm:px-6 ${maxWidth}`}>
        {children}
        <footer className="mt-10 border-t border-border pt-4 text-[11px] font-semibold text-muted">
          Panel interno de Duo LAS
        </footer>
      </main>
    </div>
  );
}
