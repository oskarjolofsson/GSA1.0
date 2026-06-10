import { describe, it, expect } from 'vitest';
import { daysLeft } from './trial';

describe('daysLeft', () => {
  it('rounds up whole days remaining for a future date', () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 1000).toISOString();
    expect(daysLeft(future)).toBe(4);
  });

  it('returns 0 for a past date (clamped)', () => {
    expect(daysLeft('2020-01-01T00:00:00Z')).toBe(0);
  });

  it('returns 0 right at expiry', () => {
    expect(daysLeft(new Date(Date.now()).toISOString())).toBe(0);
  });
});
