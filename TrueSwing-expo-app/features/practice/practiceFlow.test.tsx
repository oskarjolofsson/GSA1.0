import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useState } from 'react';

import type { Issue } from 'features/issues/types';
import type { ProgramContext, StepAdvance } from 'features/programs/types';

import PracticeFlow from './practiceFlow';
import type { PracticeSession } from './types';

/**
 * A whole range visit, driven the way a golfer drives it.
 *
 * WHY THIS TEST EXISTS. The review found a bug that lives between the units:
 * `useScreenSequence` keeps `currentIndex` in local state inside the flow, so handing down a
 * new session resets the drill machine but does NOT move the screen. "Continue practice"
 * would have started a new session and left the golfer staring at the completion screen.
 * Every unit test in this feature passes against that build. The assertion at the end of
 * "continuing into the next session" is the one that fails.
 *
 * SCOPED TO PracticeFlow, NOT HomeFlow. The contract under test is "parent swaps the session,
 * flow returns to the drill screen", so the wrapper below plays homeFlow's part. Rendering
 * the real HomeFlow would pull in HomeScreen's entire dependency graph without covering the
 * loop any better.
 *
 * Services are mocked; the real hooks run.
 */

jest.mock('features/drill/services/drillService', () => ({
  DrillService: jest.fn().mockImplementation(() => ({
    getDrillsByIssue: (...args: unknown[]) => mockGetDrillsByIssue(...args),
  })),
}));
jest.mock('features/drill/services/drillRunService', () => ({
  startDrillRun: (...args: unknown[]) => mockStartDrillRun(...args),
  endDrillRun: (...args: unknown[]) => mockEndDrillRun(...args),
}));
jest.mock('./services/sessionService', () => ({
  endPracticeSession: (...args: unknown[]) => mockEndPracticeSession(...args),
  startPracticeSession: jest.fn(),
  getPracticeSessionById: jest.fn(),
  getPracticeSessionResults: (...args: unknown[]) => mockGetResults(...args),
}));
jest.mock('features/programs/services/programService', () => ({
  completeStep: (...args: unknown[]) => mockCompleteStep(...args),
}));
jest.mock('features/home/context/HomeAnalysisContext', () => ({
  useHomeAnalysis: () => ({}),
}));

const mockGetDrillsByIssue = jest.fn();
const mockStartDrillRun = jest.fn();
const mockEndDrillRun = jest.fn();
const mockEndPracticeSession = jest.fn();
const mockGetResults = jest.fn();
const mockCompleteStep = jest.fn();

const ISSUE = {
  id: 'issue-1',
  title: 'Early extension',
  layman_title: 'Hold your finish',
} as Issue;

const GATE = {
  id: 'drill-gate',
  title: 'Gate Drill',
  task: 'Set up two clubs. Hit ten balls.',
  success_signal:
    'Each ball carries close to its target distance. Swing length scales with the distance.',
  metric: { type: 'make_rate', reps: 10, grade_at: { dialed: 0.8, ok: 0.5 } },
};
const LADDER = {
  id: 'drill-ladder',
  title: 'Ladder Carry Drill',
  task: 'Pick three targets. Work up the ladder.',
  success_signal: 'The distances ladder cleanly rather than blur together.',
  metric: null,
};

const STEP_ONE: ProgramContext = {
  programId: 'program-1',
  stepId: 'step-1',
  drillIds: [GATE.id, LADDER.id],
  groovedBefore: 3,
};

const ADVANCE: StepAdvance = {
  completed_step: { program_id: 'program-1' },
  next_step: {
    id: 'step-2',
    prescription: { drill_ids: [GATE.id, LADDER.id] },
    drills: [
      { id: GATE.id, title: GATE.title },
      { id: LADDER.id, title: LADDER.title },
    ],
  },
  program_status: 'active',
  grooved_count: 4,
  total_drills: 7,
} as unknown as StepAdvance;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDrillsByIssue.mockResolvedValue([GATE, LADDER]);
  mockStartDrillRun.mockImplementation(async (sessionId: string, drillId: string) => ({
    id: `run-${sessionId}-${drillId}`,
    drill_id: drillId,
    session_id: sessionId,
  }));
  mockEndDrillRun.mockResolvedValue(undefined);
  mockEndPracticeSession.mockResolvedValue(undefined);
  mockCompleteStep.mockResolvedValue(ADVANCE);
  mockGetResults.mockResolvedValue([
    {
      id: 'r1',
      drill_title: GATE.title,
      skipped: false,
      metric_value: 8,
      metric_type: 'make_rate',
      grade: 'dialed',
    },
    { id: 'r2', drill_title: LADDER.title, skipped: false, metric_value: null, feel: 3 },
  ]);
});

/** Stands in for homeFlow: owns the session, swaps it when the flow asks to continue. */
function Harness({ onContinueCalled }: { onContinueCalled?: () => void }) {
  const [session, setSession] = useState<PracticeSession>({ id: 'session-1' } as PracticeSession);
  const [context, setContext] = useState<ProgramContext>(STEP_ONE);

  return (
    <PracticeFlow
      onBack={jest.fn()}
      selectedIssue={ISSUE}
      selectedSession={session}
      programContext={context}
      onRequestContinue={async (advance) => {
        onContinueCalled?.();
        setSession({ id: 'session-2' } as PracticeSession);
        setContext({
          programId: 'program-1',
          stepId: advance.next_step!.id,
          drillIds: advance.next_step!.prescription.drill_ids ?? [],
          groovedBefore: advance.grooved_count,
        });
        return true;
      }}
    />
  );
}

/** Brief -> active -> rating -> logged, for the drill currently on screen. */
async function workOneDrill(view: ReturnType<typeof render> extends Promise<infer T> ? T : never) {
  // The how-to sheet opens itself on a new drill.
  await fireEvent.press(view.getByText('Got it'));
  await fireEvent.press(view.getByText('Start drill'));
  await fireEvent.press(view.getByText('Done with drill'));
}

describe('working through a step', () => {
  it('walks brief -> block -> rating and on to the second drill', async () => {
    const view = await render(<Harness />);

    await waitFor(() => expect(view.getByText('Drill 1 of 2')).toBeTruthy());
    await fireEvent.press(view.getByText('Got it'));

    // The brief carries the focus points and what will be recorded.
    expect(view.getByText('Each ball carries close to its target distance')).toBeTruthy();
    expect(view.getByText(/Afterwards you'll log how many of 10 you made/)).toBeTruthy();

    await fireEvent.press(view.getByText('Start drill'));
    expect(view.getByText('In progress')).toBeTruthy();

    await fireEvent.press(view.getByText('Done with drill'));
    // The reported bug: the question has to be here, with the input.
    expect(view.getByText('How many did you make?')).toBeTruthy();

    await fireEvent.press(view.getByText('8'));
    await fireEvent.press(view.getByText('Log it'));

    await waitFor(() => expect(view.getByText('Drill 2 of 2')).toBeTruthy());
    // The title shows in the header AND in the how-to sheet that auto-opens for a new
    // drill, so this is legitimately ambiguous.
    expect(view.getAllByText('Ladder Carry Drill').length).toBeGreaterThan(0);
  });

  it('reaches the completion screen after the last drill', async () => {
    const view = await render(<Harness />);
    await waitFor(() => expect(view.getByText('Drill 1 of 2')).toBeTruthy());

    await workOneDrill(view);
    await fireEvent.press(view.getByText('8'));
    await fireEvent.press(view.getByText('Log it'));

    await waitFor(() => expect(view.getByText('Drill 2 of 2')).toBeTruthy());
    await workOneDrill(view);
    // A feel-only drill: the picker completes the block.
    await fireEvent.press(view.getByText('Very good'));

    await waitFor(() => expect(view.getByText('Session complete')).toBeTruthy());
    expect(view.getByText('You worked 2 drills')).toBeTruthy();
    expect(view.getByText('Up next')).toBeTruthy();
    expect(view.getByText('Continue practice')).toBeTruthy();
    // Progress, and what moved: 3 -> 4 of 7. ("4" also appears as a count tile in other
    // states, so assert the delta sentence, which is unambiguous.)
    expect(view.getByText('One drill filled in.')).toBeTruthy();
    expect(view.getByText('/7')).toBeTruthy();
  });
});

describe('continuing into the next session', () => {
  /**
   * THE ASSERTION THAT CATCHES FINDING 1. Swapping the session prop is not enough: the flow
   * has to be told to go back to the practice screen, because currentIndex is local state.
   */
  it('returns to the drill screen rather than sitting on the completion screen', async () => {
    const onContinueCalled = jest.fn();
    const view = await render(<Harness onContinueCalled={onContinueCalled} />);
    await waitFor(() => expect(view.getByText('Drill 1 of 2')).toBeTruthy());

    await workOneDrill(view);
    await fireEvent.press(view.getByText('8'));
    await fireEvent.press(view.getByText('Log it'));
    await waitFor(() => expect(view.getByText('Drill 2 of 2')).toBeTruthy());
    await workOneDrill(view);
    await fireEvent.press(view.getByText('Very good'));

    await waitFor(() => expect(view.getByText('Continue practice')).toBeTruthy());
    await fireEvent.press(view.getByText('Continue practice'));

    expect(onContinueCalled).toHaveBeenCalled();
    await waitFor(() => expect(view.getByText('Drill 1 of 2')).toBeTruthy());
    expect(view.queryByText('Session complete')).toBeNull();
    expect(view.queryByText('Continue practice')).toBeNull();
  });

  it('starts a fresh session and does not refetch the drill list', async () => {
    const view = await render(<Harness />);
    await waitFor(() => expect(view.getByText('Drill 1 of 2')).toBeTruthy());

    await workOneDrill(view);
    await fireEvent.press(view.getByText('8'));
    await fireEvent.press(view.getByText('Log it'));
    await waitFor(() => expect(view.getByText('Drill 2 of 2')).toBeTruthy());
    await workOneDrill(view);
    await fireEvent.press(view.getByText('Very good'));
    await waitFor(() => expect(view.getByText('Continue practice')).toBeTruthy());

    const fetchesBefore = mockGetDrillsByIssue.mock.calls.length;
    await fireEvent.press(view.getByText('Continue practice'));
    await waitFor(() => expect(view.getByText('Drill 1 of 2')).toBeTruthy());

    // Same issue, so the list is already in hand: continuing must cost no round trip.
    expect(mockGetDrillsByIssue.mock.calls.length).toBe(fetchesBefore);
    // ...and the new session's drill runs are opened against the new session id.
    expect(mockStartDrillRun).toHaveBeenCalledWith('session-2', GATE.id);
  });
});

describe('when the plan cannot be advanced', () => {
  it('says the practice was saved but the plan did not move, and offers no Continue', async () => {
    mockCompleteStep.mockRejectedValue(new Error('500'));
    const view = await render(<Harness />);
    await waitFor(() => expect(view.getByText('Drill 1 of 2')).toBeTruthy());

    await workOneDrill(view);
    await fireEvent.press(view.getByText('8'));
    await fireEvent.press(view.getByText('Log it'));
    await waitFor(() => expect(view.getByText('Drill 2 of 2')).toBeTruthy());
    await workOneDrill(view);
    await fireEvent.press(view.getByText('Very good'));

    await waitFor(() => expect(view.getByText("Couldn't update your plan")).toBeTruthy());
    expect(view.getByText('Try again')).toBeTruthy();
    expect(view.queryByText('Continue practice')).toBeNull();
    expect(view.queryByText('Up next')).toBeNull();
    // The session still happened, and the screen still says so.
    expect(view.getByText("That's another square earned.")).toBeTruthy();
  });
});

describe('when the whole focus is finished', () => {
  it('shows a focus-complete state with no Continue', async () => {
    mockCompleteStep.mockResolvedValue({
      ...ADVANCE,
      next_step: null,
      program_status: 'completed',
      grooved_count: 7,
      total_drills: 7,
    });

    const view = await render(<Harness />);
    await waitFor(() => expect(view.getByText('Drill 1 of 2')).toBeTruthy());

    await workOneDrill(view);
    await fireEvent.press(view.getByText('8'));
    await fireEvent.press(view.getByText('Log it'));
    await waitFor(() => expect(view.getByText('Drill 2 of 2')).toBeTruthy());
    await workOneDrill(view);
    await fireEvent.press(view.getByText('Very good'));

    await waitFor(() => expect(view.getByText('Focus complete')).toBeTruthy());
    expect(view.getByText('Hold your finish')).toBeTruthy();
    expect(view.getByText('Back to my plan')).toBeTruthy();
    expect(view.queryByText('Continue practice')).toBeNull();
  });
});
