export const ROLE_LABELS = {
  top: 'Top',
  jungle: 'Jungla',
  mid: 'Mid',
  adc: 'ADC',
  support: 'Support',
  fill: 'Comodín',
};

export const RANK_LABELS = {
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

export const DIVISION_LABELS = {
  iv: 'IV',
  iii: 'III',
  ii: 'II',
  i: 'I',
};

export const STYLE_LABELS = {
  casual: 'Casual',
  ranked: 'Ranked en serio',
  tryhard: 'Tryhard',
};

export const LANGUAGE_LABELS = {
  es: 'Español',
  en: 'Inglés',
  pt: 'Portugués',
};

export const COUNTRY_LABELS = {
  AR: 'Argentina',
  CL: 'Chile',
  BO: 'Bolivia',
  PY: 'Paraguay',
  UY: 'Uruguay',
  PE: 'Perú',
};

export const QUEUE_LABELS = {
  solo_duo: 'Solo/Dúo',
  flex: 'Flex',
};

export const FEEDBACK_TAG_LABELS = {
  good_vibes: 'Buena onda',
  communicative: 'Comunicativo',
  tryhard: 'Tryhard',
  punctual: 'Puntual',
  good_game: 'Jugó bien',
  toxicity: 'Toxicidad',
  abandonment: 'Abandonó',
  fake_rank: 'Rango falso',
  no_communication: 'Sin comunicación',
  other: 'Otro',
};

export const REPORT_REASON_LABELS = {
  toxicity: 'Toxicidad',
  fake_rank: 'Rango falso',
  abandonment: 'Abandono',
  spam: 'Spam',
  underage: 'Menor de edad',
  other: 'Otro',
};

export const REPORT_STATUS_LABELS = {
  open: 'Abierto',
  reviewing: 'En revisión',
  resolved: 'Resuelto',
  dismissed: 'Descartado',
};

export const USER_STATUS_LABELS = {
  active: 'Activo',
  suspended: 'Suspendido',
  deleted: 'Eliminado',
};

const formatRankValue = (tierValue, divisionValue) => {
  const tier = RANK_LABELS[tierValue];
  if (!tier) return null;

  const division = DIVISION_LABELS[divisionValue];
  return division ? `${tier} ${division}` : tier;
};

export const rankTierForQueue = (profile, queue = 'solo_duo') =>
  queue === 'flex' && profile?.flexRankTier ? profile.flexRankTier : profile?.rankTier;

export const formatRank = (profile, queue) => {
  const soloRank = formatRankValue(profile?.rankTier, profile?.rankDivision);
  const flexRank = formatRankValue(profile?.flexRankTier, profile?.flexRankDivision);
  const resolvedSolo = soloRank || 'Sin rango';

  if (queue === 'flex') {
    return flexRank || `${resolvedSolo} (Flex sin declarar)`;
  }

  if (queue === 'solo_duo') return resolvedSolo;

  return flexRank ? `${resolvedSolo} · Flex ${flexRank}` : resolvedSolo;
};

export const formatRoles = (profile) => {
  const primary = ROLE_LABELS[profile?.primaryRole];
  const secondary = ROLE_LABELS[profile?.secondaryRole];
  if (!primary) return 'Sin roles';
  return secondary ? `${primary} / ${secondary}` : primary;
};

export const initialsOf = (username) => {
  const value = (username || '??').trim();
  const parts = value.split(/[_\s-]+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
};
