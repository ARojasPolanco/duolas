import { Link } from 'react-router-dom';
import { Radio, Swords, Users } from 'lucide-react';

const features = [
  {
    icon: Swords,
    title: 'Match por afinidad',
    description: 'Rango, roles, horarios, estilo e idioma. Sin comentar el nick y esperar.',
  },
  {
    icon: Radio,
    title: 'Disponible ya',
    description: 'Ponete disponible por 30 o 60 minutos y recibí invitaciones al toque.',
  },
  {
    icon: Users,
    title: 'Busco 1',
    description: 'Tu grupo tiene un lugar libre. Publicá y encontrá a quien encaja.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="text-lg font-extrabold tracking-tight">
          Duo<span className="text-accent">LAS</span>
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
          Solo LAS · +18
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <section className="pt-10 sm:pt-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            League of Legends · LAS
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">
            Encontrá tu duo en LAS y subí de elo.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Duo LAS ordena la búsqueda de duo: perfiles compatibles, disponibilidad inmediata y
            reputación. Gratis, mobile-first y solo para mayores de 18 años.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="rounded-xl bg-accent px-6 py-3.5 text-center text-sm font-bold text-bg transition hover:bg-accent-strong"
            >
              Crear cuenta
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-border bg-surface px-6 py-3.5 text-center text-sm font-bold text-text transition hover:border-accent"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold">Cómo funciona</h2>
          <ol className="mt-5 grid gap-5 text-sm text-muted sm:grid-cols-3">
            <li>
              <span className="mb-2 block text-2xl font-extrabold text-accent">01</span>
              Completá tu perfil con Riot ID, rango, roles y horarios.
            </li>
            <li>
              <span className="mb-2 block text-2xl font-extrabold text-accent">02</span>
              Buscá duo por afinidad o activá Disponible ya.
            </li>
            <li>
              <span className="mb-2 block text-2xl font-extrabold text-accent">03</span>
              Con interés mutuo se revela el contacto y coordinan.
            </li>
          </ol>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Duo LAS</span>
          <span>No afiliado ni avalado por Riot Games.</span>
        </div>
      </footer>
    </div>
  );
}
