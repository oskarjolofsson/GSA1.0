import {
    asMetric,
    isCounted,
    isRenderable,
    promptFor,
    proximityStart,
    repsOf,
    stepProximity,
    unitOf,
    formatProximity,
    gradePreview,
    gradeCaption,
} from './drillMetric';

describe('asMetric', () => {
    it('reads a well-formed metric', () => {
        expect(asMetric({ type: 'make_rate', reps: 10 })).toEqual({ type: 'make_rate', reps: 10 });
    });

    it.each([null, undefined, 'make_rate', 42, [], {}, { reps: 10 }])(
        'returns null for %p',
        (raw) => {
            expect(asMetric(raw)).toBeNull();
        },
    );
});

describe('isRenderable — the default-branch guard', () => {
    it.each(['make_rate', 'proximity', 'up_and_down'])('renders %s', (type) => {
        expect(isRenderable({ type })).toBe(true);
    });

    it('refuses a feel-only drill', () => {
        expect(isRenderable(null)).toBe(false);
    });

    it('refuses a metric type authored after this build shipped', () => {
        // The whole reason the rating UI keeps a default branch. drills.metric is authored
        // in the admin CMS with no app release, so this exact shape WILL reach old builds.
        // Falling back to the feel picker is what stops the golfer being stranded on a
        // screen they cannot complete after they have already hit the balls.
        expect(isRenderable({ type: 'strokes_gained' })).toBe(false);
    });
});

describe('isCounted', () => {
    it('counts make_rate and up_and_down', () => {
        expect(isCounted({ type: 'make_rate' })).toBe(true);
        expect(isCounted({ type: 'up_and_down' })).toBe(true);
    });

    it('does not count proximity — feet from the hole is not out of ten', () => {
        expect(isCounted({ type: 'proximity' })).toBe(false);
    });
});

describe('repsOf', () => {
    it('uses the authored rep count', () => {
        expect(repsOf({ type: 'make_rate', reps: 20 })).toBe(20);
    });

    it.each([undefined, 0, -5, NaN, 'ten' as unknown as number])(
        'falls back to 10 for %p',
        (reps) => {
            expect(repsOf({ type: 'make_rate', reps: reps as number })).toBe(10);
        },
    );

    it('caps absurd rep counts so the grid stays drawable', () => {
        expect(repsOf({ type: 'make_rate', reps: 5000 })).toBe(50);
    });
});

describe('promptFor', () => {
    it('prefers the authored label', () => {
        expect(promptFor({ type: 'make_rate', label: '6-foot putts made' })).toBe(
            '6-foot putts made',
        );
    });

    it('asks a counting question for counted types', () => {
        expect(promptFor({ type: 'make_rate' })).toMatch(/how many/i);
        expect(promptFor({ type: 'up_and_down' })).toMatch(/up and down/i);
    });

    it('falls back to feel wording for an unknown type', () => {
        expect(promptFor({ type: 'invented_later' })).toMatch(/feel/i);
        expect(promptFor(null)).toMatch(/feel/i);
    });
});

describe('proximity', () => {
    it('opens at half the ceiling — neither flattering nor punishing', () => {
        expect(proximityStart({ type: 'proximity', ceiling: 10 })).toBe(5);
        expect(proximityStart({ type: 'proximity', ceiling: 30 })).toBe(15);
    });

    it('defaults its ceiling when none is authored', () => {
        expect(proximityStart({ type: 'proximity' })).toBe(5);
    });

    it('steps in tenths without float drift', () => {
        // 4.2 - 0.1 is 4.099999999999999 in IEEE 754. Unrounded, the hero numeral would
        // render "4.1" while the posted value carried a tail of noise.
        expect(stepProximity(4.2, -1)).toBe(4.1);
        expect(stepProximity(4.2, 1)).toBe(4.3);
        expect(stepProximity(0.3, -1)).toBe(0.2);
    });

    it('never goes below zero — you cannot be behind the hole', () => {
        expect(stepProximity(0, -1)).toBe(0);
        expect(stepProximity(0.05, -1)).toBe(0);
    });

    it('formats to one decimal so 5 reads as 5.0', () => {
        expect(formatProximity(5)).toBe('5.0');
        expect(formatProximity(4.25)).toBe('4.3');
    });

    it('defaults the unit to feet', () => {
        expect(unitOf({ type: 'proximity' })).toBe('ft');
        expect(unitOf({ type: 'proximity', unit: 'm' })).toBe('m');
    });
});

describe('gradePreview — mirrors backend/core/services/drill_metrics.py', () => {
    const make_rate = { type: 'make_rate', reps: 10, grade_at: { dialed: 0.8, ok: 0.5 } };

    it.each([
        [10, 'dialed'],
        [8, 'dialed'],
        [7, 'ok'],
        [5, 'ok'],
        [4, 'rough'],
        [0, 'rough'],
    ])('grades %i out of ten as %s', (value, expected) => {
        expect(gradePreview(make_rate, value)).toBe(expected);
    });

    it('scales to the rep count without re-authoring', () => {
        const twenty = { ...make_rate, reps: 20 };
        expect(gradePreview(twenty, 16)).toBe('dialed');
        expect(gradePreview(twenty, 10)).toBe('ok');
        expect(gradePreview(twenty, 9)).toBe('rough');
    });

    it('reads the drill’s current thresholds, not a hardcoded pair', () => {
        // This is what makes a client-side preview safe: grade_at comes off the drill the
        // session just fetched, so retuning in the admin lands on the very next practice.
        const strict = { ...make_rate, grade_at: { dialed: 0.9, ok: 0.7 } };
        expect(gradePreview(strict, 8)).toBe('ok');
    });

    it('inverts for proximity — closer is better', () => {
        const proximity = { type: 'proximity', reps: 10, unit: 'ft', ceiling: 10 };
        expect(gradePreview(proximity, 1)).toBe('dialed');
        expect(gradePreview(proximity, 4)).toBe('ok');
        expect(gradePreview(proximity, 9)).toBe('rough');
        expect(gradePreview(proximity, 40)).toBe('rough');
    });

    it('says nothing when there is nothing to say', () => {
        expect(gradePreview(make_rate, null)).toBeNull();
        expect(gradePreview(null, 8)).toBeNull();
        expect(gradePreview({ type: 'invented_later', reps: 10 }, 8)).toBeNull();
    });

    it('captions only real grades', () => {
        expect(gradeCaption('dialed')).toMatch(/dialed/i);
        expect(gradeCaption(null)).toBeNull();
    });
});
