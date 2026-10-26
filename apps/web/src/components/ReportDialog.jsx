import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { REPORT_REASON_LABELS } from '../utils/labels.js';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';

const reasons = Object.keys(REPORT_REASON_LABELS);

export default function ReportDialog({ target, onClose, onReported }) {
  const { toast } = useToast();
  const [reason, setReason] = useState('toxicity');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (reason === 'other' && !details.trim()) {
      toast.error('Contá brevemente qué pasó.');
      return;
    }

    setBusy(true);

    try {
      await api.post('/v1/reports', {
        reportedUserId: target.id,
        reason,
        details: details.trim() || null,
      });
      toast.success(`${target.username} fue reportado y bloqueado.`);
      onReported?.();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos enviar el reporte.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reportar a ${target.username}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-danger" size={20} aria-hidden="true" />
            <div>
              <h2 className="font-bold">Reportar a {target.username}</h2>
              <p className="text-xs text-muted">El reporte bloquea al usuario automáticamente.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted"
            aria-label="Cerrar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <label className="mt-5 block text-xs font-semibold text-muted">
          Motivo
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
          >
            {reasons.map((value) => (
              <option key={value} value={value}>
                {REPORT_REASON_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-xs font-semibold text-muted">
          Detalle {reason === 'other' ? '(obligatorio)' : '(opcional)'}
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Contá brevemente qué pasó."
            className="mt-2 w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-muted/60"
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-bold text-bg disabled:opacity-60"
          >
            {busy ? 'Enviando...' : 'Reportar y bloquear'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
