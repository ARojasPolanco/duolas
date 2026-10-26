import { describe, expect, it } from 'vitest';
import { computeReputation } from '../modules/trust/reputation.service.js';

describe('Reputación', () => {
  it('aplica el suavizado de Laplace con los vectores documentados', () => {
    expect(computeReputation(0, 0)).toBe(50);
    expect(computeReputation(5, 0)).toBe(78);
    expect(computeReputation(5, 1)).toBe(70);
    expect(computeReputation(0, 5)).toBe(22);
  });

  it('se mantiene entre 0 y 100', () => {
    expect(computeReputation(1000, 0)).toBeLessThanOrEqual(100);
    expect(computeReputation(0, 1000)).toBeGreaterThanOrEqual(0);
  });
});
