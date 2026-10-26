import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, RefreshCw, ShieldAlert, UserX } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from '../utils/labels.js';

const reasonOptions = Object.keys(REPORT_REASON_LABELS);
const statusOptions = Object.keys(REPORT_STATUS_LABELS);

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));

const statusStyles = {
  open: 'border-gold/40 bg-gold/10 text-gold',
  reviewing: 'border-accent/40 bg-accent/10 text-accent',
  resolved: 'border-success/40 bg-success/10 text-success',
  dismissed: 'border-border bg-surface-2 text-muted',
};

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('open');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('');
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (status) params.status = status;
      if (reason) params.reason = reason;
      if (priority) params.priority = priority;
      const res = await api.get('/v1/admin/reports', { params });
      setReports(res.data.reports || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar los reportes.');
    } finally {
      setLoading(false);
    }
  }, [status, reason, priority]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (report, resolution) => {
    setBusyId(report.id);

    try {
      await api.post(`/v1/admin/reports/${report.id}/resolve`, {
        resolution,
        note: (notes[report.id] || '').trim() || null,
      });
      toast.success('Reporte resuelto.');
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos resolver el reporte.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
          <h1 className="mt-2 text-3xl font-extrabold">Reportes y sanciones</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Revisá los reportes abiertos y aplicá una acción. Toda sanción queda registrada.
          </p>
        </div>

        <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-4">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text"
          >
            <option value="">Todos los estados</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {REPORT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text"
          >
            <option value="">Todos los motivos</option>
            {reasonOptions.map((value) => (
              <option key={value} value={value}>
                {REPORT_REASON_LABELS[value]}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text"
          >
            <option value="">Todas las prioridades</option>
            <option value="true">Prioritarios</option>
            <option value="false">No prioritarios</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-border p-2 text-muted"
            aria-label="Recargar reportes"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </section>

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : reports.length ? (
          <div className="space-y-3">
            {reports.map((report) => {
              const busy = busyId === report.id;
              const open = ['open', 'reviewing'].includes(report.status);

              return (
                <article
                  key={report.id}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold">
                          {report.reporter?.username} reportó a {report.reported?.username}
                        </h2>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            statusStyles[report.status] || statusStyles.open
                          }`}
                        >
                          {REPORT_STATUS_LABELS[report.status] || report.status}
                        </span>
                        {report.priority ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-[10px] font-semibold text-danger">
                            <AlertTriangle size={11} aria-hidden="true" />
                            Prioritario
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {REPORT_REASON_LABELS[report.reason] || report.reason} ·{' '}
                        {formatDateTime(report.createdAt)}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-muted">
                      <p>Reportado: {report.reported?.status}</p>
                      <p>Advertencias: {report.reported?.warningCount ?? 0}</p>
                    </div>
                  </div>

                  {report.details ? (
                    <p className="mt-3 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-muted">
                      {report.details}
                    </p>
                  ) : null}

                  {report.admin ? (
                    <p className="mt-3 text-[11px] text-muted">
                      Resuelto por {report.admin.username}
                      {report.adminNote ? `: ${report.adminNote}` : ''}
                    </p>
                  ) : null}

                  {open ? (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={notes[report.id] || ''}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [report.id]: event.target.value,
                          }))
                        }
                        maxLength={500}
                        rows={2}
                        placeholder="Nota interna / motivo de la sanción (opcional)"
                        className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 text-xs text-text placeholder:text-muted/60"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => resolve(report, 'dismissed')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-muted disabled:opacity-60"
                        >
                          <Check size={13} aria-hidden="true" />
                          Descartar
                        </button>
                        <button
                          type="button"
                          onClick={() => resolve(report, 'warned')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-[11px] font-semibold text-gold disabled:opacity-60"
                        >
                          <ShieldAlert size={13} aria-hidden="true" />
                          Advertir
                        </button>
                        <button
                          type="button"
                          onClick={() => resolve(report, 'suspended_7d')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[11px] font-semibold text-danger disabled:opacity-60"
                        >
                          <UserX size={13} aria-hidden="true" />
                          Suspender 7 días
                        </button>
                        <button
                          type="button"
                          onClick={() => resolve(report, 'suspended_30d')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[11px] font-semibold text-danger disabled:opacity-60"
                        >
                          <UserX size={13} aria-hidden="true" />
                          Suspender 30 días
                        </button>
                        <button
                          type="button"
                          onClick={() => resolve(report, 'suspended_permanent')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-2 text-[11px] font-bold text-bg disabled:opacity-60"
                        >
                          <UserX size={13} aria-hidden="true" />
                          Suspensión permanente
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <ShieldAlert className="mx-auto text-accent" size={30} aria-hidden="true" />
            <h2 className="mt-3 font-bold">No hay reportes con esos filtros</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Los reportes nuevos aparecen acá para revisión.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
