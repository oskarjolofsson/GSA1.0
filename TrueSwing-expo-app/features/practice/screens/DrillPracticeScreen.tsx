
import type { Issue } from "features/issues/types";
import { usePracticeScreenState } from "features/practice/hooks/usePracticeScreenState";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import type { ScreenProps } from "features/shared/types";
import type { PracticeSession } from "../types";
import DrillInstructionsOverlay from "../components/DrillInstructionsOverlay";
import ActiveBlockGlow from "../components/ActiveBlockGlow";
import { ClipboardList, Play } from "lucide-react-native";
import { MotiText } from "moti";
import type { ProgramContext } from "features/programs/types";
import BlockRating, { type BlockResult } from "../components/BlockRating";
import { asMetric, isRenderable, promptFor } from "../utils/drillMetric";

type Props = ScreenProps & {
  issue: Issue;
  session: PracticeSession;
  programContext?: ProgramContext | null;
}

type BlockPhase = "ready" | "active" | "rating";

// OnNext in this case is to go to the result screen
export default function DrillPracticeScreen({ issue, session, onNext, programContext }: Props) {
  const props = usePracticeScreenState(issue, session, onNext, programContext);
  const [isInstructionsVisible, setInstructionsVisible] = useState(false);
  const [phase, setPhase] = useState<BlockPhase>("ready");
  const previousDrillIdRef = useRef<string | null>(null);
  const hasDrill = !!props.activeDrill;
  const disabled = props.loading || !props.practiceReady || !hasDrill;

  // New drill = a fresh block. Reset to the ready state and surface the how-to once.
  useEffect(() => {
    const drillId = props.activeDrill?.id ?? null;
    if (!drillId) {
      previousDrillIdRef.current = null;
      return;
    }

    if (previousDrillIdRef.current !== drillId) {
      previousDrillIdRef.current = drillId;
      setPhase("ready");
      setInstructionsVisible(true);
    }
  }, [props.activeDrill?.id]);

  if (props.loading) return <LoadingState title="Loading practice session..." />;
  if (props.error) return <ErrorState title="Failed to load practice session" buttonText={"End Practice Session"} onRetry={onNext} />;

  const onOpenInstructions = () => setInstructionsVisible(true);

  const handleComplete = (result: BlockResult) => {
    if (disabled) return;
    props.completeBlock(result);
  };

  // A scored drill asks for a number ("How many did you make"); a feel drill asks how the
  // block felt. Unknown metric types fall through to the feel wording too, matching the
  // picker BlockRating falls back to.
  const metric = asMetric(props.activeDrill?.metric);
  const ratingPrompt = isRenderable(metric) ? promptFor(metric) : "How did that block feel?";

  return (
    <View className="flex-1 bg-ink">
      {/* Not while the How-To modal is open: a native Modal detaches this view tree,
          which freezes the Reanimated loop. Remounting on close restarts it cleanly. */}
      {phase === "active" && !isInstructionsVisible && <ActiveBlockGlow />}

      <View className="flex-1 px-5 pt-8 pb-6 justify-between">
        {/* Header */}
        <View className="px-4 pt-12">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
                Drill {props.drillNumber} of {props.totalDrills}
              </Text>

              <Text
                numberOfLines={2}
                className="mt-2 text-[30px] font-display-bold leading-[36px] text-sand"
              >
                {props.activeDrill?.title}
              </Text>
            </View>

            <Pressable
              onPress={onOpenInstructions}
              className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-ink-raised px-3.5 py-3 active:bg-white/10"
            >
              <ClipboardList size={17} color="#EADFC8" />
              <Text className="text-sm font-semibold text-sand">
                How To
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Center focus area */}
        <View className="flex-1 items-center justify-center px-2">
          {phase === "ready" && (
            <>
              <Text className="text-sm uppercase tracking-[2px] text-sand-dim">
                Your focus
              </Text>
              <Text className="mt-4 text-center text-2xl font-display-bold leading-8 text-sand">
                {props.activeDrill?.success_signal ?? props.activeDrill?.task}
              </Text>
              <Text className="mt-5 text-center text-sm leading-5 text-sand-dim">
                Hit about 10 balls with total focus. Tap start when you’re ready to begin the block.
              </Text>
            </>
          )}

          {phase === "active" && (
            <>
              <Text className="text-sm uppercase tracking-[2px] text-sand-dim">
                Block in progress
              </Text>
              <MotiText
                from={{ opacity: 0.55 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 1400, loop: true, repeatReverse: true }}
                className="mt-4 text-center text-2xl font-display-bold leading-8 text-sand"
              >
                Eyes on the ball.
              </MotiText>
              <Text className="mt-5 text-center text-sm leading-5 text-sand-dim">
                Work through your block. Tap done when you’ve hit about 10 balls.
              </Text>
            </>
          )}

          {phase === "rating" && (
            <>
              <Text className="text-sm uppercase tracking-[2px] text-sand-dim">
                Optional
              </Text>
              <Text className="mt-4 text-center text-2xl font-display-bold leading-8 text-sand">
                {ratingPrompt}
              </Text>
            </>
          )}

          {!props.practiceReady && (
            <Text className="mt-6 text-center text-sm text-gold">
              Practice is not ready yet
            </Text>
          )}
        </View>

        {/* Bottom actions */}
        <View>
          {phase === "ready" && (
            <Pressable
              disabled={disabled}
              onPress={() => setPhase("active")}
              className={`flex-row items-center justify-center gap-3 rounded-3xl h-20 ${disabled ? "bg-gold/30" : "bg-gold active:bg-gold-deep"
                }`}
            >
              <Play size={26} color="#0A0F1A" fill="#0A0F1A" />
              <Text className="text-xl font-sans-bold text-ink">Start block</Text>
            </Pressable>
          )}

          {phase === "active" && (
            <Pressable
              disabled={disabled}
              onPress={() => setPhase("rating")}
              className={`items-center justify-center rounded-3xl h-20 ${disabled ? "bg-sand/20" : "bg-sand active:opacity-80"
                }`}
            >
              <Text className="text-xl font-sans-bold text-ink">Done with block</Text>
            </Pressable>
          )}

          {phase === "rating" && (
            <BlockRating
              // Remount per drill so a counted selection never carries into the next
              // block — two putting drills in a row would otherwise open pre-filled.
              key={props.activeDrill?.id}
              metric={props.activeDrill?.metric}
              disabled={disabled}
              onComplete={handleComplete}
            />
          )}
        </View>
      </View>

      <DrillInstructionsOverlay
        visible={isInstructionsVisible}
        drill={props.activeDrill}
        onClose={() => setInstructionsVisible(false)}
      />
    </View>
  );
}
