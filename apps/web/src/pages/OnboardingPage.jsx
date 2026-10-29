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
import BetaBadge from '../components/BetaBadge.jsx';
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
  fill: 'Comodín',
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
  early: '00–06',
  morning: '06–12',
  afternoon: '12–18',
  night: '18–24',
};
const WEEKDAY_NIGHTS = ['mon_night', 'tue_night', 'wed_night', 'thu_night', 'fri_night'];
const WEEKEND_BLOCKS = ['sat_afternoon', 'sat_night', 'sun_afternoon', 'sun_night'];

const APEX_TIERS = ['master', 'grandmaster', 'challenger'];
const RIOT_ID_REGEX = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,14}[\p{L}\p{N}]#[A-Za-z0-9]{3,5}$/u;

const STEPS = ['Riot ID', 'Roles', 'Rango', 'Horarios', 'Estilo', 'Contacto', 'Resumen'];

const initialForm = {
  riotId: '',
  country: '',
  primaryRole: '',
  secondaryRole: '',
  rankTier: '',
  rankDivision: '',
  rankLp: '',
  flexRankTier: '',
  flexRankDivision: '',
  flexRankLp: '',
  playStyle: '',
  languages: [],
  hasMic: false,
  scheduleBlocks: [],
  bio: '',
  discordTag: '',
};

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

const choiceClass = (selected) =>
  `rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
    selected
      ? 'border-accent bg-accent/15 text-accent'
      : 'border-border bg-bg text-muted hover:border-accent/50'
  }`;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveReady, setSaveReady] = useState(false);
  const [error, setError] = useState('');
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await api.get('/v1/profiles/me');
        if (!active || !res.data.profile) return;

        const profile = res.data.profile;
        setForm({
          riotId: profile.riotId || '',
          country: profile.country || '',
          primaryRole: profile.primaryRole || '',
          secondaryRole: profile.secondaryRole || '',
          rankTier: profile.rankTier || '',
          rankDivision: profile.rankDivision || '',
          rankLp: profile.rankLp ?? '',
          flexRankTier: profile.flexRankTier || '',
          flexRankDivision: profile.flexRankDivision || '',
          flexRankLp: profile.flexRankLp ?? '',
          playStyle: profile.playStyle || '',
          languages: profile.languages || [],
          hasMic: Boolean(profile.hasMic),
          scheduleBlocks: profile.scheduleBlocks || [],
          bio: profile.bio || '',
          discordTag: profile.discordTag || '',
        });
      } catch (_error) {
        // Si todavía no hay perfil, el formulario arranca vacío.
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (step !== STEPS.length - 1) {
      setSaveReady(false);
      return undefined;
    }

    const timer = setTimeout(() => setSaveReady(true), 700);
    return () => clearTimeout(timer);
  }, [step]);

  const isApex = APEX_TIERS.includes(form.rankTier);
  const flexIsApex = APEX_TIERS.includes(form.flexRankTier);

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

  const setFlexRankTier = (tier) => {
    setForm((current) => ({
      ...current,
      flexRankTier: tier,
      flexRankDivision: !tier || APEX_TIERS.includes(tier) ? '' : current.flexRankDivision,
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

  const clearSchedule = () => {
    setForm((current) => ({ ...current, scheduleBlocks: [] }));
  };

  const canContinue = () => {
    if (step === 0) return RIOT_ID_REGEX.test(form.riotId.trim());
    if (step === 1) {
      return (
        Boolean(form.primaryRole) &&
        Boolean(form.secondaryRole) &&
        (form.primaryRole !== form.secondaryRole || form.primaryRole === 'fill')
      );
    }
    if (step === 2) {
      return (
        Boolean(form.rankTier) &&
        (isApex || Boolean(form.rankDivision)) &&
        (!form.flexRankTier || flexIsApex || Boolean(form.flexRankDivision))
      );
    }
    if (step === 3) return form.scheduleBlocks.length > 0;
    if (step === 4) return Boolean(form.playStyle) && form.languages.length > 0;
    return true;
  };

  const goNext = () => {
    if (!canContinue()) {
      setError('Completá este paso antes de continuar.');
      return;
    }
    setError('');
    setStep((current) => current + 1);
  };

  const goBack = () => {
    setError('');
    setStep((current) => Math.max(0, current - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (step !== STEPS.length - 1) {
      goNext();
      return;
    }

    if (!saveReady) return;

    if (!canContinue()) {
      setError('Completá este paso antes de continuar.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      riotId: form.riotId.trim(),
      country: form.country || null,
      primaryRole: form.primaryRole,
      secondaryRole: form.secondaryRole,
      rankTier: form.rankTier,
      rankDivision: isApex ? null : form.rankDivision,
      rankLp: form.rankLp === '' ? null : Number(form.rankLp),
      flexRankTier: form.flexRankTier || null,
      flexRankDivision: flexIsApex ? null : form.flexRankDivision || null,
      flexRankLp: form.flexRankLp === '' ? null : Number(form.flexRankLp),
      playStyle: form.playStyle,
      languages: form.languages,
      hasMic: form.hasMic,
      scheduleBlocks: form.scheduleBlocks,
      bio: form.bio.trim() || null,
      discordTag: form.discordTag.trim() || null,
    };

    try {
      await api.patch('/v1/profiles/me', payload);
      await refreshUser();
      toast.success('Perfil guardado. Ya podés empezar a buscar duo.');
      navigate('/inicio', { replace: true });
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg px-5 py-8 text-text">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            Duo<span className="text-accent">LAS</span>
            <BetaBadge />
          </span>
          <span className="text-xs font-semibold text-muted">
            Paso {step + 1} de {STEPS.length}
          </span>
        </header>

        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <EmailVerificationBanner />

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {STEPS[step]}
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <div className="mt-5">
            {step === 0 ? (
              <div className="space-y-5">
                <h1 className="text-2xl font-bold">Tu cuenta de League of Legends</h1>
                <p className="text-sm leading-relaxed text-muted">
                  Usá tu Riot ID actual con el formato Nombre#TAG. No es tu nombre de usuario de Duo
                  LAS. El servidor es LAS y no se puede cambiar en el MVP.
                </p>
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
                </label>
                <div className="rounded-xl border border-border bg-bg px-4 py-3 text-sm">
                  <span className="text-muted">Servidor: </span>
                  <span className="font-semibold">LAS</span>
                </div>
                <p className="text-xs text-muted">
                  Tu Riot ID y tu Discord se revelan solo después de una conexión.
                </p>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Tus roles</h1>
                  <p className="mt-2 text-sm text-muted">
                    Elegí tu rol principal y uno secundario. Podés marcar Comodín si jugás todas las
                    líneas.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Rol principal</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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

                {form.primaryRole &&
                form.primaryRole === form.secondaryRole &&
                form.primaryRole !== 'fill' ? (
                  <p className="text-sm text-danger">
                    El rol principal y el secundario tienen que ser distintos.
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold">Tu rango</h1>
                  <p className="mt-2 text-sm text-muted">
                    El rango es declarado. Más adelante se podrá verificar con Riot.
                  </p>
                </div>

                <div>
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
                  <div>
                    <p className="mb-2 text-sm font-semibold">División</p>
                    <div className="grid grid-cols-4 gap-2">
                      {RANK_DIVISIONS.map((division) => (
                        <button
                          key={division}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({ ...current, rankDivision: division }))
                          }
                          className={choiceClass(form.rankDivision === division)}
                        >
                          {DIVISION_LABELS[division]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <label className="block text-sm font-semibold">
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

                <div className="rounded-2xl border border-border bg-bg p-4">
                  <p className="text-sm font-semibold">Rango Flex (opcional)</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Si jugás Flex, declaralo acá. El match de Flex usa este rango y no el de
                    Solo/Dúo.
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">
                      Tier Flex
                      <select
                        value={form.flexRankTier}
                        onChange={(event) => setFlexRankTier(event.target.value)}
                        className={`${inputClass} mt-2`}
                      >
                        <option value="">Sin declarar</option>
                        {RANK_TIERS.map((tier) => (
                          <option key={tier} value={tier}>
                            {RANK_LABELS[tier]}
                          </option>
                        ))}
                      </select>
                    </label>

                    {form.flexRankTier && !flexIsApex ? (
                      <label className="block text-sm font-semibold">
                        División Flex
                        <select
                          value={form.flexRankDivision}
                          onChange={setField('flexRankDivision')}
                          className={`${inputClass} mt-2`}
                        >
                          <option value="">Elegí una división</option>
                          {RANK_DIVISIONS.map((division) => (
                            <option key={division} value={division}>
                              {DIVISION_LABELS[division]}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>

                  {form.flexRankTier ? (
                    <label className="mt-3 block text-sm font-semibold">
                      LP Flex (opcional)
                      <input
                        type="number"
                        min="0"
                        className={`${inputClass} mt-2`}
                        value={form.flexRankLp}
                        onChange={setField('flexRankLp')}
                        placeholder="0"
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold">Tus horarios</h1>
                  <p className="mt-2 text-sm text-muted">
                    Tocá los momentos en los que normalmente podés jugar. Todos los horarios están
                    en hora Argentina.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-bg p-4">
                  <label className="block text-sm font-semibold" htmlFor="profile-country">
                    País de residencia (opcional)
                  </label>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Lo usamos para mostrarte los horarios en tu hora local. Los bloques siempre se
                    guardan en ART.
                  </p>
                  <select
                    id="profile-country"
                    value={form.country}
                    onChange={setField('country')}
                    className="mt-3 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
                  >
                    <option value="">Sin especificar</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {COUNTRY_LABELS[country]}
                      </option>
                    ))}
                  </select>

                  {form.country && getCountryOffsetMinutes(form.country) !== 0 ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                      En {COUNTRY_LABELS[form.country]}, los bloques se ven así: madrugada{' '}
                      {formatBlockRange('early', form.country)}, mañana{' '}
                      {formatBlockRange('morning', form.country)}, tarde{' '}
                      {formatBlockRange('afternoon', form.country)}, noche{' '}
                      {formatBlockRange('night', form.country)}.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-border bg-bg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Atajos</p>
                      <p className="text-xs text-muted">
                        Sumá tus horarios habituales y después ajustá día por día.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                          onClick={clearSchedule}
                          className="inline-flex min-h-11 items-center rounded-full px-2 text-xs font-semibold text-danger"
                        >
                          Limpiar
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted">
                    {form.scheduleBlocks.length === 0
                      ? 'Todavía no elegiste horarios.'
                      : `${form.scheduleBlocks.length} bloque${
                          form.scheduleBlocks.length === 1 ? '' : 's'
                        } seleccionado${form.scheduleBlocks.length === 1 ? '' : 's'}.`}
                  </p>
                </div>

                <div className="space-y-2">
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
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Cómo jugás</h1>
                  <p className="mt-2 text-sm text-muted">
                    Esto nos ayuda a mostrarte duos compatibles.
                  </p>
                </div>

                <div>
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

                <div>
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

                <div>
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
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold">¿Cómo te contactan?</h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    El Discord se revela solo después de una conexión. Si no lo agregás, tus matches
                    solo van a poder contactarte por Riot ID.
                  </p>
                </div>

                <label className="block text-sm font-semibold">
                  Bio (opcional)
                  <textarea
                    className={`${inputClass} mt-2 min-h-[100px] resize-y`}
                    value={form.bio}
                    onChange={setField('bio')}
                    maxLength={280}
                    placeholder="Contá cómo jugás, qué buscás y en qué horarios."
                  />
                  <span className="mt-1 block text-right text-xs text-muted">
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
                </label>

                <p className="rounded-xl border border-border bg-bg px-4 py-3 text-xs leading-relaxed text-muted">
                  Poné solo el nombre de usuario, sin @. No se muestra en tu perfil público: se
                  revela únicamente cuando hay una conexión.
                </p>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold">Revisá tu perfil</h1>
                  <p className="mt-2 text-sm text-muted">
                    Así va a quedar tu perfil para el match. Podés editarlo cuando quieras.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-bg p-4 text-sm">
                  <p className="font-semibold">Resumen</p>
                  <ul className="mt-3 space-y-2 text-muted">
                    <li>
                      <span className="text-text">Riot ID:</span> {form.riotId || '-'}
                    </li>
                    <li>
                      <span className="text-text">País:</span>{' '}
                      {form.country ? COUNTRY_LABELS[form.country] : 'Sin especificar'}
                    </li>
                    <li>
                      <span className="text-text">Roles:</span>{' '}
                      {form.primaryRole
                        ? `${ROLE_LABELS[form.primaryRole]} / ${
                            form.secondaryRole ? ROLE_LABELS[form.secondaryRole] : '-'
                          }`
                        : '-'}
                    </li>
                    <li>
                      <span className="text-text">Rango Solo/Dúo:</span>{' '}
                      {form.rankTier
                        ? `${RANK_LABELS[form.rankTier]}${
                            form.rankDivision ? ` ${DIVISION_LABELS[form.rankDivision]}` : ''
                          }`
                        : '-'}
                    </li>
                    <li>
                      <span className="text-text">Rango Flex:</span>{' '}
                      {form.flexRankTier
                        ? `${RANK_LABELS[form.flexRankTier]}${
                            form.flexRankDivision
                              ? ` ${DIVISION_LABELS[form.flexRankDivision]}`
                              : ''
                          }`
                        : 'Sin declarar'}
                    </li>
                    <li>
                      <span className="text-text">Horarios:</span> {form.scheduleBlocks.length}{' '}
                      bloque{form.scheduleBlocks.length === 1 ? '' : 's'}
                    </li>
                    <li>
                      <span className="text-text">Estilo:</span>{' '}
                      {form.playStyle ? STYLE_LABELS[form.playStyle] : '-'}
                    </li>
                    <li>
                      <span className="text-text">Idiomas:</span>{' '}
                      {form.languages.map((language) => LANGUAGE_LABELS[language]).join(', ') ||
                        '-'}
                    </li>
                    <li>
                      <span className="text-text">Micrófono:</span> {form.hasMic ? 'Sí' : 'No'}
                    </li>
                    <li>
                      <span className="text-text">Discord:</span>{' '}
                      {form.discordTag.trim() || 'Sin especificar'}
                    </li>
                  </ul>
                </div>

                {!form.discordTag.trim() ? (
                  <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-gold">
                    No agregaste Discord. Si querés, volvé atrás y completalo para que tus matches
                    tengan otra forma de contactarte.
                  </p>
                ) : null}

                <p className="text-xs text-muted">
                  Al guardar, tu perfil queda visible para otros jugadores de LAS.
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted"
              >
                Atrás
              </button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-bg"
              >
                Continuar
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !saveReady}
                className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-bg disabled:opacity-60"
              >
                {submitting ? 'Guardando...' : 'Guardar perfil'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
