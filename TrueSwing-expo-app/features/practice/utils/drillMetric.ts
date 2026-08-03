/**
 * Reading a drill's metric, on the client.
 *
 * The server owns grading. This file owns nothing but presentation: what to call the
 * number, what range it can take, and how to step it. `grade_at` is deliberately not
 * read here — thresholds are admin-editable content, so a build that shipped before you
 * retuned a drill would grade on numbers nobody can see any more. The app posts the raw
 * value and the response tells it what that was worth.
 *
 * `metric` arrives as an untyped object from the backend (drills.metric is JSONB), so
 * every accessor below is defensive. That is not paranoia: the admin CMS can author a
 * metric type without an app release, which is the whole reason the rating UI needs a
 * default branch.
 */

export type MetricType = 'make_rate' | 'proximity' | 'up_and_down';

export type DrillMetric = {
    type: string;
    reps?: number;
    label?: string;
    unit?: string;
    lower_is_better?: boolean;
    ceiling?: number;
    grade_at?: { dialed?: number; ok?: number };
};

/** Types this build can actually render an input for. Anything else falls back to feel. */
const RENDERABLE: MetricType[] = ['make_rate', 'proximity', 'up_and_down'];

/** Counted out of `reps`, so the input is a grid of whole numbers 0..reps. */
const COUNTED: MetricType[] = ['make_rate', 'up_and_down'];

export function asMetric(raw: unknown): DrillMetric | null {
    if (!raw || typeof raw !== 'object') return null;
    const metric = raw as DrillMetric;
    return typeof metric.type === 'string' ? metric : null;
}

/**
 * Can this build render an input for the drill?
 *
 * False for a feel-only drill AND for a metric type authored after this build shipped.
 * Both answers route to the same place: the feel picker, which always completes.
 */
export function isRenderable(metric: DrillMetric | null): metric is DrillMetric {
    return Boolean(metric && RENDERABLE.includes(metric.type as MetricType));
}

export function isCounted(metric: DrillMetric | null): boolean {
    return Boolean(metric && COUNTED.includes(metric.type as MetricType));
}

/** Reps, clamped to something a grid can actually draw. Defaults to 10. */
export function repsOf(metric: DrillMetric | null): number {
    const reps = metric?.reps;
    if (typeof reps !== 'number' || !Number.isFinite(reps) || reps < 1) return 10;
    return Math.min(Math.round(reps), 50);
}

/** The question above the input. Authored `label` wins; these are the fallbacks. */
export function promptFor(metric: DrillMetric | null): string {
    if (metric?.label) return metric.label;
    switch (metric?.type) {
        case 'make_rate':
            return 'How many did you make';
        case 'up_and_down':
            return 'How many up and downs';
        case 'proximity':
            return 'Average distance to the hole';
        default:
            return 'How did that block feel';
    }
}

export const unitOf = (metric: DrillMetric | null): string => metric?.unit ?? 'ft';

/**
 * Step size for the proximity stepper.
 *
 * Tenths, because the difference between 4.2 and 4.3 feet is the kind of progress this
 * drill exists to show. Whole feet would flatten a season of improvement into four values.
 */
export const PROXIMITY_STEP = 0.1;

/** Where the stepper opens. Half the ceiling: neither flattering nor punishing. */
export function proximityStart(metric: DrillMetric | null): number {
    const ceiling = metric?.ceiling;
    const base = typeof ceiling === 'number' && ceiling > 0 ? ceiling : 10;
    return Math.round((base / 2) * 10) / 10;
}

/** Float maths on tenths drifts (4.2 - 0.1 = 4.0999...). Round at every step. */
export function stepProximity(value: number, direction: 1 | -1): number {
    const next = value + direction * PROXIMITY_STEP;
    return Math.max(0, Math.round(next * 10) / 10);
}

export const formatProximity = (value: number): string => value.toFixed(1);

// --------------------------------------------------------------------------------------
// Grade preview
// --------------------------------------------------------------------------------------

const DEFAULT_GRADE_AT = { dialed: 0.8, ok: 0.5 };
const PROXIMITY_CEILING_DEFAULT = 10;

/**
 * What the number the golfer just entered is worth, for display only.
 *
 * This mirrors `backend/core/services/drill_metrics.py`. Two copies of a rule is a real
 * cost, so be clear about why it is worth paying: without it the golfer enters a number
 * and learns nothing until the results screen, and the link between "8 out of 10" and the
 * drill the scheduler picks next stays invisible machinery.
 *
 * It is safe against the staleness the server-side-grading rule exists to prevent, because
 * `grade_at` is read off the drill this session just fetched -- not hardcoded into the
 * build. Retune a drill in the admin and the very next practice reads the new thresholds.
 *
 * It is a preview. The server still grades what gets stored and what moves `strength`; if
 * these two ever disagree, the server is right and this is the bug.
 */
export function gradePreview(metric: DrillMetric | null, value: number | null): string | null {
    if (!isRenderable(metric) || value === null) return null;

    const score = normalisedScore(metric, value);
    if (score === null) return null;

    const dialed = metric.grade_at?.dialed ?? DEFAULT_GRADE_AT.dialed;
    const ok = metric.grade_at?.ok ?? DEFAULT_GRADE_AT.ok;

    if (score >= dialed) return 'dialed';
    if (score >= ok) return 'ok';
    return 'rough';
}

/** Collapse a raw score to 0..1 where 1 is perfect, so the two metric shapes compare. */
function normalisedScore(metric: DrillMetric, value: number): number | null {
    if (isCounted(metric)) {
        const reps = repsOf(metric);
        return clamp01(value / reps);
    }

    if (metric.type === 'proximity') {
        const ceiling =
            typeof metric.ceiling === 'number' && metric.ceiling > 0
                ? metric.ceiling
                : PROXIMITY_CEILING_DEFAULT;
        // Distance in, quality out: at the hole is 1.0, at or past the ceiling is 0.0.
        return metric.lower_is_better === false
            ? clamp01(value / ceiling)
            : clamp01(1 - value / ceiling);
    }

    return null;
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Sentence under the input. Deliberately terse -- it is a readout, not encouragement. */
export function gradeCaption(grade: string | null): string | null {
    switch (grade) {
        case 'dialed':
            return 'Dialed for this drill';
        case 'ok':
            return 'Solid for this drill';
        case 'rough':
            return 'Rough for this drill';
        default:
            return null;
    }
}
