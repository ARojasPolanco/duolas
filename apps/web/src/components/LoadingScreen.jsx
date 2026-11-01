import { useEffect, useState } from 'react';
import { Swords, Users } from 'lucide-react';
import BetaBadge from './BetaBadge.jsx';

const PHRASES = [
  'Buscando duos compatibles...',
  'Revisando rangos y roles...',
  'Acomodando horarios...',
  'Calentando la Grieta...',
  'Preparando tu próximo match...',
];

export default function LoadingScreen() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((current) => (current + 1) % PHRASES.length);
    }, 1900);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-10 text-text"
    >
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-border/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center shadow-2xl shadow-black/30">
        <div className="flex items-center justify-center gap-2 text-2xl font-extrabold tracking-tight">
          Duo<span className="text-accent">LAS</span>
          <BetaBadge />
        </div>

        <div className="relative mx-auto mt-9 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full border border-accent/25" />
          <span className="absolute inset-2 rounded-full border border-accent/20" />
          <span className="absolute inset-4 rounded-full border border-border/80" />
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-bg shadow-lg shadow-accent/20">
            <Swords size={24} aria-hidden="true" />
          </span>
        </div>

        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.28em] text-accent">
          Preparando la Grieta
        </p>
        <p className="mt-2 min-h-8 text-xl font-extrabold">{PHRASES[phraseIndex]}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Estamos despertando la base de datos y cargando tu sesión.
        </p>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-muted">
          <Users size={14} className="text-accent" aria-hidden="true" />
          La primera carga puede tardar unos segundos.
        </div>
      </div>
    </div>
  );
}
