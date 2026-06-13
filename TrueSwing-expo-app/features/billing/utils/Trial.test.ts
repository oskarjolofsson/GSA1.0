import { daysLeft } from 'features/billing/utils/Trial';

describe('daysLeft', () => {
  const now = new Date('2026-06-13T12:00:00Z').getTime();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 0 for null/undefined', () => {
    expect(daysLeft(null)).toBe(0);
    expect(daysLeft(undefined)).toBe(0);
  });

  it('returns 0 for an invalid date string', () => {
    expect(daysLeft('not-a-date')).toBe(0);
  });

  it('returns 0 when the trial has already expired', () => {
    expect(daysLeft('2026-06-10T12:00:00Z')).toBe(0);
  });

  it('returns 0 at the exact expiry instant (no negative)', () => {
    expect(daysLeft('2026-06-13T12:00:00Z')).toBe(0);
  });

  it('rounds partial days up', () => {
    // 3 days + 1 hour from now -> 4
    expect(daysLeft('2026-06-16T13:00:00Z')).toBe(4);
  });

  it('counts a full 7-day trial', () => {
    expect(daysLeft('2026-06-20T12:00:00Z')).toBe(7);
  });
});
