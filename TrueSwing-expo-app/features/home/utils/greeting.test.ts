import { pickGreeting, greetingStateFor, dayKeyFor } from './greeting';

describe('greetingStateFor', () => {
  it('buckets by how many areas have work', () => {
    expect(greetingStateFor(0)).toBe('none');
    expect(greetingStateFor(1)).toBe('one');
    expect(greetingStateFor(2)).toBe('many');
    expect(greetingStateFor(5)).toBe('many');
  });

  it('treats a negative count as empty rather than throwing', () => {
    expect(greetingStateFor(-1)).toBe('none');
  });
});

describe('pickGreeting — stability', () => {
  it('returns the same phrase for the same day', () => {
    const a = pickGreeting('many', '2026-08-05', 'Oskar', null, 3);
    const b = pickGreeting('many', '2026-08-05', 'Oskar', null, 3);
    expect(a.subtitle).toBe(b.subtitle);
  });

  it('reaches every phrase across a run of days', () => {
    // The point of day-seeding is variety over time. If a hash collision
    // pinned every date to one phrase the line would read as hardcoded.
    const seen = new Set<string>();
    for (let day = 1; day <= 28; day++) {
      const key = `2026-08-${String(day).padStart(2, '0')}`;
      seen.add(pickGreeting('many', key, 'Oskar', null, 3).subtitle);
    }
    expect(seen.size).toBe(3);
  });
});

describe('pickGreeting — the name', () => {
  it('uses the name when there is one', () => {
    expect(pickGreeting('one', '2026-08-05', 'Oskar').title).toBe('Hello, Oskar');
  });

  it('never renders a hole when the name is missing', () => {
    // useAuth().user.name is nullable, so this is a real state, not a guard
    // against a bug.
    for (const missing of [null, undefined, '', '   ']) {
      const { title } = pickGreeting('one', '2026-08-05', missing);
      expect(title).toBe('Hello');
      expect(title).not.toContain('null');
      expect(title).not.toContain('undefined');
    }
  });
});

describe('pickGreeting — substitution', () => {
  it('fills the area name in the one-focus phrases', () => {
    // Whichever phrase the day lands on, no placeholder may survive.
    for (let day = 1; day <= 10; day++) {
      const key = `2026-09-${String(day).padStart(2, '0')}`;
      const { subtitle } = pickGreeting('one', key, 'Oskar', 'putting');
      expect(subtitle).not.toContain('{area}');
    }
  });

  it('falls back when the area label is missing', () => {
    const { subtitle } = pickGreeting('one', '2026-08-06', 'Oskar', null);
    expect(subtitle).not.toContain('{area}');
    expect(subtitle).not.toContain('null');
  });

  it('fills the count in the many-focus phrases', () => {
    for (let day = 1; day <= 10; day++) {
      const key = `2026-10-${String(day).padStart(2, '0')}`;
      const { subtitle } = pickGreeting('many', key, 'Oskar', null, 4);
      expect(subtitle).not.toContain('{n}');
    }
  });

  it('leaves no placeholder in the empty-plan phrases', () => {
    for (let day = 1; day <= 10; day++) {
      const key = `2026-11-${String(day).padStart(2, '0')}`;
      const { subtitle } = pickGreeting('none', key, 'Oskar');
      expect(subtitle).not.toMatch(/\{\w+\}/);
    }
  });
});

describe('dayKeyFor', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(dayKeyFor(new Date('2026-08-05T22:13:00Z'))).toBe('2026-08-05');
  });
});
