import { Link } from 'react-router-dom';

export default function LegalPage({ title, intro, sections }) {
  return (
    <div className="min-h-screen bg-bg px-5 py-10 text-text">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-xl font-extrabold tracking-tight">
          Duo<span className="text-accent">LAS</span>
        </Link>

        <div className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Documento legal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
          {intro ? <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p> : null}

          <div className="mt-6 space-y-5">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-base font-bold">{section.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{section.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-8 border-t border-border pt-4 text-xs text-muted">
            Última actualización: octubre de 2026. Dudas: soporte@duolas.app
          </p>
        </div>

        <nav className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-muted">
          <Link to="/terminos" className="hover:text-text">
            Términos
          </Link>
          <Link to="/privacidad" className="hover:text-text">
            Privacidad
          </Link>
          <Link to="/aviso-riot" className="hover:text-text">
            Aviso de Riot
          </Link>
          <Link to="/" className="hover:text-text">
            Volver
          </Link>
        </nav>
      </div>
    </div>
  );
}
