import { ClipboardList } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Drill } from 'features/drill/types/Drill';
import ErrorState from 'features/shared/components/ErrorState';
import LoadingState from 'features/shared/components/LoadingState';

import ActiveBlockGlow from '../components/ActiveBlockGlow';
import BlockRating, { type BlockResult } from '../components/BlockRating';
import DrillBrief from '../components/DrillBrief';
import DrillInProgress from '../components/DrillInProgress';
import DrillInstructionsOverlay from '../components/DrillInstructionsOverlay';
import type { PracticeStatus } from '../hooks/usePracticeRunner';

/**
 * One drill block, in three phases: read the brief, hit the balls, record what happened.
 *
 * PRESENTATIONAL. The drill queue and the run lifecycle live in `practiceFlow`, because a
 * failed plan advance has to stay retryable from the completion screen -- by which point
 * this screen has unmounted.
 *
 *   [ready] --Start drill--> [active] --Done with drill--> [rating] --Log it/Skip--> next
 *      ^                                                                              |
 *      +---------------------------- new drill id ------------------------------------+
 *
 * Status is a single union, so the old failure mode is gone by construction: `loading` and
 * `error` used to be separate booleans checked in that order, so a failure on the final drill
 * left the screen on a spinner that could never resolve.
 */

type BlockPhase = 'ready' | 'active' | 'rating';

type Props = {
  status: PracticeStatus;
  activeDrill: Drill | null;
  drillNumber: number;
  totalDrills: number;
  onCompleteBlock: (result: BlockResult) => void;
  /** Leaves practice entirely. Used when a failure has no retry to offer. */
  onGiveUp: () => void;
};

export default function DrillPracticeScreen({
  status,
  activeDrill,
  drillNumber,
  totalDrills,
  onCompleteBlock,
  onGiveUp,
}: Props) {
  const [isInstructionsVisible, setInstructionsVisible] = useState(false);
  const [phase, setPhase] = useState<BlockPhase>('ready');
  const previousDrillIdRef = useRef<string | null>(null);

  // A new drill is a fresh block: back to the brief, and surface the how-to once.
  useEffect(() => {
    const drillId = activeDrill?.id ?? null;
    if (!drillId) {
      previousDrillIdRef.current = null;
      return;
    }
    if (previousDrillIdRef.current !== drillId) {
      previousDrillIdRef.current = drillId;
      setPhase('ready');
      setInstructionsVisible(true);
    }
  }, [activeDrill?.id]);

  if (status.kind === 'error') {
    return (
      <ErrorState
        title="Couldn't save that drill"
        message="You hit the balls. We just couldn't reach the server."
        buttonText={status.retry ? 'Try again' : 'End practice session'}
        onRetry={status.retry ?? onGiveUp}
      />
    );
  }

  if (status.kind === 'finishing') return <LoadingState title="Saving your session..." />;
  if (status.kind === 'loading') return <LoadingState title="Loading practice session..." />;

  const ready = status.kind === 'ready';

  return (
    <View className="flex-1 bg-ink">
      {/* Not while the How-To modal is open: a native Modal detaches this view tree,
                which freezes the Reanimated loop. Remounting on close restarts it cleanly. */}
      {phase === 'active' && !isInstructionsVisible && <ActiveBlockGlow />}

      <View className="flex-1 px-5 pb-6 pt-12">
        {/* The title gets the full width. It shared a row with the How To button,
                    which stole enough of it that a two-word drill name wrapped at an awkward
                    point -- two lines is expected for a 30px Fraunces heading, but not two
                    lines forced by a button beside it. */}
        <View>
          <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
            Drill {drillNumber} of {totalDrills}
          </Text>

          <Text
            numberOfLines={2}
            className="mt-2 font-display-bold text-[30px] leading-[36px] text-sand">
            {activeDrill?.title}
          </Text>

          <Pressable
            onPress={() => setInstructionsVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="How to do this drill"
            className="mt-3.5 flex-row items-center gap-2 self-start border-b border-sand/[.35] pb-1"
            style={{ minHeight: 24 }}>
            <ClipboardList size={15} color="#EADFC8" />
            <Text className="font-sans-semibold text-[13px] text-sand">How to</Text>
          </Pressable>
        </View>

        <View className="mt-6 flex-1">
          {phase === 'ready' && (
            <DrillBrief
              drill={activeDrill}
              ready={ready}
              onStart={() => setPhase('active')}
              onOpenInstructions={() => setInstructionsVisible(true)}
            />
          )}

          {phase === 'active' && (
            <DrillInProgress
              drillTitle={activeDrill?.title ?? null}
              ready={ready}
              onDone={() => setPhase('rating')}
            />
          )}

          {phase === 'rating' && (
            <BlockRating
              // Remount per drill so a counted selection never carries into the
              // next block -- two putting drills in a row would otherwise open
              // pre-filled.
              key={activeDrill?.id}
              metric={activeDrill?.metric}
              disabled={!ready}
              onComplete={onCompleteBlock}
            />
          )}
        </View>
      </View>

      <DrillInstructionsOverlay
        visible={isInstructionsVisible}
        drill={activeDrill}
        onClose={() => setInstructionsVisible(false)}
      />
    </View>
  );
}
