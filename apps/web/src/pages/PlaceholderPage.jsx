import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Duo LAS</p>
        <h1 className="mt-3 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg border border-border px-5 py-3 text-sm font-semibold"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
