import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  COUNTRIES,
  LANGUAGES,
  PLAY_STYLES,
  RANK_DIVISIONS,
  RANK_TIERS,
  ROLES,
  SCHEDULE_BLOCKS,
  SCHEDULE_DAYS,
} from '@duo-las/shared/constants';
import { Pencil } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import RankIcon from '../components/RankIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import { COUNTRY_LABELS } from '../utils/labels.js';
import { formatBlockRange, getCountryOffsetMinutes } from '../utils/time.js';

const ROLE_LABELS = {
  top: 'Top',
  jungle: 'Jungla',
  mid: 'Mid',
  adc: 'ADC',
  support: 'Support',
};

const RANK_LABELS = {
  iron: 'Hierro',
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
  platinum: 'Platino',
  emerald: 'Esmeralda',
  diamond: 'Diamante',
  master: 'Maestro',
  grandmaster: 'Gran Maestro',
  challenger: 'Challenger',
};

const DIVISION_LABELS = { iv: 'IV', iii: 'III', ii: 'II', i: 'I' };
const STYLE_LABELS = { casual: 'Casual', ranked: 'Ranked en serio', tryhard: 'Tryhard' };
const LANGUAGE_LABELS = { es: 'Español', en: 'Inglés', pt: 'Portugués' };
const DAY_LABELS = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
};
const BLOCK_LABELS = {
  early: 'Madrugada',
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche',
};
const BLOCK_HOURS = {
  early: '00-06',
  morning: '06-12',
  afternoon: '12-18',
  night: '18-24',
};
const WEEKDAY_NIGHTS = ['mon_night', 'tue_night', 'wed_night', 'thu_night', 'fri_night'];
const WEEKEND_BLOCKS = ['sat_afternoon', 'sat_night', 'sun_afternoon', 'sun_night'];
const APEX_TIERS = ['master', 'grandmaster', 'challenger'];
const RIOT_ID_REGEX = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,14}[\p{L}\p{N}]#[A-Za-z0-9]{3,5}$/u;

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

const choiceClass = (selected) =>
  `rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
    selected
      ? 'border-accent bg-accent/15 text-accent'
      : 'border-border bg-bg text-muted hover:border-accent/50'
  }`;

const emptyForm = {
  riotId: '',
  country: '',
  primaryRole: '',
  secondaryRole: '',
  rankTier: '',
  rankDivision: '',
  rankLp: '',
  playStyle: '',
  languages: [],
  hasMic: false,
  scheduleBlocks: [],
  bio: '',
  discordTag: '',
};

export default function ProfilePage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await api.get('/v1/profiles/me');

        if (!active) return;

        if (!res.data.profile) {
          navigate('/onboarding', { replace: true });
          return;
        }

        const profile = res.data.profile;
        setForm({
          riotId: profile.riotId || '',
          country: profile.country || '',
          primaryRole: profile.primaryRole || '',
          secondaryRole: profile.secondaryRole || '',
          rankTier: profile.rankTier || '',
          rankDivision: profile.rankDivision || '',
          rankLp: profile.rankLp ?? '',
          playStyle: profile.playStyle || '',
          languages: profile.languages || [],
          hasMic: Boolean(profile.hasMic),
          scheduleBlocks: profile.scheduleBlocks || [],
          bio: profile.bio || '',
          discordTag: profile.discordTag || '',
        });
      } catch (_error) {
        setError('No pudimos cargar tu perfil. Probá recargar la página.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [navigate]);

  const isApex = APEX_TIERS.includes(form.rankTier);

  const setField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setRankTier = (tier) => {
    setForm((current) => ({
      ...current,
      rankTier: tier,
      rankDivision: APEX_TIERS.includes(tier) ? '' : current.rankDivision,
    }));
  };

  const toggleValue = (field, value) => {
    setForm((current) => {
      const values = current[field];
      const exists = values.includes(value);
      return {
        ...current,
        [field]: exists ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  };

  const mergeScheduleBlocks = (blocks) => {
    setForm((current) => ({
      ...current,
      scheduleBlocks: [...new Set([...current.scheduleBlocks, ...blocks])],
    }));
  };

  const validate = () => {
    if (!RIOT_ID_REGEX.test(form.riotId.trim())) {
      return 'Ingresá un Riot ID válido con el formato Nombre#TAG.';
    }
    if (!form.primaryRole || !form.secondaryRole) {
      return 'Elegí tu rol principal y secundario.';
    }
    if (form.primaryRole === form.secondaryRole) {
      return 'El rol principal y el secundario tienen que ser distintos.';
    }
    if (!form.rankTier || (!isApex && !form.rankDivision)) {
      return 'Completá tu rango.';
    }
    if (!form.scheduleBlocks.length) {
      return 'Elegí al menos un bloque horario.';
    }
    if (!form.playStyle) {
      return 'Elegí tu estilo de juego.';
    }
    if (!form.languages.length) {
      return 'Elegí al menos un idioma.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.patch('/v1/profiles/me', {
        riotId: form.riotId.trim(),
        country: form.country || null,
        primaryRole: form.primaryRole,
        secondaryRole: form.secondaryRole,
        rankTier: form.rankTier,
        rankDivision: isApex ? null : form.rankDivision,
        rankLp: form.rankLp === '' ? null : Number(form.rankLp),
        playStyle: form.playStyle,
        languages: form.languages,
        hasMic: form.hasMic,
        scheduleBlocks: form.scheduleBlocks,
        bio: form.bio.trim() || null,
        discordTag: form.discordTag.trim() || null,
      });

      await refreshUser();
      toast.success('Perfil actualizado.');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'No pudimos guardar tu perfil. Intentá de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell maxWidth="max-w-4xl">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell maxWidth="max-w-4xl">
      <div className="space-y-5">
        <EmailVerificationBanner />

        <header className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Mi perfil</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">Editá tu perfil</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Actualizá tus datos cuando quieras. Tu username y email no se pueden cambiar en el
                MVP.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg px-4 py-3 text-xs text-muted">
              <span className="font-semibold text-text">@{user?.username}</span>
              <br />
              {user?.email}
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Pencil size={18} className="text-accent" aria-hidden="true" />
              <h2 className="text-lg font-bold">Identidad</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Riot ID
                <input
                  className={`${inputClass} mt-2`}
                  value={form.riotId}
                  onChange={setField('riotId')}
                  placeholder="Faker#LAS"
                  maxLength={22}
                  required
                />
                <span className="mt-1 block text-xs font-normal text-muted">
                  Formato Nombre#TAG. Es tu Riot ID actual, no tu username de Duo LAS.
                </span>
              </label>

              <label className="block text-sm font-semibold">
                País de residencia (opcional)
                <select
                  value={form.country}
                  onChange={setField('country')}
                  className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm text-text"
                >
                  <option value="">Sin especificar</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {COUNTRY_LABELS[country]}
                    </option>
                  ))}
                </select>
                {form.country && getCountryOffsetMinutes(form.country) !== 0 ? (
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Los horarios se muestran en tu hora local; se guardan en ART.
                  </span>
                ) : null}
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Roles y rango</h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">Rol principal</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, primaryRole: role }))}
                      className={choiceClass(form.primaryRole === role)}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Rol secundario</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, secondaryRole: role }))}
                      className={choiceClass(form.secondaryRole === role)}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {form.primaryRole && form.primaryRole === form.secondaryRole ? (
              <p className="mt-3 text-sm text-danger">
                El rol principal y el secundario tienen que ser distintos.
              </p>
            ) : null}

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Tier</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {RANK_TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setRankTier(tier)}
                    aria-pressed={form.rankTier === tier}
                    className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-semibold transition ${
                      form.rankTier === tier
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted hover:border-accent/50 hover:text-text'
                    }`}
                  >
                    <RankIcon tier={tier} size={34} />
                    <span className="text-center leading-tight">{RANK_LABELS[tier]}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.rankTier && !isApex ? (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold">División</p>
                <div className="grid grid-cols-4 gap-2">
                  {RANK_DIVISIONS.map((division) => (
                    <button
                      key={division}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, rankDivision: division }))}
                      className={choiceClass(form.rankDivision === division)}
                    >
                      {DIVISION_LABELS[division]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="mt-5 block text-sm font-semibold">
              LP (opcional)
              <input
                type="number"
                min="0"
                className={`${inputClass} mt-2`}
                value={form.rankLp}
                onChange={setField('rankLp')}
                placeholder="0"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Horarios</h2>
            <p className="mt-2 text-sm text-muted">
              Marcá los bloques en los que normalmente podés jugar. Se guardan en hora Argentina.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => mergeScheduleBlocks(WEEKDAY_NIGHTS)}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-3 text-xs font-semibold text-muted transition hover:border-accent/50 hover:text-text"
              >
                Lun a Vie · noche
              </button>
              <button
                type="button"
                onClick={() => mergeScheduleBlocks(WEEKEND_BLOCKS)}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-3 text-xs font-semibold text-muted transition hover:border-accent/50 hover:text-text"
              >
                Sáb y Dom · tarde/noche
              </button>
              {form.scheduleBlocks.length ? (
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, scheduleBlocks: [] }))}
                  className="inline-flex min-h-11 items-center rounded-full px-2 text-xs font-semibold text-danger"
                >
                  Limpiar
                </button>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-muted">
              {form.scheduleBlocks.length
                ? `${form.scheduleBlocks.length} bloque${
                    form.scheduleBlocks.length === 1 ? '' : 's'
                  } seleccionado${form.scheduleBlocks.length === 1 ? '' : 's'}.`
                : 'Todavía no elegiste horarios.'}
            </p>

            <div className="mt-4 space-y-2">
              {SCHEDULE_DAYS.map((day) => {
                const selectedCount = SCHEDULE_BLOCKS.filter((block) =>
                  form.scheduleBlocks.includes(`${day}_${block}`)
                ).length;

                return (
                  <div key={day} className="rounded-2xl border border-border bg-bg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{DAY_LABELS[day]}</p>
                      <span
                        className={`text-[11px] font-semibold ${
                          selectedCount ? 'text-accent' : 'text-muted'
                        }`}
                      >
                        {selectedCount
                          ? `${selectedCount} bloque${selectedCount === 1 ? '' : 's'}`
                          : 'Sin horario'}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {SCHEDULE_BLOCKS.map((block) => {
                        const value = `${day}_${block}`;
                        const selected = form.scheduleBlocks.includes(value);

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleValue('scheduleBlocks', value)}
                            aria-pressed={selected}
                            aria-label={`${DAY_LABELS[day]}, ${BLOCK_LABELS[block]} (${BLOCK_HOURS[block]})`}
                            className={`flex min-h-11 flex-col items-center justify-center rounded-xl border px-1 py-1.5 text-[11px] font-semibold transition ${
                              selected
                                ? 'border-accent bg-accent text-bg'
                                : 'border-border text-muted hover:border-accent/50 hover:text-text'
                            }`}
                          >
                            <span>{BLOCK_LABELS[block]}</span>
                            <span
                              className={`text-[10px] font-medium ${
                                selected ? 'text-bg/75' : 'text-muted/70'
                              }`}
                            >
                              {BLOCK_HOURS[block]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {form.country && getCountryOffsetMinutes(form.country) !== 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                En {COUNTRY_LABELS[form.country]}: madrugada{' '}
                {formatBlockRange('early', form.country)}, mañana{' '}
                {formatBlockRange('morning', form.country)}, tarde{' '}
                {formatBlockRange('afternoon', form.country)}, noche{' '}
                {formatBlockRange('night', form.country)}.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Estilo y contacto</h2>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Estilo</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PLAY_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, playStyle: style }))}
                    className={choiceClass(form.playStyle === style)}
                  >
                    {STYLE_LABELS[style]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Idiomas</p>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => toggleValue('languages', language)}
                    className={choiceClass(form.languages.includes(language))}
                  >
                    {LANGUAGE_LABELS[language]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Micrófono</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, hasMic: true }))}
                  className={choiceClass(form.hasMic)}
                >
                  Sí, tengo mic
                </button>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, hasMic: false }))}
                  className={choiceClass(!form.hasMic)}
                >
                  No tengo mic
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Bio (opcional)
                <textarea
                  className={`${inputClass} mt-2 min-h-[100px] resize-y`}
                  value={form.bio}
                  onChange={setField('bio')}
                  maxLength={280}
                  placeholder="Contá cómo jugás, qué buscás y en qué horarios."
                />
                <span className="mt-1 block text-right text-xs font-normal text-muted">
                  {form.bio.length}/280
                </span>
              </label>

              <label className="block text-sm font-semibold">
                Discord (recomendado)
                <input
                  className={`${inputClass} mt-2`}
                  value={form.discordTag}
                  onChange={setField('discordTag')}
                  maxLength={32}
                  placeholder="usuario"
                />
                <span className="mt-1 block text-xs font-normal text-muted">
                  Solo cuando hay match. Sin Discord, tus matches solo ven tu Riot ID.
                </span>
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => navigate('/inicio')}
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted"
            >
              Volver al inicio
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-bg disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
