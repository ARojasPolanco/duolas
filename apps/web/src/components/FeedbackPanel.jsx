import { useCallback, useEffect, useState } from 'react';
import { Check, MessageSquare, Send, X } from 'lucide-react';
import { FEEDBACK_TAG_LABELS } from '../utils/labels.js';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';

const POSITIVE_TAGS = ['good_vibes', 'communicative', 'tryhard', 'punctual', 'good_game'];
const NEGATIVE_TAGS = ['toxicity', 'abandonment', 'fake_rank', 'no_communication', 'other'];

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));

export default function FeedbackPanel({ match, onClose, onSubmitted }) {
  const { toast } = useToast();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sentiment, setSentiment] = useState('positive');
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/v1/feedback/connection/${match.id}`);
      setDetail(res.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar el feedback.');
    } finally {
      setLoading(false);
    }
  }, [match.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTag = (tag) => {
    setTags((current) => {
      if (current.includes(tag)) return current.filter((item) => item !== tag);
      if (current.length >= 3) return current;
      return [...current, tag];
    });
  };

  const changeSentiment = (value) => {
    setSentiment(value);
    setTags([]);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (sentiment === 'negative' && !tags.length) {
      toast.error('Elegí al menos un motivo.');
      return;
    }

    setBusy(true);

    try {
      const res = await api.post('/v1/feedback', {
        connectionId: match.id,
        sentiment,
        tags,
        comment: comment.trim() || null,
      });
      toast.success(
        res.data.revealed
          ? 'Feedback enviado y revelado.'
          : 'Feedback enviado. Se revela cuando ambos respondan.'
      );
      await load();
      onSubmitted?.();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos enviar el feedback.');
    } finally {
      setBusy(false);
    }
  };

  const tagOptions = sentiment === 'positive' ? POSITIVE_TAGS : NEGATIVE_TAGS;

  return (
    <section className="mt-4 rounded-xl border border-border bg-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-accent" size={18} aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold">Feedback del duo</h3>
            <p className="text-[11px] text-muted">
              Doble ciego: cada uno ve el del otro cuando ambos responden.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border p-1.5 text-muted"
          aria-label="Cerrar feedback"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-surface-2" />
      ) : error ? (
        <p className="mt-4 text-sm text-danger">{error}</p>
      ) : (
        <>
          {detail?.mine ? (
            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-muted">Tu feedback</p>
              <p className="mt-1 text-sm font-semibold">
                {detail.mine.sentiment === 'positive' ? 'Positivo' : 'Negativo'}
              </p>
              {detail.mine.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.mine.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-1 text-[10px] text-muted"
                    >
                      {FEEDBACK_TAG_LABELS[tag] || tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {detail.mine.comment ? (
                <p className="mt-2 text-sm text-muted">{detail.mine.comment}</p>
              ) : null}
              <p className="mt-2 text-[10px] text-muted">
                Enviado el {formatDateTime(detail.mine.createdAt)}
              </p>
            </div>
          ) : null}

          {detail?.revealed && detail.theirs ? (
            <div className="mt-3 rounded-xl border border-accent/40 bg-accent/5 p-4">
              <p className="text-xs font-semibold text-accent">
                Feedback de {match.other.username}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {detail.theirs.sentiment === 'positive' ? 'Positivo' : 'Negativo'}
              </p>
              {detail.theirs.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.theirs.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-1 text-[10px] text-muted"
                    >
                      {FEEDBACK_TAG_LABELS[tag] || tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {detail.theirs.comment ? (
                <p className="mt-2 text-sm text-muted">{detail.theirs.comment}</p>
              ) : null}
            </div>
          ) : null}

          {detail.mine && !detail.revealed ? (
            <p className="mt-3 text-[11px] text-muted">
              {match.feedback?.theirs === 'submitted'
                ? 'La otra persona ya respondió. Falta que responda para revelarlo.'
                : 'Se revela cuando ambos respondan o venza la ventana de 7 días.'}
            </p>
          ) : null}

          {!detail.mine && !detail.windowOpen ? (
            <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
              La ventana de feedback de 7 días cerró.
            </p>
          ) : null}

          {!detail.mine && detail.windowOpen ? (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => changeSentiment('positive')}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                    sentiment === 'positive'
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border text-muted'
                  }`}
                >
                  Positivo
                </button>
                <button
                  type="button"
                  onClick={() => changeSentiment('negative')}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                    sentiment === 'negative'
                      ? 'border-danger bg-danger/10 text-danger'
                      : 'border-border text-muted'
                  }`}
                >
                  Negativo
                </button>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted">
                  Motivos {sentiment === 'negative' ? '(al menos 1)' : '(hasta 3)'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-2.5 py-1.5 text-[10px] font-semibold ${
                        tags.includes(tag)
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-border text-muted'
                      }`}
                    >
                      {tags.includes(tag) ? <Check size={10} className="mr-1 inline" /> : null}
                      {FEEDBACK_TAG_LABELS[tag] || tag}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={280}
                rows={2}
                placeholder="Comentario opcional"
                className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-muted/60"
              />

              <p className="text-[10px] text-muted">
                Ventana hasta {formatDateTime(detail.expiresAt)}.
              </p>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg disabled:opacity-60"
              >
                <Send size={14} aria-hidden="true" />
                Enviar feedback
              </button>
            </form>
          ) : null}
        </>
      )}
    </section>
  );
}
