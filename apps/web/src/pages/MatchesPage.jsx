import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Ban, Copy, Flag, MessageCircle, MessageSquare, Swords } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import CountryBadge from '../components/CountryBadge.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import RankIcon from '../components/RankIcon.jsx';
import UsernameHint from '../components/UsernameHint.jsx';
import ReportDialog from '../components/ReportDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import { whatsappUrl } from '../utils/contact.js';
import { formatRank, formatRoles, initialsOf } from '../utils/labels.js';

export default function MatchesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [feedbackOpenId, setFeedbackOpenId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const canInteract = Boolean(user?.emailVerified && user?.profileCompleted);

  const load = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.get('/v1/matching/matches');
      setMatches(res.data.matches || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar tus matches.');
    } finally {
      setLoading(false);
    }
  }, [canInteract]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (value, label) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch (_error) {
      toast.error('No pudimos copiar. Copialo manualmente.');
    }
  };

  const archive = async (match) => {
    setActionId(match.id);
    try {
      await api.post(`/v1/matching/matches/${match.id}/archive`);
      setMatches((current) => current.filter((item) => item.id !== match.id));
      toast.success('Match archivado.');
      setConfirmAction(null);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos archivar el match.');
    } finally {
      setActionId(null);
    }
  };

  const block = async (match) => {
    setActionId(match.id);
    try {
      await api.post('/v1/blocks', { userId: match.other.id });
      setMatches((current) => current.filter((item) => item.id !== match.id));
      toast.success('Usuario bloqueado.');
      setConfirmAction(null);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos bloquear al usuario.');
    } finally {
      setActionId(null);
    }
  };

  const askArchive = (match) => {
    setConfirmAction({ type: 'archive', match });
  };

  const askBlock = (match) => {
    setConfirmAction({ type: 'block', match });
  };

  const handleReported = () => {
    if (reportTarget) {
      setMatches((current) => current.filter((item) => item.other.id !== reportTarget.id));
    }
    setReportTarget(null);
  };

  return (
    <AppShell maxWidth="max-w-4xl">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Matches</p>
          <h1 className="mt-2 text-3xl font-extrabold">Tus conexiones</h1>
          <p className="mt-2 text-sm text-muted">
            El contacto se revela solo cuando ambos se interesan.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : null}

        {!loading && matches.length === 0 ? (
          <section className="rounded-2xl border border-border bg-surface p-8 text-center">
            <Swords className="mx-auto text-accent" size={32} aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold">Todavía no tenés matches</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Cuando haya interés mutuo, el contacto aparece acá.
            </p>
            <Link
              to="/match"
              className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg"
            >
              Buscar duo
            </Link>
          </section>
        ) : null}

        <div className="space-y-4">
          {matches.map((match) => {
            const busy = actionId === match.id;

            return (
              <article key={match.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
                      {initialsOf(match.other.username)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-bold">@{match.other.username}</h2>
                        {match.source === 'aram' ? (
                          <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                            ARAM
                          </span>
                        ) : null}
                      </div>
                      <UsernameHint className="mt-0.5" />
                      <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                        <RankIcon tier={match.other.rankTier} size={16} />
                        <span className="truncate">
                          {formatRank(match.other)} · {formatRoles(match.other)}
                        </span>
                      </p>
                      {match.other.country ? (
                        <p className="mt-0.5 text-[10px] text-muted">
                          <CountryBadge country={match.other.country} />
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted">
                    {match.other.reputation.label}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => copy(match.contact.riotId, 'Riot ID')}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-left"
                  >
                    <span>
                      <span className="block text-[11px] text-muted">Riot ID</span>
                      <span className="text-sm font-semibold">{match.contact.riotId}</span>
                    </span>
                    <Copy size={15} className="text-accent" aria-hidden="true" />
                  </button>

                  {match.contact.discordTag ? (
                    <button
                      type="button"
                      onClick={() => copy(match.contact.discordTag, 'Discord')}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-[11px] text-muted">Discord</span>
                        <span className="text-sm font-semibold">{match.contact.discordTag}</span>
                      </span>
                      <Copy size={15} className="text-accent" aria-hidden="true" />
                    </button>
                  ) : null}

                  {match.contact.whatsapp ? (
                    <a
                      href={whatsappUrl(match.contact.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-[11px] text-muted">WhatsApp</span>
                        <span className="text-sm font-semibold">{match.contact.whatsapp}</span>
                      </span>
                      <MessageCircle size={15} className="text-accent" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted">
                    Match creado el{' '}
                    {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
                      new Date(match.createdAt)
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFeedbackOpenId((current) => (current === match.id ? null : match.id))
                      }
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-accent"
                    >
                      <MessageSquare size={14} aria-hidden="true" />
                      {match.feedback?.mine === 'submitted' ? 'Ver feedback' : 'Dejar feedback'}
                    </button>
                    <button
                      type="button"
                      onClick={() => askArchive(match)}
                      disabled={busy}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted disabled:opacity-60"
                    >
                      <Archive size={14} aria-hidden="true" />
                      Archivar
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportTarget(match.other)}
                      disabled={busy}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-danger disabled:opacity-60"
                    >
                      <Flag size={14} aria-hidden="true" />
                      Reportar
                    </button>
                    <button
                      type="button"
                      onClick={() => askBlock(match)}
                      disabled={busy}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-danger disabled:opacity-60"
                    >
                      <Ban size={14} aria-hidden="true" />
                      Bloquear
                    </button>
                  </div>
                </div>

                {feedbackOpenId === match.id ? (
                  <FeedbackPanel
                    match={match}
                    onClose={() => setFeedbackOpenId(null)}
                    onSubmitted={() =>
                      setMatches((current) =>
                        current.map((item) =>
                          item.id === match.id
                            ? { ...item, feedback: { ...item.feedback, mine: 'submitted' } }
                            : item
                        )
                      )
                    }
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      {reportTarget ? (
        <ReportDialog
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onReported={handleReported}
        />
      ) : null}

      {confirmAction ? (
        <ConfirmDialog
          title={
            confirmAction.type === 'archive'
              ? `Archivar match con ${confirmAction.match.other.username}`
              : `Bloquear a ${confirmAction.match.other.username}`
          }
          description={
            confirmAction.type === 'archive'
              ? 'El match desaparecerá de tu lista. El contacto dejará de estar visible.'
              : 'No volverá a aparecer en tus matches ni en tus búsquedas.'
          }
          confirmLabel={confirmAction.type === 'archive' ? 'Archivar' : 'Bloquear'}
          tone={confirmAction.type === 'archive' ? 'accent' : 'danger'}
          busy={actionId === confirmAction.match.id}
          onConfirm={() =>
            confirmAction.type === 'archive'
              ? archive(confirmAction.match)
              : block(confirmAction.match)
          }
          onClose={() => setConfirmAction(null)}
        />
      ) : null}
    </AppShell>
  );
}
