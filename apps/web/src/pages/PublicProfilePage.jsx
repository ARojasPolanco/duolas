import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Languages,
  Mic,
  MicOff,
  Sparkles,
  UserRound,
} from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import CountryBadge from '../components/CountryBadge.jsx';
import RankIcon from '../components/RankIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../config/api.js';
import {
  DIVISION_LABELS,
  LANGUAGE_LABELS,
  RANK_LABELS,
  STYLE_LABELS,
  formatRoles,
  initialsOf,
} from '../utils/labels.js';
import { formatBlockRange } from '../utils/time.js';

const DAY_LABELS = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mié',
  thu: 'Jue',
  fri: 'Vie',
  sat: 'Sáb',
  sun: 'Dom',
};

const BLOCK_LABELS = {
  early: 'Madrugada',
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche',
};

const queueRankLabel = (tier, division) => {
  if (!tier) return 'Sin rango';
  const tierLabel = RANK_LABELS[tier] || tier;
  const divisionLabel = DIVISION_LABELS[division];
  return divisionLabel ? `${tierLabel} ${divisionLabel}` : tierLabel;
};

const scheduleLabel = (block, country) => {
  const [day, range] = block.split('_');
  return `${DAY_LABELS[day] || day} ${BLOCK_LABELS[range] || range} ${formatBlockRange(
    range,
    country
  )}`;
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'long',
        timeZone: 'America/Argentina/Buenos_Aires',
      }).format(new Date(value))
    : '-';

export default function PublicProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!localStorage.getItem('token') || !id) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/v1/profiles/${id}`);
        if (active) setProfile(res.data.profile);
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || 'No pudimos cargar este perfil.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <AppShell maxWidth="max-w-3xl">
        <div className="h-80 animate-pulse rounded-2xl border border-border bg-surface" />
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell maxWidth="max-w-3xl">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <UserRound className="mx-auto text-muted" size={32} aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Perfil no disponible</h1>
          <p className="mt-2 text-sm text-muted">{error || 'No pudimos encontrar este perfil.'}</p>
          <Link
            to="/match"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-bold text-bg"
          >
            Volver a Match
          </Link>
        </div>
      </AppShell>
    );
  }

  const isMe = profile.id === user?.id;
  const isRiotRank = profile.rankSource === 'riot' || profile.flexRankSource === 'riot';

  return (
    <AppShell maxWidth="max-w-3xl">
      <div className="space-y-5">
        <Link
          to="/match"
          className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Volver a Match
        </Link>

        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl font-extrabold text-accent">
              {initialsOf(profile.username)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Perfil público
              </p>
              <h1 className="mt-1 truncate text-3xl font-extrabold">@{profile.username}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1">
                  <UserRound size={12} aria-hidden="true" />
                  {formatRoles(profile)}
                </span>
                {profile.country ? <CountryBadge country={profile.country} /> : null}
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1">
                  {profile.hasMic ? (
                    <Mic size={12} aria-hidden="true" />
                  ) : (
                    <MicOff size={12} aria-hidden="true" />
                  )}
                  {profile.hasMic ? 'Con mic' : 'Sin mic'}
                </span>
              </div>
            </div>
            {isMe ? (
              <Link
                to="/perfil"
                className="ml-auto inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-xs font-semibold text-muted"
              >
                Editar mi perfil
              </Link>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted">Solo/Dúo</p>
              <RankIcon tier={profile.rankTier} size={30} />
            </div>
            <p className="mt-4 text-2xl font-extrabold">
              {queueRankLabel(profile.rankTier, profile.rankDivision)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {profile.rankTier ? (
                <>
                  {profile.rankLp ?? 0} LP ·{' '}
                  {profile.rankSource === 'riot' ? 'Desde Riot' : 'Declarado'}
                </>
              ) : (
                'Todavía no cargó su rango.'
              )}
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted">Flex</p>
              <RankIcon tier={profile.flexRankTier || profile.rankTier} size={30} />
            </div>
            <p className="mt-4 text-2xl font-extrabold">
              {profile.flexRankTier
                ? queueRankLabel(profile.flexRankTier, profile.flexRankDivision)
                : 'Sin declarar'}
            </p>
            <p className="mt-1 text-xs text-muted">
              {profile.flexRankTier
                ? `${profile.flexRankLp ?? 0} LP · ${
                    profile.flexRankSource === 'riot' ? 'Desde Riot' : 'Declarado'
                  }`
                : 'Todavía no cargó su rango Flex.'}
            </p>
          </article>
        </section>

        {isRiotRank ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-xs font-semibold text-success">
            <CheckCircle2 size={15} aria-hidden="true" />
            Rango actualizado desde Riot.
          </div>
        ) : null}

        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-accent" aria-hidden="true" />
            <h2 className="font-bold">Sobre {profile.username}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {profile.bio || 'Este jugador todavía no escribió una bio.'}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-xs text-muted">Estilo</p>
              <p className="mt-1 text-sm font-semibold">
                {STYLE_LABELS[profile.playStyle] || profile.playStyle}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-xs text-muted">Idiomas</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                <Languages size={14} className="text-accent" aria-hidden="true" />
                {(profile.languages || [])
                  .map((language) => LANGUAGE_LABELS[language] || language)
                  .join(' · ')}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <CalendarDays size={17} className="text-accent" aria-hidden="true" />
            <h2 className="font-bold">Horarios</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile.scheduleBlocks || []).length ? (
              profile.scheduleBlocks.map((block) => (
                <span
                  key={block}
                  className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[11px] font-semibold text-muted"
                >
                  {scheduleLabel(block, profile.country)}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted">Sin horarios declarados.</p>
            )}
          </div>
          <p className="mt-4 text-[11px] text-muted">
            Miembro desde {formatDate(profile.createdAt)}.
          </p>
        </section>

        <div className="rounded-2xl border border-border bg-surface p-4 text-center text-xs text-muted">
          El Riot ID y los contactos solo se muestran después de una conexión.
        </div>
      </div>
    </AppShell>
  );
}
