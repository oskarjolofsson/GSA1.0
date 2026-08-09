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

    await fireEvent.press(view.getByText('Very good'));
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
      <BlockRating metric={{ type: 'strokes_gained', reps: 10 }} onComplete={onComplete} />
    );

    expect(view.getByText('Poor')).toBeTruthy();
    await fireEvent.press(view.getByText('OK'));
    expect(onComplete).toHaveBeenCalledWith({ feel: 'ok', metricValue: null });
  });

  it('survives a metric that is not even an object', async () => {
    const view = await render(<BlockRating metric={'nonsense'} onComplete={jest.fn()} />);
    expect(view.getByText('Very good')).toBeTruthy();
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
      <BlockRating metric={{ ...MAKE_RATE, reps: 20 }} onComplete={jest.fn()} />
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

/**
 * The reported bug: "the question is not actually visible to the user, just the input."
 *
 * WHAT THIS SUITE CAN AND CANNOT PROVE. The cause was layout, not markup — the prompt was
 * rendered by the parent screen in a `flex-1` region that an ~560px input block squeezed to
 * nothing. RNTL does not lay anything out, so a `getByText` on the prompt would have PASSED
 * against the broken build: the node existed, it just had no height. These tests cannot see
 * that, and pretending otherwise would be worse than not having them.
 *
 * What they do lock in is the structural fix: this component owns the question, so no sibling
 * can squeeze it. Move the prompt back out to a parent and these fail. The visual regression
 * itself needs a device screenshot, which this project has no framework for (recorded in
 * TODOS.md).
 */
describe('the question travels with the input', () => {
  it('renders the prompt alongside every tile and the action, for a ten-rep drill', async () => {
    const view = await render(<BlockRating metric={MAKE_RATE} onComplete={jest.fn()} />);

    expect(view.getByText('How many did you make?')).toBeTruthy();
    // 0..10 inclusive is eleven tiles — the count that made the old layout collapse.
    for (let n = 0; n <= 10; n += 1) {
      expect(view.getByText(String(n))).toBeTruthy();
    }
    expect(view.getByText('Log it')).toBeTruthy();
    expect(view.getByText('Skip')).toBeTruthy();
  });

  it('still renders the prompt at twenty reps, where the grid has to scroll', async () => {
    const view = await render(
      <BlockRating metric={{ ...MAKE_RATE, reps: 20 }} onComplete={jest.fn()} />
    );

    expect(view.getByText('How many did you make?')).toBeTruthy();
    expect(view.getByText('20')).toBeTruthy();
    expect(view.getByText('Log it')).toBeTruthy();
  });

  it('asks the proximity question rather than a counting one', async () => {
    const view = await render(<BlockRating metric={PROXIMITY} onComplete={jest.fn()} />);
    expect(view.getByText('Average distance to the hole?')).toBeTruthy();
  });

  it('asks an open question when the metric type is unknown to this build', async () => {
    const view = await render(
      <BlockRating metric={{ type: 'invented_later' }} onComplete={jest.fn()} />
    );

    expect(view.getByText('How did that block go?')).toBeTruthy();
    // No number to log, so no "Log it" — only the picker and Skip complete this block.
    expect(view.queryByText('Log it')).toBeNull();
    expect(view.getByText('Very good')).toBeTruthy();
  });

  it('prefers an authored label over the built-in question', async () => {
    const view = await render(
      <BlockRating
        metric={{ ...MAKE_RATE, label: 'Fairways hit out of 14' }}
        onComplete={jest.fn()}
      />
    );
    expect(view.getByText('Fairways hit out of 14')).toBeTruthy();
  });
});

describe('the live caption', () => {
  it('does not tell the golfer an OK block earned progress', async () => {
    const view = await render(<BlockRating metric={MAKE_RATE} onComplete={jest.fn()} />);

    // 5 of 10 lands on `ok` against the default thresholds (dialed .8, ok .5), and an ok
    // grade moves a drill's strength by exactly zero.
    await fireEvent.press(view.getByText('5'));
    expect(view.getByText('OK · no change')).toBeTruthy();
  });

  it('says a very good block counts', async () => {
    const view = await render(<BlockRating metric={MAKE_RATE} onComplete={jest.fn()} />);

    await fireEvent.press(view.getByText('9'));
    expect(view.getByText('Very good · counts toward this drill')).toBeTruthy();
  });
});

describe('disabled', () => {
  it('ignores taps while the session is settling', async () => {
    const onComplete = jest.fn();
    const view = await render(<BlockRating metric={MAKE_RATE} disabled onComplete={onComplete} />);

    await fireEvent.press(view.getByText('8'));
    await fireEvent.press(view.getByText('Log it'));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
