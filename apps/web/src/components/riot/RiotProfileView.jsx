import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Flame,
  Languages,
  Mic,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Swords,
  UserRound,
} from 'lucide-react';
import RankIcon from '../RankIcon.jsx';
import { DIVISION_LABELS, RANK_LABELS, initialsOf } from '../../utils/labels.js';
import { DEMO_DUO_PROFILE } from '../../content/riotDemo.js';

const QUEUES = [
  { type: 'RANKED_SOLO_5x5', label: 'Solo/Dúo' },
  { type: 'RANKED_FLEX_SR', label: 'Flex' },
];

const APEX_TIERS = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

const rankLabel = (entry) => {
  const tier = RANK_LABELS[entry.tier?.toLowerCase()] || entry.tier;
  const division = DIVISION_LABELS[entry.rank?.toLowerCase()];
  return division ? `${tier} ${division}` : tier;
};

const winrateOf = (entry) => {
  const total = entry.wins + entry.losses;
  return total ? Math.round((entry.wins / total) * 100) : null;
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Argentina/Buenos_Aires',
      }).format(new Date(value))
    : '-';

const formatNumber = (value) => new Intl.NumberFormat('es-AR').format(value || 0);

const championImageUrl = (version, champion) =>
  version && champion?.image?.full
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`
    : null;

function WinrateRing({ value }) {
  const safeValue = value ?? 0;

  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
      style={{
        background:
          value === null
            ? 'conic-gradient(#0a1424 0deg, #0a1424 360deg)'
            : `conic-gradient(#b0cf5c ${safeValue * 3.6}deg, #0a1424 0deg)`,
      }}
    >
      <div className="flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full bg-surface">
        <span className="text-lg font-extrabold">{value === null ? '-' : `${value}%`}</span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-muted">Winrate</span>
      </div>
    </div>
  );
}

function QueueCard({ entry, queue }) {
  const winrate = winrateOf(entry);
  const total = entry.wins + entry.losses;
  const isApex = APEX_TIERS.includes(entry.tier);

  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted">{queue.label}</p>
          <p className="mt-1 text-xs text-muted">
            {total} partida{total === 1 ? '' : 's'} clasificatoria{total === 1 ? '' : 's'}
          </p>
        </div>
        <RankIcon tier={entry.tier?.toLowerCase()} size={34} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-2xl font-extrabold">{rankLabel(entry)}</h3>
          <p className="mt-1 text-sm font-semibold text-accent">{entry.leaguePoints} LP</p>
        </div>
        <WinrateRing value={winrate} />
      </div>

      {!isApex ? (
        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(entry.leaguePoints, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-muted">
            {entry.leaguePoints}/100 LP en la división
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <span className="rounded-full border border-border px-2.5 py-1 text-muted">
          {entry.wins}W / {entry.losses}L
        </span>
        {entry.hotStreak ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold">
            <Flame size={11} aria-hidden="true" />
            Racha caliente
          </span>
        ) : null}
        {entry.inactive ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-muted">
            <Snowflake size={11} aria-hidden="true" />
            Inactivo
          </span>
        ) : null}
      </div>
    </article>
  );
}

function EmptyQueueCard({ label }) {
  return (
    <article className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
      <Swords size={28} className="text-muted" aria-hidden="true" />
      <p className="mt-3 font-bold">{label}</p>
      <p className="mt-1 text-sm text-muted">Sin clasificar en esta cola.</p>
    </article>
  );
}

function ChampionCard({ mastery, champion, version }) {
  const image = championImageUrl(version, champion);
  const name = champion?.name || `Campeón ${mastery.championId}`;

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" loading="eager" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-extrabold text-accent">
            {initialsOf(name)}
          </div>
        )}
        <span className="absolute bottom-1 right-1 rounded bg-bg/90 px-1.5 py-0.5 text-[9px] font-extrabold text-gold">
          M{mastery.championLevel}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="mt-1 text-[11px] text-muted">{formatNumber(mastery.championPoints)} pts</p>
      </div>
    </article>
  );
}

export default function RiotProfileView({
  lookup,
  duoProfile,
  duoLabel = 'Ejemplo',
  notice,
  subtitle = 'Así vería otro jugador tu perfil después de una conexión.',
  displayName,
  showTag = true,
  technicalDetails,
}) {
  const [ddragonVersion, setDdragonVersion] = useState(null);
  const [champions, setChampions] = useState({});
  const [iconFailed, setIconFailed] = useState(false);

  useEffect(() => {
    let active = true;

    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      .then((response) => response.json())
      .then((versions) => {
        if (active && Array.isArray(versions) && versions[0]) {
          setDdragonVersion(versions[0]);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ddragonVersion) return undefined;

    let active = true;

    fetch(`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/es_AR/champion.json`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active || !payload?.data) return;
        setChampions(
          Object.fromEntries(
            Object.values(payload.data).map((champion) => [String(champion.key), champion])
          )
        );
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [ddragonVersion]);

  if (!lookup?.account || !lookup?.summoner) return null;

  const entries = [...(lookup.league || [])].sort(
    (a, b) =>
      QUEUES.findIndex((queue) => queue.type === a.queueType) -
      QUEUES.findIndex((queue) => queue.type === b.queueType)
  );
  const byQueue = new Map(entries.map((entry) => [entry.queueType, entry]));
  const totalWins = entries.reduce((total, entry) => total + entry.wins, 0);
  const totalLosses = entries.reduce((total, entry) => total + entry.losses, 0);
  const totalGames = totalWins + totalLosses;
  const totalWinrate = totalGames ? Math.round((totalWins / totalGames) * 100) : null;
  const profile = duoProfile || lookup.duo || DEMO_DUO_PROFILE;
  const identityName = displayName || lookup.account.gameName;
  const profileIconUrl =
    ddragonVersion && lookup.summoner.profileIconId
      ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${lookup.summoner.profileIconId}.png`
      : null;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-border/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-2">
            {profileIconUrl && !iconFailed ? (
              <img
                src={profileIconUrl}
                alt={`Ícono de ${lookup.account.gameName}`}
                className="h-full w-full object-cover"
                onError={() => setIconFailed(true)}
              />
            ) : (
              <span className="flex h-full items-center justify-center text-3xl font-extrabold text-accent">
                {initialsOf(lookup.account.gameName)}
              </span>
            )}
            <span className="absolute bottom-1.5 right-1.5 rounded-lg bg-bg/90 px-2 py-1 text-[10px] font-extrabold text-accent">
              Nv {lookup.summoner.summonerLevel}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
                <ShieldCheck size={11} aria-hidden="true" />
                Cuenta Riot verificada
              </span>
              <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-bold text-muted">
                Vista previa RSO
              </span>
            </div>

            <h2 className="mt-3 truncate text-3xl font-extrabold">
              {identityName}
              {showTag ? <span className="text-muted">#{lookup.account.tagLine}</span> : null}
            </h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-muted">
              <span className="inline-flex items-center gap-1">
                <UserRound size={12} aria-hidden="true" />
                Nivel {lookup.summoner.summonerLevel}
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={12} className="text-success" aria-hidden="true" />
                {lookup.cached ? 'Datos desde cache' : 'Datos actualizados ahora'}
              </span>
              <span>Actualizado {formatDate(lookup.fetchedAt)}</span>
            </div>
          </div>
        </div>

        {entries.length ? (
          <div className="relative mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs">
            <span className="font-semibold text-muted">Resumen clasificatorio</span>
            <span className="rounded-full border border-border px-2.5 py-1 font-bold">
              {totalGames} partidas
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 font-bold">
              {totalWins}W / {totalLosses}L
            </span>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-bold text-accent">
              {totalWinrate}% winrate
            </span>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {QUEUES.map((queue) => {
          const entry = byQueue.get(queue.type);
          return entry ? (
            <QueueCard key={queue.type} entry={entry} queue={queue} />
          ) : (
            <EmptyQueueCard key={queue.type} label={queue.label} />
          );
        })}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-accent" aria-hidden="true" />
            <h2 className="font-bold">Top campeones</h2>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Por maestría
          </span>
        </div>

        {lookup.masteries?.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {lookup.masteries.map((mastery) => (
              <ChampionCard
                key={mastery.championId}
                mastery={mastery}
                champion={champions[String(mastery.championId)]}
                version={ddragonVersion}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Riot no devolvió maestrías para esta cuenta.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserRound size={17} className="text-accent" aria-hidden="true" />
            <h2 className="font-bold">Datos de Duo LAS</h2>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted">
            {duoLabel}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-xs text-muted">Roles</p>
            <p className="mt-1 text-sm font-semibold">{profile.roles}</p>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-xs text-muted">Estilo</p>
            <p className="mt-1 text-sm font-semibold">{profile.style}</p>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-xs text-muted">Idiomas</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <Languages size={14} className="text-accent" aria-hidden="true" />
              {profile.languages}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-xs text-muted">Comunicación</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <Mic size={14} className="text-accent" aria-hidden="true" />
              {profile.mic}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">{profile.bio}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {profile.availability}
          </span>
          {profile.schedule.map((block) => (
            <span
              key={block}
              className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted"
            >
              {block}
            </span>
          ))}
        </div>
      </section>

      {notice ? (
        <div className="rounded-2xl border border-border bg-surface p-4 text-center text-xs text-muted">
          {notice}
        </div>
      ) : null}

      {technicalDetails}
    </div>
  );
}
