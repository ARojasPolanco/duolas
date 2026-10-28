import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Trash2, X } from 'lucide-react';
import PasswordField from './PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../config/api.js';

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));

export default function DeleteAccountDialog({ onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('warning');
  const [password, setPassword] = useState('');
  const [scheduledFor, setScheduledFor] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!password) {
      setError('Ingresá tu contraseña para confirmar.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await api.delete('/v1/auth/account', { data: { password } });
      setScheduledFor(res.data.deletionScheduledFor);
      setStep('done');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos programar la eliminación.');
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    logout();
    navigate('/cuenta-eliminada', {
      replace: true,
      state: { scheduledFor },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Eliminar cuenta"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {step === 'done' ? (
              <CheckCircle2 className="text-success" size={20} aria-hidden="true" />
            ) : step === 'confirm' ? (
              <AlertTriangle className="text-danger" size={20} aria-hidden="true" />
            ) : (
              <Trash2 className="text-danger" size={20} aria-hidden="true" />
            )}
            <div>
              <h2 className="font-bold">
                {step === 'done'
                  ? 'Cuenta programada'
                  : step === 'confirm'
                    ? 'Última confirmación'
                    : 'Eliminar cuenta'}
              </h2>
              <p className="text-xs text-muted">
                {step === 'done'
                  ? 'Tu sesión se cerró correctamente.'
                  : 'Esta acción desactiva tu cuenta y oculta tu perfil.'}
              </p>
            </div>
          </div>
          {step !== 'done' ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border p-1.5 text-muted"
              aria-label="Cerrar"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {step === 'warning' ? (
          <>
            <div className="mt-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-muted">
              <p className="font-semibold text-danger">Antes de continuar, tené en cuenta:</p>
              <ul className="mt-2 space-y-1.5">
                <li>• Tu perfil, disponibilidad y publicaciones se desactivan.</li>
                <li>
                  • Podés recuperar la cuenta iniciando sesión con tu contraseña dentro de los
                  próximos <strong className="text-text">30 días</strong>.
                </li>
                <li>
                  • Pasado ese plazo, la cuenta y tus datos personales se eliminan de forma
                  permanente.
                </li>
                <li>
                  • Reportes, feedback y sanciones pueden conservarse anonimizados por moderación.
                </li>
              </ul>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-bold text-bg"
              >
                Continuar
              </button>
            </div>
          </>
        ) : null}

        {step === 'confirm' ? (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              Para confirmar, ingresá tu contraseña. Vamos a cerrar tu sesión y la cuenta quedará
              programada para eliminarse. Podés recuperarla iniciando sesión antes de 30 días.
            </p>

            <PasswordField
              label="Contraseña actual"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />

            {error ? (
              <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2.5 text-xs text-danger">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('warning');
                }}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-bold text-bg disabled:opacity-60"
              >
                {busy ? 'Eliminando...' : 'Eliminar mi cuenta'}
              </button>
            </div>
          </form>
        ) : null}

        {step === 'done' ? (
          <>
            <div className="mt-5 rounded-xl border border-success/30 bg-success/5 p-4 text-sm leading-relaxed text-muted">
              <p>
                Tu cuenta quedó programada para eliminarse el{' '}
                <strong className="text-text">
                  {scheduledFor ? formatDate(scheduledFor) : 'los próximos 30 días'}
                </strong>
                .
              </p>
              <p className="mt-2">
                Podés recuperarla iniciando sesión durante ese plazo. Después se eliminará de forma
                permanente y no vas a poder recuperarla.
              </p>
            </div>

            <button
              type="button"
              onClick={finish}
              className="mt-4 w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-bg"
            >
              Entendido, cerrar sesión
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
