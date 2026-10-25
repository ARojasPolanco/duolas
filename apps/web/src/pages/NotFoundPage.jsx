import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-5xl font-extrabold text-accent">404</p>
        <h1 className="mt-3 text-2xl font-bold">No encontramos esta página</h1>
        <p className="mt-3 text-sm text-muted">Puede que el link esté mal o que ya no exista.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 text-sm font-bold text-bg"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
