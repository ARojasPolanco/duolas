import { Link, NavLink } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import RiotDisclaimer from '../components/RiotDisclaimer.jsx';
import { LEGAL_LAST_UPDATED } from '../content/legal.js';

const legalLinks = [
  { to: '/terminos', label: 'Términos' },
  { to: '/privacidad', label: 'Privacidad' },
  { to: '/aviso-riot', label: 'Aviso de Riot' },
];

const tabClass = ({ isActive }) =>
  `inline-flex min-h-11 items-center rounded-full border px-3.5 text-xs font-semibold transition ${
    isActive
      ? 'border-accent/40 bg-accent/15 text-accent'
      : 'border-border text-muted hover:border-accent/40 hover:text-text'
  }`;

export default function LegalPage({ title, intro, sections }) {
  return (
    <div className="min-h-screen bg-bg px-5 py-8 text-text">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center text-xl font-extrabold tracking-tight"
          >
            Duo<span className="text-accent">LAS</span>
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted transition hover:text-text"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Volver al inicio
          </Link>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Documentos legales">
          {legalLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={tabClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <article className="mt-4 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Documento legal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
          {intro ? <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p> : null}

          <div className="mt-8 divide-y divide-border">
            {sections.map((section, index) => (
              <section key={section.title} className="py-5 first:pt-0 last:pb-0">
                <h2 className="flex items-baseline gap-2 text-base font-bold">
                  <span className="text-[11px] font-extrabold tracking-widest text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:pl-7">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>Última actualización: {LEGAL_LAST_UPDATED}.</p>
            <a
              href="mailto:soporte@duolas.app"
              className="inline-flex min-h-11 items-center text-accent hover:underline"
            >
              soporte@duolas.app
            </a>
          </div>
        </article>

        <RiotDisclaimer className="mt-4 text-center" />
      </div>
    </div>
  );
}
