import { Link } from 'react-router-dom';
import BetaBadge from './BetaBadge.jsx';
import RiotDisclaimer from './RiotDisclaimer.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 py-10 text-text">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mx-auto mb-8 flex min-h-11 w-fit items-center gap-2 text-2xl font-extrabold tracking-tight"
        >
          Duo<span className="text-accent">LAS</span>
          <BetaBadge />
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}

        <nav className="mt-4 flex flex-wrap justify-center gap-x-4 text-[11px] font-semibold text-muted">
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
        <RiotDisclaimer className="mt-2 text-center" />
      </div>
    </div>
  );
}
