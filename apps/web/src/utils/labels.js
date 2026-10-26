export const ROLE_LABELS = {
  top: 'Top',
  jungle: 'Jungla',
  mid: 'Mid',
  adc: 'ADC',
  support: 'Support',
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

export const formatRank = (profile) => {
  const tier = RANK_LABELS[profile?.rankTier];
  if (!tier) return 'Sin rango';

  const division = DIVISION_LABELS[profile?.rankDivision];
  return division ? `${tier} ${division}` : tier;
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
