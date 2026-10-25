import { motion } from 'framer-motion';
import { Ban, Heart, Lock, Mic, MicOff } from 'lucide-react';
import {
  LANGUAGE_LABELS,
  STYLE_LABELS,
  formatRank,
  formatRoles,
  initialsOf,
} from '../utils/labels.js';

export default function PlayerPreviewCard({
  player,
  score,
  reasons = [],
  onLike,
  onBlock,
  busy = false,
  showActions = true,
  compact = false,
}) {
  if (!player) return null;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border border-border bg-surface ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
            {initialsOf(player.username)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-bold">{player.username}</h3>
            <p className="truncate text-xs text-muted">
              {formatRank(player)} · {formatRoles(player)}
            </p>
          </div>
        </div>
        {typeof score === 'number' ? (
          <div className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
            {score} pts
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted">
        <span className="rounded-full border border-border px-2 py-1">
          {STYLE_LABELS[player.playStyle] || player.playStyle}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">
          {player.hasMic ? (
            <Mic size={11} aria-hidden="true" />
          ) : (
            <MicOff size={11} aria-hidden="true" />
          )}
          {player.hasMic ? 'Con mic' : 'Sin mic'}
        </span>
        {(player.languages || []).map((language) => (
          <span key={language} className="rounded-full border border-border px-2 py-1">
            {LANGUAGE_LABELS[language] || language}
          </span>
        ))}
        {player.reputation?.label ? (
          <span className="rounded-full border border-border px-2 py-1">
            Reputación {player.reputation.label}
          </span>
        ) : null}
      </div>

      {reasons.length ? (
        <ul className="mt-4 space-y-1 text-xs text-muted">
          {reasons.slice(0, 3).map((reason) => (
            <li key={reason}>· {reason}</li>
          ))}
        </ul>
      ) : null}

      {player.bio ? (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{player.bio}</p>
      ) : null}

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
        <Lock size={11} aria-hidden="true" />
        Riot ID y Discord se revelan cuando hay match.
      </p>

      {showActions ? (
        <div className="mt-4 flex items-center gap-2">
          {onLike ? (
            <button
              type="button"
              onClick={() => onLike(player)}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-bg transition hover:bg-accent-strong disabled:opacity-60"
            >
              <Heart size={15} aria-hidden="true" />
              Me interesa
            </button>
          ) : null}
          {onBlock ? (
            <button
              type="button"
              onClick={() => onBlock(player)}
              disabled={busy}
              className="rounded-xl border border-border p-2.5 text-danger transition hover:border-danger/60 disabled:opacity-60"
              aria-label={`Bloquear a ${player.username}`}
            >
              <Ban size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </motion.article>
  );
}
