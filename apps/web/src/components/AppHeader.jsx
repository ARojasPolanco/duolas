import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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
  const visibleLinks =
    user?.role === 'admin' ? [...links, { to: '/admin/reportes', label: 'Reportes' }] : links;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link to="/inicio" className="text-xl font-extrabold tracking-tight">
        Duo<span className="text-accent">LAS</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-1">
        {visibleLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
