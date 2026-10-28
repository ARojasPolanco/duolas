import { Link, useLocation } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));

export default function AccountDeletedPage() {
  const location = useLocation();
  const scheduledFor = location.state?.scheduledFor;

  return (
    <AuthShell
      title="Cuenta programada para eliminación"
      subtitle="Tu perfil y tus datos de contacto ya no están visibles."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <Trash2 className="shrink-0 text-danger" size={22} aria-hidden="true" />
          <p>
            Tu cuenta se eliminará permanentemente el{' '}
            <strong className="text-text">
              {scheduledFor ? formatDate(scheduledFor) : 'los próximos 30 días'}
            </strong>
            .
          </p>
        </div>

        <p>
          Si cambiás de opinión, iniciá sesión con tu email y contraseña antes de esa fecha. La
          eliminación se cancela automáticamente y vas a recuperar tu cuenta.
        </p>

        <p className="rounded-xl border border-border bg-bg px-4 py-3 text-xs">
          Después del plazo no se puede recuperar. Algunos registros de moderación, feedback y
          métricas pueden conservarse anonimizados por seguridad.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/login"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-bg"
          >
            Iniciar sesión para recuperarla
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-muted"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
