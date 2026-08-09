import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useDrillRunActions } from 'features/drill/hooks/useDrillRunActions';
import type { DrillRun } from 'features/drill/types/DrillRun';
import { completeStep } from 'features/programs/services/programService';
import type { ProgramContext } from 'features/programs/types';

import { endPracticeSession } from '../services/sessionService';
import type { PracticeSession } from '../types/Session';
import type { DrillQueue } from './useDrillQueue';
import { usePracticeRunner, type SessionOutcome } from './usePracticeRunner';

jest.mock('features/drill/hooks/useDrillRunActions', () => ({
  useDrillRunActions: jest.fn(),
}));
jest.mock('../services/sessionService');
jest.mock('features/programs/services/programService');

const mockedUseDrillRunActions = useDrillRunActions as jest.Mock;
const mockedEndSession = endPracticeSession as jest.Mock;
const mockedCompleteStep = completeStep as jest.Mock;

const SESSION = { id: 'session-1' } as PracticeSession;
const DRILL_A = { id: 'drill-a', title: 'Gate Drill' };
const DRILL_B = { id: 'drill-b', title: 'Ladder Carry Drill' };

const CONTEXT: ProgramContext = {
  programId: 'program-1',
  stepId: 'step-1',
  drillIds: [DRILL_A.id, DRILL_B.id],
  groovedBefore: 3,
};

function runFor(drillId: string): DrillRun {
  return { id: `run-${drillId}`, drill_id: drillId } as DrillRun;
}

let startDrill: jest.Mock;
let endDrill: jest.Mock;

function makeQueue(overrides: Partial<DrillQueue> = {}): DrillQueue {
  return {
    drills: [DRILL_A, DRILL_B] as DrillQueue['drills'],
    activeDrill: DRILL_A as DrillQueue['activeDrill'],
    drillNumber: 1,
    totalDrills: 2,
    isLastDrill: false,
    advance: jest.fn(),
    retryLoad: jest.fn(),
    loading: false,
    error: null,
    ...overrides,
  };
}

// `renderHook` is awaited for the same reason `render` is throughout this project: RNTL 14
// on React 19 returns a promise, and a synchronous call leaves the tree un-flushed so
// `result` is still undefined when the assertions run.
async function mount(queue: DrillQueue, onSessionCompleted = jest.fn()) {
  const view = await renderHook(() =>
    usePracticeRunner({
      session: SESSION,
      queue,
      programContext: CONTEXT,
      onSessionCompleted,
    })
  );
  return { view, onSessionCompleted };
}

beforeEach(() => {
  jest.clearAllMocks();
  startDrill = jest.fn(async (_sessionId: string, drillId: string) => runFor(drillId));
  endDrill = jest.fn(async () => undefined);
  mockedUseDrillRunActions.mockReturnValue({
    startDrill,
    endDrill,
    loading: false,
    error: null,
  });
  mockedEndSession.mockResolvedValue(undefined);
  mockedCompleteStep.mockResolvedValue({
    completed_step: { program_id: 'program-1' },
    next_step: { id: 'step-2', prescription: { drill_ids: [] }, drills: [] },
    program_status: 'active',
    grooved_count: 4,
    total_drills: 7,
  });
});

describe('starting a block', () => {
  it('opens a drill run for the active drill and becomes ready', async () => {
    const { view } = await mount(makeQueue());

    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));
    expect(startDrill).toHaveBeenCalledWith('session-1', 'drill-a');
  });

  it('surfaces a failure to start, with a retry that starts it again', async () => {
    startDrill.mockRejectedValueOnce(new Error('offline'));
    const { view } = await mount(makeQueue());

    await waitFor(() => expect(view.result.current.status.kind).toBe('error'));
    const status = view.result.current.status;
    if (status.kind !== 'error') throw new Error('expected an error status');
    expect(status.message).toBe('offline');

    await act(async () => status.retry?.());
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));
  });
});

/**
 * THE REGRESSION THIS FILE EXISTS FOR.
 *
 * `finishing` was set before awaiting the final save and never cleared on failure. The screen
 * checked `loading` before `error`, and `finishing` fed `loading`, so the error branch was
 * unreachable: a golfer who had just finished their session sat on a spinner with no button,
 * and the completion guard blocked any retry. The session was lost.
 *
 * A single status union makes that state unrepresentable rather than resolved by check order.
 */
describe('a failure on the final drill', () => {
  const lastDrill = () =>
    makeQueue({ activeDrill: DRILL_A as DrillQueue['activeDrill'], isLastDrill: true });

  it('shows an error rather than spinning forever', async () => {
    mockedEndSession.mockRejectedValueOnce(new Error('network blip'));
    const { view, onSessionCompleted } = await mount(lastDrill());
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));

    await act(async () => view.result.current.completeBlock({ feel: 'ok', metricValue: null }));

    await waitFor(() => expect(view.result.current.status.kind).toBe('error'));
    expect(view.result.current.status.kind).not.toBe('finishing');
    expect(onSessionCompleted).not.toHaveBeenCalled();
  });

  it('offers a retry that resubmits the same block and completes the session', async () => {
    mockedEndSession.mockRejectedValueOnce(new Error('network blip'));
    const { view, onSessionCompleted } = await mount(lastDrill());
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));

    await act(async () => view.result.current.completeBlock({ feel: null, metricValue: 8 }));
    await waitFor(() => expect(view.result.current.status.kind).toBe('error'));

    const status = view.result.current.status;
    if (status.kind !== 'error') throw new Error('expected an error status');
    await act(async () => status.retry?.());

    await waitFor(() => expect(onSessionCompleted).toHaveBeenCalled());
    // The retry sends the same number, and sends the grade exactly once.
    expect(mockedCompleteStep).toHaveBeenCalledTimes(1);
    expect(mockedCompleteStep.mock.calls[0][2].grades).toEqual([
      { drill_id: 'drill-a', metric_value: 8 },
    ]);
  });
});

describe('a failed plan advance', () => {
  /**
   * The practice happened and the session is saved; only the schedule did not move. This
   * must NOT read as a failed session — but it must not read as a successful advance
   * either, which is what the old code did: it logged to the console and then congratulated
   * the golfer anyway.
   */
  it('completes the session in a degraded state instead of blocking the screen', async () => {
    mockedCompleteStep.mockRejectedValueOnce(new Error('500'));
    const outcomes: SessionOutcome[] = [];
    const { view } = await mount(
      makeQueue({ isLastDrill: true }),
      jest.fn((outcome: SessionOutcome) => outcomes.push(outcome))
    );
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));

    await act(async () => view.result.current.completeBlock({ feel: 'dialed', metricValue: null }));

    await waitFor(() => expect(outcomes).toHaveLength(1));
    expect(outcomes[0].kind).toBe('advance-failed');
  });

  it('carries the grooved count from before the session, so the screen can show what moved', async () => {
    const outcomes: SessionOutcome[] = [];
    const { view } = await mount(
      makeQueue({ isLastDrill: true }),
      jest.fn((outcome: SessionOutcome) => outcomes.push(outcome))
    );
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));

    await act(async () => view.result.current.completeBlock({ feel: 'dialed', metricValue: null }));

    await waitFor(() => expect(outcomes).toHaveLength(1));
    const outcome = outcomes[0];
    if (outcome.kind !== 'advanced') throw new Error('expected an advance');
    expect(outcome.groovedBefore).toBe(3);
    expect(outcome.advance.grooved_count).toBe(4);
  });
});

describe('recording a block', () => {
  it('moves to the next drill when there is one', async () => {
    const queue = makeQueue();
    const { view, onSessionCompleted } = await mount(queue);
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));

    await act(async () => view.result.current.completeBlock({ feel: 'ok', metricValue: null }));

    await waitFor(() => expect(queue.advance).toHaveBeenCalled());
    expect(mockedEndSession).not.toHaveBeenCalled();
    expect(onSessionCompleted).not.toHaveBeenCalled();
  });

  it('ignores a second tap on the same block', async () => {
    const queue = makeQueue();
    const { view } = await mount(queue);
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));

    await act(async () => {
      view.result.current.completeBlock({ feel: 'ok', metricValue: null });
      view.result.current.completeBlock({ feel: 'ok', metricValue: null });
    });

    await waitFor(() => expect(endDrill).toHaveBeenCalledTimes(1));
  });

  it('sends a skipped block as no grade at all, leaving the drill where it was', async () => {
    const { view } = await mount(makeQueue({ isLastDrill: true }));
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));

    await act(async () => view.result.current.completeBlock({ feel: null, metricValue: null }));

    await waitFor(() => expect(mockedCompleteStep).toHaveBeenCalled());
    expect(mockedCompleteStep.mock.calls[0][2].grades).toEqual([]);
  });

  it('sends a feel as a grade and a number as a metric value, never both', async () => {
    const { view } = await mount(makeQueue({ isLastDrill: true }));
    await waitFor(() => expect(view.result.current.status.kind).toBe('ready'));

    await act(async () => view.result.current.completeBlock({ feel: 'dialed', metricValue: null }));

    await waitFor(() => expect(mockedCompleteStep).toHaveBeenCalled());
    expect(mockedCompleteStep.mock.calls[0][2].grades).toEqual([
      { drill_id: 'drill-a', grade: 'dialed' },
    ]);
  });
});

describe('the status union', () => {
  it('reports a queue failure with the queue’s own retry', async () => {
    const queue = makeQueue({ error: 'could not load drills', activeDrill: null });
    const { view } = await mount(queue);

    const status = view.result.current.status;
    if (status.kind !== 'error') throw new Error('expected an error status');
    expect(status.message).toBe('could not load drills');
    status.retry?.();
    expect(queue.retryLoad).toHaveBeenCalled();
  });

  it('is loading while the queue is loading', async () => {
    const { view } = await mount(makeQueue({ loading: true, activeDrill: null }));
    expect(view.result.current.status.kind).toBe('loading');
  });
});
