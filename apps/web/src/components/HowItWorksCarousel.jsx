import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: 'Tu perfil, tu match',
    description:
      'Completá Riot ID, rango, roles y horarios. El motor cruza compatibilidad real, no solo el elo.',
    image: '/illustrations/match.svg',
    alt: 'Dos jugadores compatibles conectados',
    points: ['Rango y roles compatibles', 'Horarios, estilo e idioma en común'],
    accent: 'text-accent',
  },
  {
    title: 'Disponible ya',
    description:
      'Activá tu disponibilidad por 30 o 60 minutos y recibí invitaciones mientras buscás jugar.',
    image: '/illustrations/available.svg',
    alt: 'Radar de jugadores disponibles',
    points: ['Invitaciones al toque', 'Avisos aunque tengas la app cerrada'],
    accent: 'text-accent-strong',
  },
  {
    title: 'Busco 1',
    description:
      'Tu grupo tiene un lugar libre. Publicá el rol, el rango y la cola; los jugadores compatibles se postulan.',
    image: '/illustrations/busco-one.svg',
    alt: 'Grupo de jugadores con un lugar libre',
    points: ['Publicás el lugar libre', 'Aceptás la postulación que encaja'],
    accent: 'text-gold',
  },
  {
    title: 'Confianza real',
    description:
      'Feedback posterior a la partida, reputación visible, reportes y bloqueos para cuidar la comunidad.',
    image: '/illustrations/trust.svg',
    alt: 'Reputación y seguridad',
    points: ['Feedback doble ciego', 'Reportar bloquea al instante'],
    accent: 'text-success',
  },
];

export default function HowItWorksCarousel({ compact = false }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const slide = slides[index];

  useEffect(() => {
    if (paused || reduceMotion) return undefined;

    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [paused, reduceMotion]);

  const goTo = (nextIndex) => {
    setIndex((nextIndex + slides.length) % slides.length);
  };

  return (
    <section
      className="overflow-hidden rounded-3xl border border-border bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carrusel"
      aria-label="Cómo funciona Duo LAS"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative min-h-[220px] overflow-hidden bg-surface-2 md:min-h-[320px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={slide.image}
              src={slide.image}
              alt={slide.alt}
              className="absolute inset-0 h-full w-full object-cover"
              initial={reduceMotion ? false : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
            />
          </AnimatePresence>
        </div>

        <div className={`flex flex-col justify-between ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              Cómo funciona
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.title}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.3 }}
              >
                <h2
                  className={`mt-2 font-extrabold ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} ${slide.accent}`}
                >
                  {slide.title}
                </h2>
                <p
                  className={`mt-3 leading-relaxed text-muted ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}
                >
                  {slide.description}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {slide.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
              {slides.map((item, itemIndex) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => goTo(itemIndex)}
                  aria-label={`Ir a ${item.title}`}
                  aria-selected={itemIndex === index}
                  role="tab"
                  className={`h-1.5 rounded-full transition-all ${
                    itemIndex === index ? 'w-7 bg-accent' : 'w-3 bg-border hover:bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                className="rounded-full border border-border p-2 text-muted transition hover:border-accent hover:text-text"
                aria-label="Slide anterior"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="rounded-full border border-border p-2 text-muted transition hover:border-accent hover:text-text"
                aria-label="Slide siguiente"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
