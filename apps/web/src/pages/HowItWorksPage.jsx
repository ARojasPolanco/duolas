import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Radio,
  ShieldCheck,
  Smartphone,
  Swords,
  Users,
} from 'lucide-react';
import BetaBadge from '../components/BetaBadge.jsx';
import RiotDisclaimer from '../components/RiotDisclaimer.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const searchModes = [
  {
    icon: Swords,
    title: 'Match por afinidad',
    description:
      'Para encontrar un duo estable. Ves candidatos por rango, roles, horarios, idioma y estilo. Si los dos se dan like, se crea el match.',
    points: ['Solo/Dúo o Flex', 'Like mutuo', 'Contacto recién con el match'],
  },
  {
    icon: Radio,
    title: 'Disponible ya',
    description:
      'Para jugar ahora. Abrís tu disponibilidad por 30 o 60 minutos, elegís roles y cola, y recibís invitaciones de gente disponible.',
    points: ['Jugás en el momento', 'Invitaciones directas', 'Se cierra solo al vencer'],
  },
  {
    icon: ClipboardList,
    title: 'Busco 1',
    description:
      'Para completar tu grupo, ideal para Flex. Publicás el lugar libre con rango, roles y cola; los jugadores compatibles se postulan.',
    points: ['Tu grupo tiene un lugar', 'Recibís postulaciones', 'Aceptás la que encaja'],
  },
];

const steps = [
  {
    number: '01',
    title: 'Completá tu perfil',
    text: 'Cargá tu Riot ID actual, rango, roles, horarios, idioma y estilo. El username de Duo LAS no es tu Riot ID.',
  },
  {
    number: '02',
    title: 'Elegí cómo buscar',
    text: 'Match para un duo estable, Disponible ya para jugar en el momento o Busco 1 para completar un grupo.',
  },
  {
    number: '03',
    title: 'Mostrá interés',
    text: 'Dale like a un candidato, abrí disponibilidad o postulate a un Busco 1. Nada se revela hasta que haya conexión.',
  },
  {
    number: '04',
    title: 'Coordinen y jueguen',
    text: 'Cuando hay match o aceptás una invitación/postulación, se revela el Riot ID y el Discord si lo cargaron.',
  },
];

const SectionLabel = ({ children }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{children}</p>
);

const CheckItem = ({ children }) => (
  <li className="flex items-start gap-2 text-sm leading-relaxed text-muted">
    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
    <span>{children}</span>
  </li>
);

export default function HowItWorksPage() {
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin' : '/inicio';

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-5">
        <Link to="/" className="flex min-h-11 items-center gap-2 text-xl font-extrabold">
          Duo<span className="text-accent">LAS</span>
          <BetaBadge />
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {user ? (
            <Link
              to={home}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold"
            >
              Ir a la app
            </Link>
          ) : (
            <>
              <Link to="/login" className="inline-flex min-h-11 items-center px-2 text-muted">
                Ingresar
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-xs font-bold text-bg"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <SectionLabel>Guía rápida</SectionLabel>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
              Cómo funciona Duo LAS.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Una forma simple de encontrar duo o completar tu grupo en LAS. Sin vueltas, gratis y
              solo para mayores de 18.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-muted">
              <span className="rounded-full border border-border px-3 py-1.5">Solo LAS</span>
              <span className="rounded-full border border-border px-3 py-1.5">+18</span>
              <span className="rounded-full border border-border px-3 py-1.5">100% gratis</span>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-accent">
                Beta abierta
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Swords className="mt-0.5 shrink-0 text-gold" size={22} aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold text-gold">¿Flex funciona?</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Sí. Podés elegir <strong className="text-text">Flex</strong> en Match y en
                Disponible ya. En Busco 1 elegís la cola al publicar. En Match y Disponible, Flex
                amplía la tolerancia a dos tiers de diferencia; en Busco 1 el rango lo define el
                post.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel>Tres formas de buscar</SectionLabel>
          <h2 className="mt-2 text-3xl font-extrabold">Elegí la que te sirva.</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {searchModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <article
                  key={mode.title}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{mode.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{mode.description}</p>
                  <ul className="mt-4 space-y-2">
                    {mode.points.map((point) => (
                      <CheckItem key={point}>{point}</CheckItem>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent">
                <Radio size={22} aria-hidden="true" />
              </div>
              <div>
                <SectionLabel>Paso a paso</SectionLabel>
                <h2 className="text-xl font-bold">Disponible ya</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Es la opción para cuando querés jugar ya y no querés esperar a que alguien vea tu
              perfil.
            </p>
            <ol className="mt-5 space-y-4">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-extrabold text-accent">
                  1
                </span>
                <p className="text-sm leading-relaxed text-muted">
                  Entrá a <strong className="text-text">Disponible</strong> y elegí cola, roles y
                  duración de 30 o 60 minutos.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-extrabold text-accent">
                  2
                </span>
                <p className="text-sm leading-relaxed text-muted">
                  Te mostramos jugadores disponibles y compatibles. Podés invitar a uno.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-extrabold text-accent">
                  3
                </span>
                <p className="text-sm leading-relaxed text-muted">
                  La otra persona responde desde <strong className="text-text">Invitaciones</strong>
                  . Si acepta, se crea la conexión y se revela el contacto.
                </p>
              </li>
            </ol>
          </article>

          <article className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent">
                <ClipboardList size={22} aria-hidden="true" />
              </div>
              <div>
                <SectionLabel>Paso a paso</SectionLabel>
                <h2 className="text-xl font-bold">Busco 1</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Es la opción para grupos que tienen un lugar libre. Muy útil para Flex o para
              completar un equipo.
            </p>
            <ol className="mt-5 space-y-4">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-extrabold text-accent">
                  1
                </span>
                <p className="text-sm leading-relaxed text-muted">
                  Entrá a <strong className="text-text">Busco 1</strong> y publicá cola, rango,
                  roles que necesitan y un mensaje breve.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-extrabold text-accent">
                  2
                </span>
                <p className="text-sm leading-relaxed text-muted">
                  Los jugadores compatibles se postulan. Podés ver sus perfiles y elegir.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-extrabold text-accent">
                  3
                </span>
                <p className="text-sm leading-relaxed text-muted">
                  Al aceptar una postulación se crea la conexión y se comparte el contacto.
                </p>
              </li>
            </ol>
          </article>
        </section>

        <section className="mt-12">
          <SectionLabel>El recorrido completo</SectionLabel>
          <h2 className="mt-2 text-3xl font-extrabold">Cuatro pasos, sin misterio.</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <p className="text-xs font-extrabold tracking-[0.2em] text-accent">{step.number}</p>
                <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent">
                  <Bell size={22} aria-hidden="true" />
                </div>
                <div>
                  <SectionLabel>Notificaciones</SectionLabel>
                  <h2 className="text-xl font-bold">Enterate sin estar mirando la página.</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                La campana muestra todo lo que pasa: invitaciones, postulaciones, matches, feedback
                y avisos de moderación. Si activás los avisos, también te llegan al celular.
              </p>
              <ul className="mt-4 space-y-2">
                <CheckItem>Te avisamos cuando te invitan o te postulan.</CheckItem>
                <CheckItem>También cuando se concreta un match.</CheckItem>
                <CheckItem>Si no activás push, igual queda todo en la campana.</CheckItem>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-bg p-5">
              <div className="flex items-center gap-2">
                <Smartphone className="text-accent" size={19} aria-hidden="true" />
                <h3 className="font-bold">Cómo activar los avisos al celular</h3>
              </div>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-extrabold text-accent">
                    1
                  </span>
                  Entrá a <strong className="text-text">Notificaciones</strong> con tu cuenta.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-extrabold text-accent">
                    2
                  </span>
                  Tocá <strong className="text-text">Activar push</strong> y aceptá el permiso del
                  navegador.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-extrabold text-accent">
                    3
                  </span>
                  En iPhone, primero agregá Duo LAS a la pantalla de inicio y abrila desde ahí.
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-accent" size={20} aria-hidden="true" />
                <SectionLabel>Privacidad y confianza</SectionLabel>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold">Tu contacto, solo cuando hay match.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                El Riot ID y el Discord se revelan únicamente después de una conexión. También podés
                reportar, bloquear y dejar feedback después de jugar. La reputación ayuda a que la
                comunidad se cuide.
              </p>
            </div>
            <Users
              className="hidden shrink-0 text-accent/70 sm:block"
              size={54}
              aria-hidden="true"
            />
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-accent/40 bg-accent/10 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">¿Probamos?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Duo LAS está en beta y es gratis. Completá tu perfil y empezá a buscar.
              </p>
            </div>
            <Link
              to={user ? home : '/register'}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg"
            >
              {user ? 'Ir a la app' : 'Crear cuenta'}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6">
        <div className="mx-auto max-w-5xl space-y-3 text-xs text-muted">
          <div className="flex flex-wrap items-center gap-x-4">
            <Link to="/terminos" className="inline-flex min-h-11 items-center hover:text-text">
              Términos
            </Link>
            <Link to="/privacidad" className="inline-flex min-h-11 items-center hover:text-text">
              Privacidad
            </Link>
            <Link to="/aviso-riot" className="inline-flex min-h-11 items-center hover:text-text">
              Aviso de Riot
            </Link>
          </div>
          <RiotDisclaimer />
          <p>Duo LAS está en beta: pueden haber cambios y errores mientras lo probamos.</p>
        </div>
      </footer>
    </div>
  );
}
