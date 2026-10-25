import {
  DUO_WEIGHTS,
  NOW_WEIGHTS,
  POST_WEIGHTS,
  RANK_TOLERANCE,
  STYLE_MATRIX,
} from '../../config/matching.js';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const rolesOf = (profile) => [profile?.primaryRole, profile?.secondaryRole].filter(Boolean);

export const areRolesComplementary = (a, b) => {
  const aRoles = rolesOf(a);
  const bRoles = rolesOf(b);
  return aRoles.some((aRole) => bRoles.some((bRole) => aRole !== bRole));
};

export const orderedPair = (a, b) => (a < b ? [a, b] : [b, a]);

export const maxRankDistance = (queue = 'solo_duo') =>
  RANK_TOLERANCE[queue] ?? RANK_TOLERANCE.solo_duo;

export const rankDistance = (a, b) => {
  const distance = Math.abs(Number(a?.rankIndex) - Number(b?.rankIndex));
  return Number.isFinite(distance) ? distance : Infinity;
};

export const isRankCompatible = (a, b, queue = 'solo_duo') =>
  rankDistance(a, b) <= maxRankDistance(queue);

export const scheduleOverlap = (a, b) => {
  const aBlocks = a?.scheduleBlocks || [];
  const bBlocks = b?.scheduleBlocks || [];

  if (!aBlocks.length || !bBlocks.length) {
    return { count: 0, ratio: 0 };
  }

  const bSet = new Set(bBlocks);
  const count = aBlocks.filter((block) => bSet.has(block)).length;
  const ratio = count / Math.min(aBlocks.length, bBlocks.length);

  return { count, ratio: clamp(ratio) };
};

export const styleScore = (a, b) => {
  const row = STYLE_MATRIX[a?.playStyle];
  return row?.[b?.playStyle] ?? 0;
};

export const languageScore = (a, b) => {
  const aLanguages = a?.languages || [];
  const bLanguages = b?.languages || [];

  if (!aLanguages.length || !bLanguages.length) return 0;
  if (aLanguages[0] === bLanguages[0]) return 1;

  return aLanguages.some((language) => bLanguages.includes(language)) ? 0.6 : 0;
};

export const micScore = (a, b) => (a?.hasMic === b?.hasMic ? 1 : 0);

export const rankProximity = (a, b, queue = 'solo_duo') => {
  const max = maxRankDistance(queue);
  if (!max) return 0;
  const distance = rankDistance(a, b);
  if (!Number.isFinite(distance)) return 0;
  return clamp(1 - distance / max);
};

export const roleFit = (a, b) => {
  if (!areRolesComplementary(a, b)) return 0;
  return a?.primaryRole !== b?.primaryRole ? 1 : 0.6;
};

const sumComponents = (components) =>
  Math.min(
    100,
    Object.values(components).reduce((sum, value) => sum + value, 0)
  );

const buildDuoReasons = (a, b, { overlap, style, language, roles, mic, distance }) => {
  const reasons = [];

  if (overlap.count > 0) {
    reasons.push(`Coinciden ${overlap.count} horario${overlap.count === 1 ? '' : 's'}`);
  }
  if (style >= 1) reasons.push('Mismo estilo');
  else if (style >= 0.6) reasons.push('Estilos compatibles');
  if (language >= 1) reasons.push('Comparten idioma principal');
  else if (language > 0) reasons.push('Comparten idioma');
  if (roles >= 1) reasons.push('Roles complementarios');
  if (mic === 1) reasons.push(a?.hasMic ? 'Ambos con micrófono' : 'Ambos sin micrófono');
  if (distance <= 1) reasons.push('Rango muy cercano');

  return reasons.slice(0, 4);
};

export const computeDuoScore = (a, b, { queue = 'solo_duo' } = {}) => {
  const overlap = scheduleOverlap(a, b);
  const style = styleScore(a, b);
  const language = languageScore(a, b);
  const roles = roleFit(a, b);
  const mic = micScore(a, b);
  const distance = rankDistance(a, b);

  const breakdown = {
    schedule: Math.round(DUO_WEIGHTS.schedule * overlap.ratio),
    style: Math.round(DUO_WEIGHTS.style * style),
    language: Math.round(DUO_WEIGHTS.language * language),
    roles: Math.round(DUO_WEIGHTS.roles * roles),
    mic: Math.round(DUO_WEIGHTS.mic * mic),
    rank: Math.round(DUO_WEIGHTS.rank * rankProximity(a, b, queue)),
  };

  return {
    score: sumComponents(breakdown),
    breakdown,
    reasons: buildDuoReasons(a, b, { overlap, style, language, roles, mic, distance }),
  };
};

export const computeNowScore = (a, b, { queue = 'solo_duo' } = {}) => {
  const style = styleScore(a, b);
  const language = languageScore(a, b);
  const mic = micScore(a, b);
  const reputation = clamp((b?.reputationScore ?? 50) / 100);

  const breakdown = {
    rank: Math.round(NOW_WEIGHTS.rank * rankProximity(a, b, queue)),
    style: Math.round(NOW_WEIGHTS.style * style),
    language: Math.round(NOW_WEIGHTS.language * language),
    mic: Math.round(NOW_WEIGHTS.mic * mic),
    reputation: Math.round(NOW_WEIGHTS.reputation * reputation),
  };

  return {
    score: sumComponents(breakdown),
    breakdown,
  };
};

export const computePostFitScore = (applicant, post, owner) => {
  const minIndex = Number(post?.rankMinIndex ?? 0);
  const maxIndex = Number(post?.rankMaxIndex ?? 36);
  const midpoint = (minIndex + maxIndex) / 2;
  const halfRange = Math.max(1, (maxIndex - minIndex) / 2);
  const applicantIndex = Number(applicant?.rankIndex);

  const rankFit = Number.isFinite(applicantIndex)
    ? clamp(1 - Math.abs(applicantIndex - midpoint) / halfRange)
    : 0;

  const rolesNeeded = post?.rolesNeeded || [];
  const roleScore = rolesNeeded.includes(applicant?.primaryRole)
    ? 1
    : rolesNeeded.includes(applicant?.secondaryRole)
      ? 0.6
      : 0;

  const breakdown = {
    rank: Math.round(POST_WEIGHTS.rank * rankFit),
    roles: Math.round(POST_WEIGHTS.roles * roleScore),
    style: Math.round(POST_WEIGHTS.style * styleScore(applicant, owner)),
    language: Math.round(POST_WEIGHTS.language * languageScore(applicant, owner)),
  };

  return {
    score: sumComponents(breakdown),
    breakdown,
  };
};
