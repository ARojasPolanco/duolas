import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Clock3, Gamepad2, RefreshCw, Users } from 'lucide-react';
import AdminShell from '../components/AdminShell.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';

const ART_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const dateInputFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ART_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const numberFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const hoursFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

const dateInputValue = (date) => dateInputFormatter.format(date);

const defaultRange = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: dateInputValue(from), to: dateInputValue(to) };
};

const rangeBoundary = (value, endOfDay) =>
  new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}-03:00`).toISOString();

const formatNumber = (value) => numberFormatter.format(Number(value));

const formatHours = (value) => `${hoursFormatter.format(Number(value))} h`;

const percent = (value) =>
  value === null || value === undefined ? 'Sin datos' : `${Math.round(value * 100)}%`;

export default function AdminMetricsPage() {
  const { toast } = useToast();
  const [range, setRange] = useState(defaultRange);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const from = rangeBoundary(range.from, false);
      const to = rangeBoundary(range.to, true);
      const res = await api.get('/v1/admin/metrics/summary', { params: { from, to } });
      setMetrics(res.data.metrics);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar las métricas.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = metrics
    ? [
        {
          title: 'Tiempo al primer duo',
          value:
            metrics.timeToFirstDuo.medianHours === null
              ? 'Sin datos'
              : formatHours(metrics.timeToFirstDuo.medianHours),
          detail:
            metrics.timeToFirstDuo.players === 0
              ? 'Sin primeras conexiones en el rango'
              : `${formatNumber(metrics.timeToFirstDuo.players)} jugadores`,
          icon: Clock3,
        },
        {
          title: 'Match que termina en partida',
          value:
            metrics.matchToGame.eligible === 0 ? 'Sin datos' : percent(metrics.matchToGame.rate),
          detail:
            metrics.matchToGame.eligible === 0
              ? 'Sin conexiones elegibles todavía'
              : `${formatNumber(metrics.matchToGame.played)} de ${formatNumber(metrics.matchToGame.eligible)} conexiones`,
          icon: Gamepad2,
        },
        {
          title: 'Retención a 7 días',
          value:
            metrics.retention7d.cohortSize === 0 ? 'Sin datos' : percent(metrics.retention7d.rate),
          detail:
            metrics.retention7d.cohortSize === 0
              ? 'La cohorte todavía no completó 14 días'
              : `${formatNumber(metrics.retention7d.retained)} de ${formatNumber(metrics.retention7d.cohortSize)} jugadores`,
          icon: Users,
        },
        {
          title: 'Simultáneos en Disponible',
          value: formatNumber(metrics.concurrentAvailability.peak),
          detail:
            metrics.concurrentAvailability.peak === 0
              ? 'Sin disponibilidades en el rango'
              : `p95: ${formatNumber(metrics.concurrentAvailability.p95)}`,
          icon: BarChart3,
        },
      ]
    : [];

  return (
    <AdminShell maxWidth="max-w-5xl">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
          <h1 className="mt-2 text-3xl font-extrabold">Métricas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Resumen de los cuatro KPIs del MVP calculado desde la base de datos.
          </p>
        </div>

        <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex sm:flex-wrap sm:items-end">
          <label className="text-xs font-semibold text-muted">
            Desde
            <input
              type="date"
              value={range.from}
              onChange={(event) =>
                setRange((current) => ({ ...current, from: event.target.value }))
              }
              className="mt-2 block w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text sm:w-auto"
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            Hasta
            <input
              type="date"
              value={range.to}
              onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))}
              className="mt-2 block w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text sm:w-auto"
            />
          </label>
          <button
            type="button"
            onClick={load}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg sm:col-auto"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Actualizar
          </button>
        </section>

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-muted">{card.title}</p>
                    <Icon className="text-accent" size={18} aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-3xl font-extrabold">{card.value}</p>
                  <p className="mt-1 text-xs text-muted">{card.detail}</p>
                </article>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setRange(defaultRange());
            toast.success('Rango restablecido a los últimos 30 días.');
          }}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Restablecer últimos 30 días
        </button>
      </div>
    </AdminShell>
  );
}
