import { motion } from 'framer-motion';
import { Ban, Check, Heart, Languages, Mic, MicOff, Star } from 'lucide-react';
import CountryBadge from './CountryBadge.jsx';
import RankIcon from './RankIcon.jsx';
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
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
              <RankIcon tier={player.rankTier} size={16} />
              <span className="truncate">
                {formatRank(player)} · {formatRoles(player)}
              </span>
            </p>
            {player.country ? (
              <p className="mt-0.5 text-[10px] text-muted">
                <CountryBadge country={player.country} />
              </p>
            ) : null}
          </div>
        </div>
        {typeof score === 'number' ? (
          <div className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
            {score} pts
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-muted">
        <span className="truncate">{STYLE_LABELS[player.playStyle] || player.playStyle}</span>
        <span className="inline-flex min-w-0 items-center gap-1">
          {player.hasMic ? (
            <Mic size={12} aria-hidden="true" />
          ) : (
            <MicOff size={12} aria-hidden="true" />
          )}
          <span className="truncate">{player.hasMic ? 'Con mic' : 'Sin mic'}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1">
          <Languages size={12} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {(player.languages || [])
              .map((language) => LANGUAGE_LABELS[language] || language)
              .join(' · ')}
          </span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1">
          <Star size={12} className="shrink-0" aria-hidden="true" />
          <span className="truncate">Reputación {player.reputation?.label || 'Nuevo'}</span>
        </span>
      </div>

      {reasons.length ? (
        <ul className="mt-3 grid gap-1 text-[11px] text-muted">
          {reasons.slice(0, 2).map((reason) => (
            <li key={reason} className="flex items-start gap-1.5">
              <Check size={12} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {player.bio ? (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{player.bio}</p>
      ) : null}

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
