import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, ShieldCheck, Swords, Users } from 'lucide-react';
import BetaBadge from '../components/BetaBadge.jsx';
import HowItWorksCarousel from '../components/HowItWorksCarousel.jsx';
import PlayerPreviewCard from '../components/PlayerPreviewCard.jsx';
import RiotDisclaimer from '../components/RiotDisclaimer.jsx';

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

const mockPlayers = [
  {
    profile: {
      id: 'demo-card-mid',
      username: 'MidOrDodge',
      country: 'AR',
      rankTier: 'diamond',
      rankDivision: 'ii',
      primaryRole: 'mid',
      secondaryRole: 'jungle',
      playStyle: 'ranked',
      languages: ['es', 'en'],
      hasMic: true,
      reputation: { label: '92%' },
      bio: 'Mid main. Busco duo para ranked con horarios de noche.',
    },
    score: 94,
    reasons: ['Coinciden 5 horarios', 'Mismo estilo', 'Roles complementarios'],
  },
  {
    profile: {
      id: 'demo-card-jungle',
      username: 'JungleTrack',
      country: 'CL',
      rankTier: 'diamond',
      rankDivision: 'iii',
      primaryRole: 'jungle',
      secondaryRole: 'top',
      playStyle: 'ranked',
      languages: ['es'],
      hasMic: true,
      reputation: { label: '88%' },
      bio: 'Jungla main, prefiero comunicar por voz.',
    },
    score: 91,
    reasons: ['Mismo rango', 'Roles complementarios', 'Ambos con micrófono'],
  },
  {
    profile: {
      id: 'demo-card-support',
      username: 'SupportCarry',
      country: 'UY',
      rankTier: 'platinum',
      rankDivision: 'i',
      primaryRole: 'support',
      secondaryRole: 'adc',
      playStyle: 'casual',
      languages: ['es', 'pt'],
      hasMic: true,
      reputation: { label: 'Nuevo' },
      bio: 'Support main, juego para mejorar sin toxicidad.',
    },
    score: 86,
    reasons: ['Horarios compatibles', 'Roles complementarios', 'Comparten idioma'],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          Duo<span className="text-accent">LAS</span>
          <BetaBadge />
        </span>
        <div className="flex items-center gap-1.5 text-sm font-semibold sm:gap-3">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center text-xs text-muted sm:text-sm"
          >
            <span className="sm:hidden">Ingresar</span>
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-[11px] font-bold text-bg sm:px-4 sm:text-xs"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent"
            >
              League of Legends · LAS
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl font-extrabold leading-tight sm:text-6xl"
            >
              Encontrá tu duo en LAS y subí de elo.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
            >
              Perfiles compatibles, disponibilidad inmediata y reputación. Gratis, mobile-first y
              solo para mayores de 18 años.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-3 text-xs font-semibold text-accent"
            >
              Beta abierta: el servicio puede cambiar mientras lo probamos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/register"
                className="rounded-xl bg-accent px-6 py-3.5 text-center text-sm font-bold text-bg transition hover:bg-accent-strong"
              >
                Crear cuenta
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-border bg-bg px-6 py-3.5 text-center text-sm font-bold text-text transition hover:border-accent"
              >
                Ya tengo cuenta
              </Link>
            </motion.div>

            <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-muted">
              <span className="rounded-full border border-border px-3 py-1">Solo LAS</span>
              <span className="rounded-full border border-border px-3 py-1">+18</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                <ShieldCheck size={13} className="text-accent" aria-hidden="true" />
                Contacto solo con match
              </span>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Cómo funciona
              </p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Todo el flujo, en cuatro pasos.
              </h2>
            </div>
            <Link
              to="/como-funciona"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
            >
              Ver guía completa
            </Link>
          </div>
          <HowItWorksCarousel />
        </section>

        <section className="mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Vista previa
              </p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Así se ve tu próximo duo.
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Estos son ejemplos visuales. El Riot ID y los contactos opcionales de otra persona
                se revelan recién cuando hay match mutuo.
              </p>
            </div>
            <Link
              to="/register"
              className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg"
            >
              Quiero mi match
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {mockPlayers.map((player) => (
              <PlayerPreviewCard
                key={player.profile.id}
                player={player.profile}
                score={player.score}
                reasons={player.reasons}
                showActions={false}
                compact
              />
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
              </motion.article>
            );
          })}
        </section>

        <section className="mt-14 rounded-3xl border border-border bg-surface p-6 sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">
                Tu próximo duo está a un perfil de distancia.
              </h2>
              <p className="mt-2 text-sm text-muted">
                Completá tu perfil, verificá tu email y empezá a ver jugadores compatibles.
              </p>
            </div>
            <Link
              to="/register"
              className="shrink-0 rounded-xl bg-accent px-6 py-3.5 text-center text-sm font-bold text-bg"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6">
        <div className="mx-auto max-w-6xl space-y-3 text-xs text-muted">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Duo LAS</span>
            <div className="flex flex-wrap items-center gap-x-4">
              <Link to="/como-funciona" className="inline-flex min-h-11 items-center">
                Cómo funciona
              </Link>
              <Link to="/terminos" className="inline-flex min-h-11 items-center">
                Términos
              </Link>
              <Link to="/privacidad" className="inline-flex min-h-11 items-center">
                Privacidad
              </Link>
              <Link to="/aviso-riot" className="inline-flex min-h-11 items-center">
                Aviso de Riot
              </Link>
            </div>
          </div>
          <RiotDisclaimer className="border-t border-border pt-3" />
        </div>
      </footer>
    </div>
  );
}
