import { useCallback, useEffect, useRef, useState } from 'react';

import { useDrillRunActions } from 'features/drill/hooks/useDrillRunActions';
import type { DrillRun } from 'features/drill/types/DrillRun';
import { completeStep } from 'features/programs/services/programService';
import type { DrillGrade, ProgramContext, StepAdvance } from 'features/programs/types';

import type { BlockResult } from '../components/BlockRating';
import { endPracticeSession } from '../services/sessionService';
import type { PracticeSession } from '../types/Session';
import { feelToOrdinal } from '../utils/blockFeel';
import type { DrillQueue } from './useDrillQueue';

/**
 * Running the blocks: start a drill run, record what the golfer scored, move on.
 *
 * ONE STATUS, NOT TWO BOOLEANS. The hook this replaced returned `loading` and `error`
 * separately -- five loading sources OR'd together and four error sources OR'd together --
 * and the screen checked `loading` first. So a failure on the final drill left `finishing`
 * true forever, `loading` therefore true forever, and the error branch was never reached:
 * the golfer who had just finished their session sat on a spinner with no button, and the
 * completion guard blocked any retry. A union makes that state unrepresentable rather than
 * resolved by the order of two `if`s.
 *
 * WHY THIS LIVES IN THE FLOW, NOT THE SCREEN. A failed `completeStep` has to be retryable
 * from the completion screen, by which point the practice screen has unmounted. Mounting
 * the runner in `practiceFlow` lets it outlive the screen transition.
 */

export type PracticeStatus =
  | { kind: 'loading' }
  /** Last block logged; holding until navigation so the rating UI cannot flash back. */
  | { kind: 'finishing' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string; retry: (() => void) | null };

/**
 * How the session ended, handed to the completion screen.
 *
 * `groovedBefore` is captured when the session starts so the completion screen can show
 * what moved (`+1 · Gate Drill filled in`) rather than only a total the golfer cannot
 * explain. A drill fills in at strength 3 and only a `dialed` block adds one
 * (`backend/core/services/program_service.py:31-36`), so most sessions move nothing and
 * the screen has to be honest about that too.
 */
export type SessionOutcome =
  | { kind: 'advanced'; advance: StepAdvance; groovedBefore: number }
  | { kind: 'advance-failed'; retry: () => void }
  /** A session with no program behind it: nothing to advance, nothing to report. */
  | { kind: 'no-program' };

interface UsePracticeRunnerArgs {
  session: PracticeSession | null;
  queue: DrillQueue;
  programContext?: ProgramContext | null;
  onSessionCompleted: (outcome: SessionOutcome) => void;
}

export interface PracticeRunner {
  status: PracticeStatus;
  completeBlock: (result: BlockResult) => void;
}

export function usePracticeRunner({
  session,
  queue,
  programContext,
  onSessionCompleted,
}: UsePracticeRunnerArgs): PracticeRunner {
  const { startDrill, endDrill } = useDrillRunActions();

  const [run, setRun] = useState<DrillRun | null>(null);
  const [starting, setStarting] = useState<boolean>(false);
  const [finishing, setFinishing] = useState<boolean>(false);
  const [failure, setFailure] = useState<{ message: string; retry: (() => void) | null } | null>(
    null
  );

  // Which drill the current `run` belongs to, so the start effect is idempotent.
  const startedForRef = useRef<string | null>(null);
  // In-flight guard: stops a double tap on "Log it" submitting twice.
  const submittingRef = useRef<boolean>(false);
  // Runs whose submission fully SUCCEEDED. Unlike the old single-id guard this is only
  // written once everything landed, so a failed submission stays retryable.
  const settledRunsRef = useRef<Set<string>>(new Set());
  // Submitting the last block is three calls (end the drill, end the session, advance the
  // program) and any one of them can fail. These record which already landed so a retry
  // resumes rather than restarts -- re-ending a drill run that already has a completed_at
  // is not something to find out about in production. Getting this wrong is how the first
  // version of this hook blocked its own retry.
  const drillEndedRef = useRef<Set<string>>(new Set());
  const sessionEndedRef = useRef<boolean>(false);
  // Grades keyed by run id rather than pushed to an array, so retrying a failed block
  // cannot report the same grade twice.
  const gradesRef = useRef<Map<string, DrillGrade>>(new Map());
  // The block waiting to be recorded, kept so a retry resubmits the same numbers.
  const pendingRef = useRef<BlockResult | null>(null);

  const sessionId = session?.id ?? null;

  // A new session (continuing into the next step) resets everything. Keyed on the id
  // rather than object identity so an unrelated re-render cannot wipe a run in progress.
  useEffect(() => {
    startedForRef.current = null;
    submittingRef.current = false;
    settledRunsRef.current = new Set();
    drillEndedRef.current = new Set();
    sessionEndedRef.current = false;
    gradesRef.current = new Map();
    pendingRef.current = null;
    setRun(null);
    setStarting(false);
    setFinishing(false);
    setFailure(null);
  }, [sessionId]);

  const beginDrill = useCallback(
    async (drillId: string) => {
      if (!sessionId) return;
      try {
        setStarting(true);
        setFailure(null);
        startedForRef.current = drillId;
        const started = await startDrill(sessionId, drillId);
        setRun(started);
      } catch (err) {
        // Clear the marker so the retry below can start this drill again.
        startedForRef.current = null;
        setFailure({
          message: err instanceof Error ? err.message : 'Could not start that drill',
          retry: () => void beginDrill(drillId),
        });
      } finally {
        setStarting(false);
      }
    },
    [sessionId, startDrill]
  );

  const activeDrillId = queue.activeDrill?.id ?? null;

  useEffect(() => {
    if (!sessionId || !activeDrillId) return;
    if (startedForRef.current === activeDrillId) return;
    void beginDrill(activeDrillId);
  }, [sessionId, activeDrillId, beginDrill]);

  /**
   * Report the finished step back to the program.
   *
   * Failure here does NOT block the completion screen. The practice happened and the
   * session is saved; only the schedule did not move. The old code logged this to the
   * console and then congratulated the golfer anyway, which meant a plan that silently
   * stopped advancing looked exactly like one that was working.
   */
  const advanceProgram = useCallback(
    async (ctx: ProgramContext, practiceSessionId: string) => {
      const grades = Array.from(gradesRef.current.values());
      try {
        const advance = await completeStep(ctx.programId, ctx.stepId, {
          grades,
          practice_session_id: practiceSessionId,
        });
        onSessionCompleted({
          kind: 'advanced',
          advance,
          groovedBefore: ctx.groovedBefore,
        });
      } catch {
        onSessionCompleted({
          kind: 'advance-failed',
          retry: () => void advanceProgram(ctx, practiceSessionId),
        });
      }
    },
    [onSessionCompleted]
  );

  const submit = useCallback(
    async (result: BlockResult, currentRun: DrillRun) => {
      if (!session) return;
      if (submittingRef.current) return;
      if (settledRunsRef.current.has(currentRun.id)) return;

      submittingRef.current = true;
      const isLast = queue.isLastDrill;
      if (isLast) setFinishing(true);
      setFailure(null);

      const { feel, metricValue } = result;

      // A scored block sends the raw number and no grade: the server grades it against
      // the drill's current thresholds, because `grade_at` is admin-editable content
      // and an old build would otherwise judge against numbers nobody can see now.
      if (programContext && currentRun.drill_id) {
        if (metricValue !== null) {
          gradesRef.current.set(currentRun.id, {
            drill_id: currentRun.drill_id,
            metric_value: metricValue,
          });
        } else if (feel) {
          gradesRef.current.set(currentRun.id, {
            drill_id: currentRun.drill_id,
            grade: feel,
          });
        }
      }

      const completed: DrillRun = {
        ...currentRun,
        feel: feel ? feelToOrdinal(feel) : null,
        metric_value: metricValue,
        successful_reps: 0,
        failed_reps: 0,
      };

      try {
        if (!drillEndedRef.current.has(currentRun.id)) {
          await endDrill(completed);
          drillEndedRef.current.add(currentRun.id);
        }

        if (!isLast) {
          settledRunsRef.current.add(currentRun.id);
          pendingRef.current = null;
          queue.advance();
          return;
        }

        if (!sessionEndedRef.current) {
          await endPracticeSession(session.id);
          sessionEndedRef.current = true;
        }

        settledRunsRef.current.add(currentRun.id);
        pendingRef.current = null;

        if (programContext) {
          await advanceProgram(programContext, session.id);
        } else {
          onSessionCompleted({ kind: 'no-program' });
        }
      } catch (err) {
        // The golfer hit the balls. Losing the block because the network blinked is
        // the one outcome worth building a retry for -- and `finishing` has to come
        // back down or the union collapses to a permanent spinner again.
        setFinishing(false);
        setFailure({
          message: err instanceof Error ? err.message : 'Could not save that drill',
          retry: () => {
            const pending = pendingRef.current;
            if (pending) void submit(pending, currentRun);
          },
        });
      } finally {
        submittingRef.current = false;
      }
    },
    [session, queue, programContext, endDrill, advanceProgram, onSessionCompleted]
  );

  const completeBlock = useCallback(
    (result: BlockResult) => {
      if (!run) return;
      pendingRef.current = result;
      void submit(result, run);
    },
    [run, submit]
  );

  let status: PracticeStatus;
  if (failure) {
    // Checked FIRST, and it is a separate variant rather than a second boolean, so no
    // future flag added to the loading side can hide it again.
    status = { kind: 'error', message: failure.message, retry: failure.retry };
  } else if (queue.error) {
    status = { kind: 'error', message: queue.error, retry: queue.retryLoad };
  } else if (finishing) {
    status = { kind: 'finishing' };
  } else if (queue.loading || starting || !run) {
    status = { kind: 'loading' };
  } else {
    status = { kind: 'ready' };
  }

  return { status, completeBlock };
}
