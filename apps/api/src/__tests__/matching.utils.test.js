import { describe, expect, it } from 'vitest';
import { DUO_WEIGHTS, NOW_WEIGHTS, POST_WEIGHTS, RANK_TOLERANCE } from '../config/matching.js';
import {
  areRolesComplementary,
  canPlayRole,
  computeDuoScore,
  computeNowScore,
  computePostFitScore,
  isRankCompatible,
  languageScore,
  maxRankDistance,
  orderedPair,
  rankDistance,
  rankIndexForQueue,
  rolesOf,
  scheduleOverlap,
} from '../modules/matching/matching.utils.js';

const viewer = {
  rankIndex: 26,
  primaryRole: 'mid',
  secondaryRole: 'jungle',
  scheduleBlocks: [
    'mon_early',
    'mon_morning',
    'mon_afternoon',
    'mon_night',
    'tue_night',
    'wed_night',
  ],
  playStyle: 'casual',
  languages: ['es'],
  hasMic: true,
  reputationScore: 50,
};

const target = {
  rankIndex: 24,
  primaryRole: 'jungle',
  secondaryRole: 'top',
  scheduleBlocks: ['mon_night', 'tue_night', 'wed_night', 'thu_night'],
  playStyle: 'ranked',
  languages: ['es', 'en'],
  hasMic: true,
  reputationScore: 70,
};

describe('Matching utils', () => {
  it('los pesos suman 100', () => {
    expect(Object.values(DUO_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(Object.values(NOW_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(Object.values(POST_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it('calcula distancia y compatibilidad de rango', () => {
    expect(rankDistance(viewer, target)).toBe(2);
    expect(maxRankDistance('solo_duo')).toBe(RANK_TOLERANCE.solo_duo);
    expect(maxRankDistance('flex')).toBe(RANK_TOLERANCE.flex);
    expect(isRankCompatible(viewer, target, 'solo_duo')).toBe(true);
    expect(isRankCompatible({ rankIndex: 26 }, { rankIndex: 0 }, 'solo_duo')).toBe(false);
  });

  it('detecta roles complementarios y no complementarios', () => {
    expect(rolesOf(viewer)).toEqual(['mid', 'jungle']);
    expect(areRolesComplementary(viewer, target)).toBe(true);
    expect(
      areRolesComplementary(
        { primaryRole: 'mid', secondaryRole: null },
        { primaryRole: 'mid', secondaryRole: null }
      )
    ).toBe(false);
  });

  it('trata a Comodín como compatible con cualquier rol', () => {
    const fill = { primaryRole: 'fill', secondaryRole: 'fill' };
    expect(areRolesComplementary(viewer, fill)).toBe(true);
    expect(canPlayRole(fill, 'support')).toBe(true);
    expect(canPlayRole(viewer, 'support')).toBe(false);
  });

  it('usa el rango Flex cuando la cola es Flex', () => {
    const soloViewer = { rankIndex: 4, flexRankIndex: 26 };
    const soloTarget = { rankIndex: 26, flexRankIndex: 20 };

    expect(rankIndexForQueue(soloViewer, 'solo_duo')).toBe(4);
    expect(rankIndexForQueue(soloViewer, 'flex')).toBe(26);
    expect(rankDistance(soloViewer, soloTarget, 'solo_duo')).toBe(22);
    expect(rankDistance(soloViewer, soloTarget, 'flex')).toBe(6);
  });

  it('calcula el solape de horarios', () => {
    const overlap = scheduleOverlap(viewer, target);
    expect(overlap.count).toBe(3);
    expect(overlap.ratio).toBe(0.75);
    expect(scheduleOverlap(viewer, { scheduleBlocks: ['sun_early'] })).toEqual({
      count: 0,
      ratio: 0,
    });
  });

  it('calcula afinidad de idioma', () => {
    expect(languageScore(viewer, target)).toBe(1);
    expect(languageScore({ languages: ['es'] }, { languages: ['en', 'es'] })).toBe(0.6);
    expect(languageScore({ languages: ['es'] }, { languages: ['pt'] })).toBe(0);
  });

  it('ordena el par de conexión', () => {
    expect(orderedPair('b', 'a')).toEqual(['a', 'b']);
    expect(orderedPair('a', 'b')).toEqual(['a', 'b']);
  });

  it('calcula el score de duo con breakdown entero', () => {
    const result = computeDuoScore(viewer, target, { queue: 'solo_duo' });

    expect(result.score).toBe(78);
    expect(result.breakdown).toEqual({
      schedule: 30,
      style: 15,
      language: 15,
      roles: 10,
      mic: 5,
      rank: 3,
    });
    expect(result.reasons).toContain('Coinciden 3 horarios');
    expect(result.reasons).toContain('Estilos compatibles');
  });

  it('devuelve 100 con compatibilidad perfecta', () => {
    const perfect = {
      ...viewer,
      rankIndex: 26,
      scheduleBlocks: ['mon_night', 'tue_night'],
      playStyle: 'ranked',
      languages: ['es', 'en'],
    };
    const other = {
      ...target,
      rankIndex: 26,
      scheduleBlocks: ['mon_night', 'tue_night'],
      languages: ['es', 'en'],
    };

    expect(computeDuoScore(perfect, other).score).toBe(100);
  });

  it('calcula el score de Disponible ya', () => {
    const result = computeNowScore(viewer, target, { queue: 'solo_duo' });

    expect(result.score).toBe(71);
    expect(result.breakdown.rank).toBe(15);
    expect(result.breakdown.reputation).toBe(11);
  });

  it('calcula el fit de un postulante a Busco 1', () => {
    const post = {
      rankMinIndex: 24,
      rankMaxIndex: 27,
      rolesNeeded: ['support'],
    };
    const owner = { ...target, primaryRole: 'adc', secondaryRole: 'support' };

    const result = computePostFitScore({ ...target, rankIndex: 25 }, post, owner);

    expect(result.breakdown.rank).toBe(27);
    expect(result.breakdown.roles).toBe(0);
    expect(result.score).toBeGreaterThan(0);
  });
});
