import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  Heart,
  KeyRound,
  Languages,
  LockKeyhole,
  Mic,
  Radio,
  ShieldCheck,
  Sparkles,
  Swords,
  UserRound,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BetaBadge from '../components/BetaBadge.jsx';
import RiotDisclaimer from '../components/RiotDisclaimer.jsx';
import RankIcon from '../components/RankIcon.jsx';
import RiotProfileView from '../components/riot/RiotProfileView.jsx';
import { RIOT_DEMO_CHAMPIONS, RIOT_DEMO_PROFILES } from '../content/riotDemo.js';
import { DIVISION_LABELS, RANK_LABELS, initialsOf } from '../utils/labels.js';

const SESSION_KEY = 'duo-riot-demo-access';
const ACCESS_CODE = import.meta.env.VITE_RIOT_DEMO_ACCESS_CODE || 'RIOT-DUOLAS-2026';

export const RIOT_PUBLIC_DEMO_PATH = '/demo-riot-9f4a2c';

const STEPS = [
  { id: 'my-profile', label: 'Mi perfil', icon: UserRound },
  { id: 'match', label: 'Match', icon: Swords },
  { id: 'public-profile', label: 'Perfil público', icon: Eye },
  { id: 'available', label: 'Disponible ya', icon: Radio },
  { id: 'busco-1', label: 'Busco 1', icon: ClipboardList },
  { id: 'end', label: 'Cierre', icon: CheckCircle2 },
];

const withMeta = (profile) => ({
  ...profile,
  fetchedAt: profile.fetchedAt || new Date().toISOString(),
  cached: false,
});

const ME = withMeta(RIOT_DEMO_PROFILES[0]);
const CANDIDATES = RIOT_DEMO_PROFILES.slice(1).map(withMeta);

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

const profileIconUrl = (version, profile) =>
  version && profile?.summoner?.profileIconId
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profile.summoner.profileIconId}.png`
    : null;

const championIconUrl = (version, championId) => {
  const champion = RIOT_DEMO_CHAMPIONS[championId];
  return version && champion
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image}`
    : null;
};

const queueEntry = (profile, queueType) =>
  profile?.league?.find((entry) => entry.queueType === queueType) || null;

const rankText = (entry) => {
  if (!entry) return 'Sin clasificar';
  const tier = RANK_LABELS[entry.tier?.toLowerCase()] || entry.tier;
  const division = DIVISION_LABELS[entry.rank?.toLowerCase()];
  return division ? `${tier} ${division}` : tier;
};

function useDdragonVersion() {
  const [version, setVersion] = useState(null);

  useEffect(() => {
    let active = true;

    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      .then((response) => response.json())
      .then((versions) => {
        if (active && Array.isArray(versions) && versions[0]) {
          setVersion(versions[0]);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return version;
}

function DemoHeader({ unlocked, onExit }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          Duo<span className="text-accent">LAS</span>
          <BetaBadge />
        </Link>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
          Demo Riot
        </span>
        {unlocked ? (
          <button
            type="button"
            onClick={onExit}
            className="ml-auto min-h-11 rounded-xl border border-border px-3 text-xs font-semibold text-muted"
          >
            Salir
          </button>
        ) : null}
      </div>
    </header>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-1 text-[9px] font-bold text-success">
      <ShieldCheck size={10} aria-hidden="true" />
      Riot verificado
    </span>
  );
}

function ChampionStrip({ masteries, version, size = 'sm' }) {
  return (
    <div className="flex items-center gap-1.5">
      {masteries.map((mastery) => {
        const champion = RIOT_DEMO_CHAMPIONS[mastery.championId];
        const image = championIconUrl(version, mastery.championId);
        const className = size === 'md' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-lg';

        return (
          <div
            key={mastery.championId}
            className={`relative shrink-0 overflow-hidden border border-border bg-surface-2 ${className}`}
            title={`${champion?.name || 'Campeón'} · Maestría ${mastery.championLevel}`}
          >
            {image ? (
              <img
                src={image}
                alt={champion?.name || 'Campeón'}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-[10px] font-bold text-accent">
                {initialsOf(champion?.name || '?')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileIcon({ profile, version, size = 'md' }) {
  const image = profileIconUrl(version, profile);
  const className = size === 'lg' ? 'h-24 w-24 rounded-2xl' : 'h-14 w-14 rounded-xl';

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-border bg-surface-2 ${className}`}
    >
      {image ? (
        <img
          src={image}
          alt={`Ícono de ${profile.account.gameName}`}
          className="h-full w-full object-cover"
          loading="eager"
        />
      ) : (
        <span className="flex h-full items-center justify-center text-lg font-extrabold text-accent">
          {initialsOf(profile.account.gameName)}
        </span>
      )}
      <span className="absolute bottom-1 right-1 rounded bg-bg/90 px-1.5 py-0.5 text-[9px] font-extrabold text-accent">
        {profile.summoner.summonerLevel}
      </span>
    </div>
  );
}

function PlayerCard({
  profile,
  version,
  score,
  reasons = [],
  onViewProfile,
  actionLabel,
  onAction,
  actionDone = false,
  actionIcon: ActionIcon = Heart,
  note,
}) {
  const solo = queueEntry(profile, 'RANKED_SOLO_5x5');

  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <ProfileIcon profile={profile} version={version} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold">@{profile.account.gameName}</h3>
            <VerifiedBadge />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Nivel {profile.summoner.summonerLevel} · {profile.duo.roles}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <RankIcon tier={solo?.tier?.toLowerCase()} size={16} />
            {rankText(solo)} · {solo?.leaguePoints ?? 0} LP
          </p>
        </div>
        {typeof score === 'number' ? (
          <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold text-accent">
            {score} pts
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <ChampionStrip masteries={profile.masteries} version={version} />
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted">
          <Sparkles size={11} className="text-accent" aria-hidden="true" />
          Top campeones
        </span>
      </div>

      {reasons.length ? (
        <ul className="mt-3 grid gap-1 text-[11px] text-muted">
          {reasons.slice(0, 3).map((reason) => (
            <li key={reason} className="flex items-start gap-1.5">
              <Check size={12} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {note ? <p className="mt-3 text-[11px] text-muted">{note}</p> : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewProfile?.(profile)}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-accent transition hover:border-accent/50"
        >
          <Eye size={14} aria-hidden="true" />
          Ver perfil
        </button>
        {actionLabel ? (
          <button
            type="button"
            onClick={() => onAction?.(profile)}
            disabled={actionDone}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-bold text-bg transition hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            <ActionIcon size={14} aria-hidden="true" />
            {actionDone ? 'Enviado' : actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function MyProfileStep({ version, onNext, onOpenPublic }) {
  const solo = queueEntry(ME, 'RANKED_SOLO_5x5');
  const flex = queueEntry(ME, 'RANKED_FLEX_SR');

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileIcon profile={ME} version={version} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
                <ShieldCheck size={11} aria-hidden="true" />
                Cuenta Riot vinculada
              </span>
              <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-bold text-muted">
                Datos de ejemplo
              </span>
            </div>
            <h1 className="mt-3 truncate text-3xl font-extrabold">@{ME.account.gameName}</h1>
            <p className="mt-1 text-sm text-muted">
              Riot ID verificado: {ME.account.gameName}
              <span className="text-muted">#{ME.account.tagLine}</span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onNext}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-bg"
              >
                Ir a Match
                <ArrowRight size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenPublic}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-muted"
              >
                <Eye size={14} aria-hidden="true" />
                Ver cómo me ven
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">Solo/Dúo</p>
            <RankIcon tier={solo?.tier?.toLowerCase()} size={30} />
          </div>
          <p className="mt-4 text-2xl font-extrabold">{rankText(solo)}</p>
          <p className="mt-1 text-xs text-muted">{solo?.leaguePoints ?? 0} LP · Rango verificado</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">Flex</p>
            <RankIcon tier={flex?.tier?.toLowerCase()} size={30} />
          </div>
          <p className="mt-4 text-2xl font-extrabold">{rankText(flex)}</p>
          <p className="mt-1 text-xs text-muted">{flex?.leaguePoints ?? 0} LP · Rango verificado</p>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-accent" aria-hidden="true" />
              <h2 className="font-bold">Tus mejores campeones</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              Lo que se muestra en tu perfil y en las cards de match.
            </p>
          </div>
          <ChampionStrip masteries={ME.masteries} version={version} size="md" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <UserRound size={17} className="text-accent" aria-hidden="true" />
          <h2 className="font-bold">Datos de Duo LAS</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-xs text-muted">Roles</p>
            <p className="mt-1 text-sm font-semibold">{ME.duo.roles}</p>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-xs text-muted">Estilo</p>
            <p className="mt-1 text-sm font-semibold">{ME.duo.style}</p>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-xs text-muted">Idiomas</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <Languages size={14} className="text-accent" aria-hidden="true" />
              {ME.duo.languages}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-xs text-muted">Comunicación</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <Mic size={14} className="text-accent" aria-hidden="true" />
              {ME.duo.mic}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {ME.duo.availability}
          </span>
          {ME.duo.schedule.map((block) => (
            <span
              key={block}
              className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted"
            >
              {block}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function MatchStep({ version, likedId, onLike, onViewProfile }) {
  return (
    <div className="space-y-5">
      <StepHeading>
        <Swords size={18} className="text-accent" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-extrabold">Match por afinidad</h1>
          <p className="mt-1 text-sm text-muted">
            El rango verificado con Riot y los campeones se suman al score de afinidad.
          </p>
        </div>
      </StepHeading>

      <div className="grid gap-4 sm:grid-cols-2">
        {CANDIDATES.map((profile) => (
          <PlayerCard
            key={profile.account.puuid}
            profile={profile}
            version={version}
            score={profile.match.score}
            reasons={profile.match.reasons}
            onViewProfile={onViewProfile}
            actionLabel="Me interesa"
            onAction={(candidate) => onLike(candidate.account.puuid)}
            actionDone={likedId === profile.account.puuid}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 text-xs text-muted">
        El Riot ID completo y los contactos no aparecen en Match. Se revelan recién después de una
        conexión.
      </div>
    </div>
  );
}

function PublicProfileStep({ profile, onBackToMatch }) {
  return (
    <div className="space-y-4">
      <RiotProfileView
        lookup={profile}
        duoProfile={profile.duo}
        duoLabel="Perfil de ejemplo"
        displayName={`@${profile.account.gameName}`}
        showTag={false}
        subtitle="Así ve el perfil otro jugador después de una conexión. El Riot ID completo queda oculto."
        notice="El perfil público no muestra email, Riot ID, Discord, WhatsApp ni reputación."
      />
      <button
        type="button"
        onClick={onBackToMatch}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-xs font-semibold text-muted"
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" />
        Volver a Match
      </button>
    </div>
  );
}

function AvailableStep({ version, invitedId, onInvite, onViewProfile }) {
  return (
    <div className="space-y-5">
      <StepHeading>
        <Radio size={18} className="text-accent" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-extrabold">Disponible ya</h1>
          <p className="mt-1 text-sm text-muted">
            Jugadores disponibles ahora, con su rango e identidad verificada por Riot.
          </p>
        </div>
      </StepHeading>

      <div className="grid gap-4 sm:grid-cols-2">
        {CANDIDATES.map((profile) => (
          <PlayerCard
            key={profile.account.puuid}
            profile={profile}
            version={version}
            onViewProfile={onViewProfile}
            actionLabel="Invitar"
            actionIcon={Users}
            onAction={(candidate) => onInvite(candidate.account.puuid)}
            actionDone={invitedId === profile.account.puuid}
            note={`${profile.available.since} · ${profile.available.queue} · ${profile.available.note}`}
          />
        ))}
      </div>
    </div>
  );
}

function BuscoOneStep({ version, appliedId, onApply, onViewProfile }) {
  return (
    <div className="space-y-5">
      <StepHeading>
        <ClipboardList size={18} className="text-accent" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-extrabold">Busco 1</h1>
          <p className="mt-1 text-sm text-muted">
            Publicaciones de grupo con el mismo dato verificado de Riot.
          </p>
        </div>
      </StepHeading>

      <div className="grid gap-4">
        {CANDIDATES.map((profile) => (
          <article
            key={profile.account.puuid}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <ProfileIcon profile={profile} version={version} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{profile.post.title}</h3>
                  <VerifiedBadge />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  @{profile.account.gameName} · {profile.duo.roles} ·{' '}
                  {rankText(queueEntry(profile, 'RANKED_SOLO_5x5'))}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {profile.post.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted">
                    {profile.post.needed}
                  </span>
                  <ChampionStrip masteries={profile.masteries} version={version} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onViewProfile(profile)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-accent"
                  >
                    <Eye size={14} aria-hidden="true" />
                    Ver perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => onApply(profile.account.puuid)}
                    disabled={appliedId === profile.account.puuid}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-bold text-bg disabled:cursor-default disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {appliedId === profile.account.puuid ? 'Postulación enviada' : 'Postularme'}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function EndStep({ onRestart }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <CheckCircle2 size={28} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold">Fin del recorrido</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">
        Esto es lo que vería un jugador cuando su cuenta de Riot esté vinculada: perfil, match,
        perfil público, disponibilidad y Busco 1 usando el mismo dato verificado.
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-bg"
      >
        Volver al inicio de la demo
      </button>
    </div>
  );
}

function StepHeading({ children }) {
  return <div className="flex items-start gap-3">{children}</div>;
}

export default function RiotPublicDemoPage() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch (_error) {
      return false;
    }
  });
  const [code, setCode] = useState('');
  const [gateError, setGateError] = useState('');
  const [step, setStep] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(CANDIDATES[0]);
  const [likedId, setLikedId] = useState(null);
  const [invitedId, setInvitedId] = useState(null);
  const [appliedId, setAppliedId] = useState(null);
  const version = useDdragonVersion();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = 'Demo Riot - Duo LAS';

    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);

  const unlock = (event) => {
    event.preventDefault();
    if (code.trim() !== ACCESS_CODE) {
      setGateError('Código incorrecto. Revisá el acceso compartido para la revisión.');
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (_error) {
      setGateError('No pudimos guardar el acceso en este navegador.');
      return;
    }

    setGateError('');
    setUnlocked(true);
    setStep(0);
  };

  const exit = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setCode('');
    setGateError('');
    setStep(0);
  };

  const openPublicProfile = (profile) => {
    setSelectedProfile({
      ...profile,
      fetchedAt: profile.fetchedAt || new Date().toISOString(),
      cached: false,
    });
    setStep(2);
  };

  const restart = () => {
    setStep(0);
    setSelectedProfile(CANDIDATES[0]);
    setLikedId(null);
    setInvitedId(null);
    setAppliedId(null);
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <DemoHeader unlocked={false} />
        <main className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16">
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <LockKeyhole size={25} aria-hidden="true" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Acceso para revisión
            </p>
            <h1 className="mt-2 text-2xl font-extrabold">Demo de integración con Riot</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Recorrido guiado por Mi perfil, Match, Perfil público, Disponible ya y Busco 1. Es una
              demo aislada, con datos ficticios y sin usuarios reales.
            </p>

            <form onSubmit={unlock} className="mt-6">
              <label className="block text-sm font-semibold">
                Código de acceso
                <input
                  type="password"
                  className={`${inputClass} mt-2`}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              {gateError ? (
                <p className="mt-2 text-xs font-semibold text-danger">{gateError}</p>
              ) : null}
              <button
                type="submit"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg transition hover:bg-accent-strong"
              >
                Entrar a la demo
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>

            <div className="mt-6 flex items-start gap-2 border-t border-border pt-4 text-[11px] leading-relaxed text-muted">
              <KeyRound size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              El código se comparte únicamente en la solicitud de revisión. No es una credencial de
              usuario ni da acceso a la aplicación real.
            </div>
          </div>

          <RiotDisclaimer className="mt-6 text-center" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <DemoHeader unlocked onExit={exit} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Demo pública aislada
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">Recorrido de un perfil verificado</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Datos ficticios para revisar cómo se muestra la vinculación con Riot en el producto.
              No se consulta la API de Riot ni se guardan datos.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
            <ShieldCheck size={11} aria-hidden="true" />
            Sin datos reales
          </span>
        </div>

        <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Pasos de la demo">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const active = index === step;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(index)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-[11px] font-semibold transition ${
                  active
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border text-muted hover:text-text'
                }`}
              >
                <Icon size={13} aria-hidden="true" />
                <span>
                  {index + 1}. {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6">
          {step === 0 ? (
            <MyProfileStep
              version={version}
              onNext={() => setStep(1)}
              onOpenPublic={() => openPublicProfile(ME)}
            />
          ) : null}
          {step === 1 ? (
            <MatchStep
              version={version}
              likedId={likedId}
              onLike={setLikedId}
              onViewProfile={openPublicProfile}
            />
          ) : null}
          {step === 2 ? (
            <PublicProfileStep profile={selectedProfile} onBackToMatch={() => setStep(1)} />
          ) : null}
          {step === 3 ? (
            <AvailableStep
              version={version}
              invitedId={invitedId}
              onInvite={setInvitedId}
              onViewProfile={openPublicProfile}
            />
          ) : null}
          {step === 4 ? (
            <BuscoOneStep
              version={version}
              appliedId={appliedId}
              onApply={setAppliedId}
              onViewProfile={openPublicProfile}
            />
          ) : null}
          {step === 5 ? <EndStep onRestart={restart} /> : null}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-xs font-semibold text-muted disabled:cursor-default disabled:opacity-40"
          >
            <ArrowRight size={14} className="rotate-180" aria-hidden="true" />
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
            disabled={step === STEPS.length - 1}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-bold text-bg disabled:cursor-default disabled:opacity-40"
          >
            Siguiente
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-8 border-t border-border pt-5 text-center">
          <RiotDisclaimer />
        </div>
      </main>
    </div>
  );
}
