/**
 * Note on style: `render` and `fireEvent` are awaited throughout. React 19 renders
 * concurrently and RNTL 14 returns promises from both, so a synchronous call leaves the
 * tree un-flushed and every query after it fails for the wrong reason.
 */
import { fireEvent, render } from '@testing-library/react-native';

import BlockRating from './BlockRating';

const MAKE_RATE = { type: 'make_rate', reps: 10, grade_at: { dialed: 0.8, ok: 0.5 } };
const PROXIMITY = { type: 'proximity', reps: 10, unit: 'ft', ceiling: 10 };

describe('the default branch', () => {
    it('falls back to the feel picker for a feel-only drill', async () => {
        const onComplete = jest.fn();
        const view = await render(<BlockRating metric={null} onComplete={onComplete} />);

        await fireEvent.press(view.getByText('Dialed'));
        expect(onComplete).toHaveBeenCalledWith({ feel: 'dialed', metricValue: null });
    });

    it('falls back to the feel picker for a metric type this build has never seen', async () => {
        // The failure this exists to prevent: drills.metric is authored in the admin CMS
        // with no app release, so an old build gets a shape it cannot render. Before the
        // default branch the rating phase had three hardcoded states and no fallback --
        // the golfer finished hitting balls and got a blank screen with no way to finish
        // the session. No square on the graph, which is the app's core promise.
        const onComplete = jest.fn();
        const view = await render(
            <BlockRating metric={{ type: 'strokes_gained', reps: 10 }} onComplete={onComplete} />,
        );

        expect(view.getByText('Rough')).toBeTruthy();
        await fireEvent.press(view.getByText('OK'));
        expect(onComplete).toHaveBeenCalledWith({ feel: 'ok', metricValue: null });
    });

    it('survives a metric that is not even an object', async () => {
        const view = await render(<BlockRating metric={'nonsense'} onComplete={jest.fn()} />);
        expect(view.getByText('Dialed')).toBeTruthy();
    });
});

describe('counted metrics', () => {
    it('offers every value from 0 to reps', async () => {
        const view = await render(<BlockRating metric={MAKE_RATE} onComplete={jest.fn()} />);

        expect(view.getByText('0')).toBeTruthy();
        expect(view.getByText('10')).toBeTruthy();
        expect(view.queryByText('11')).toBeNull();
    });

    it('posts the raw number and no grade', async () => {
        // The client never grades. grade_at is admin-editable, so a build that shipped
        // before a retune would judge against numbers nobody can see any more.
        const onComplete = jest.fn();
        const view = await render(<BlockRating metric={MAKE_RATE} onComplete={onComplete} />);

        await fireEvent.press(view.getByText('8'));
        await fireEvent.press(view.getByText('Log it'));

        expect(onComplete).toHaveBeenCalledWith({ feel: null, metricValue: 8 });
    });

    it('will not log until a number is chosen', async () => {
        const onComplete = jest.fn();
        const view = await render(<BlockRating metric={MAKE_RATE} onComplete={onComplete} />);

        await fireEvent.press(view.getByText('Log it'));
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('logs a zero — missing all ten is a real result, not an empty one', async () => {
        const onComplete = jest.fn();
        const view = await render(<BlockRating metric={MAKE_RATE} onComplete={onComplete} />);

        await fireEvent.press(view.getByText('0'));
        await fireEvent.press(view.getByText('Log it'));

        expect(onComplete).toHaveBeenCalledWith({ feel: null, metricValue: 0 });
    });

    it('lets a mis-tap be corrected before logging', async () => {
        const onComplete = jest.fn();
        const view = await render(<BlockRating metric={MAKE_RATE} onComplete={onComplete} />);

        await fireEvent.press(view.getByText('3'));
        await fireEvent.press(view.getByText('7'));
        await fireEvent.press(view.getByText('Log it'));

        expect(onComplete).toHaveBeenCalledWith({ feel: null, metricValue: 7 });
    });

    it('honours an authored rep count other than ten', async () => {
        const view = await render(
            <BlockRating metric={{ ...MAKE_RATE, reps: 20 }} onComplete={jest.fn()} />,
        );
        expect(view.getByText('20')).toBeTruthy();
    });
});

describe('proximity', () => {
    it('opens at half the ceiling and can be logged straight away', async () => {
        const onComplete = jest.fn();
        const view = await render(<BlockRating metric={PROXIMITY} onComplete={onComplete} />);

        expect(view.getByText('5.0')).toBeTruthy();
        await fireEvent.press(view.getByText('Log it'));
        expect(onComplete).toHaveBeenCalledWith({ feel: null, metricValue: 5 });
    });

    it('steps in tenths', async () => {
        const onComplete = jest.fn();
        const view = await render(<BlockRating metric={PROXIMITY} onComplete={onComplete} />);

        await fireEvent.press(view.getByLabelText('Less by 0.1 ft'));
        await fireEvent.press(view.getByLabelText('Less by 0.1 ft'));
        await fireEvent.press(view.getByText('Log it'));

        expect(onComplete).toHaveBeenCalledWith({ feel: null, metricValue: 4.8 });
    });

    it('does not offer a number grid — 4.2 feet is not a value out of ten', async () => {
        const view = await render(<BlockRating metric={PROXIMITY} onComplete={jest.fn()} />);
        expect(view.queryByText('7')).toBeNull();
    });
});

describe('skipping', () => {
    it.each([
        ['feel-only', null],
        ['counted', MAKE_RATE],
        ['unknown type', { type: 'invented_later', reps: 10 }],
    ])('always completes the block for a %s drill', async (_label, metric) => {
        // A golfer who lost count still showed up. The session counts; only the grade is
        // lost, which leaves the drill's strength exactly where it was.
        const onComplete = jest.fn();
        const view = await render(<BlockRating metric={metric} onComplete={onComplete} />);

        await fireEvent.press(view.getByText('Skip'));
        expect(onComplete).toHaveBeenCalledWith({ feel: null, metricValue: null });
    });
});

describe('disabled', () => {
    it('ignores taps while the session is settling', async () => {
        const onComplete = jest.fn();
        const view = await render(
            <BlockRating metric={MAKE_RATE} disabled onComplete={onComplete} />,
        );

        await fireEvent.press(view.getByText('8'));
        await fireEvent.press(view.getByText('Log it'));
        expect(onComplete).not.toHaveBeenCalled();
    });
});
