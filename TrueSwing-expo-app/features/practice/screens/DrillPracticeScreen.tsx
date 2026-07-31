
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
import { FEEL_LABEL, type BlockFeel } from "../utils/blockFeel";
import type { ProgramContext } from "features/programs/types";

type Props = ScreenProps & {
  issue: Issue;
  session: PracticeSession;
  programContext?: ProgramContext | null;
}

type BlockPhase = "ready" | "active" | "rating";

const FEEL_ORDER: BlockFeel[] = ["rough", "ok", "dialed"];

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

  const handleRate = (feel: BlockFeel | null) => {
    if (disabled) return;
    props.completeBlock(feel);
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Not while the How-To modal is open: a native Modal detaches this view tree,
          which freezes the Reanimated loop. Remounting on close restarts it cleanly. */}
      {phase === "active" && !isInstructionsVisible && <ActiveBlockGlow />}

      <View className="flex-1 px-5 pt-8 pb-6 justify-between">
        {/* Header */}
        <View className="px-4 pt-12">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-slate-500">
                Drill {props.drillNumber} of {props.totalDrills}
              </Text>

              <Text
                numberOfLines={2}
                className="mt-2 text-[30px] font-display-bold leading-[36px] text-white"
              >
                {props.activeDrill?.title}
              </Text>
            </View>

            <Pressable
              onPress={onOpenInstructions}
              className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3.5 py-3 active:bg-slate-800"
            >
              <ClipboardList size={17} color="#cbd5e1" />
              <Text className="text-sm font-semibold text-slate-200">
                How To
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Center focus area */}
        <View className="flex-1 items-center justify-center px-2">
          {phase === "ready" && (
            <>
              <Text className="text-sm uppercase tracking-[2px] text-slate-500">
                Your focus
              </Text>
              <Text className="mt-4 text-center text-2xl font-display-bold leading-8 text-white">
                {props.activeDrill?.success_signal ?? props.activeDrill?.task}
              </Text>
              <Text className="mt-5 text-center text-sm leading-5 text-slate-400">
                Hit about 10 balls with total focus. Tap start when you’re ready to begin the block.
              </Text>
            </>
          )}

          {phase === "active" && (
            <>
              <Text className="text-sm uppercase tracking-[2px] text-slate-500">
                Block in progress
              </Text>
              <MotiText
                from={{ opacity: 0.55 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 1400, loop: true, repeatReverse: true }}
                className="mt-4 text-center text-2xl font-display-bold leading-8 text-white"
              >
                Eyes on the ball.
              </MotiText>
              <Text className="mt-5 text-center text-sm leading-5 text-slate-400">
                Work through your block. Tap done when you’ve hit about 10 balls.
              </Text>
            </>
          )}

          {phase === "rating" && (
            <>
              <Text className="text-sm uppercase tracking-[2px] text-slate-500">
                Optional
              </Text>
              <Text className="mt-4 text-center text-2xl font-display-bold leading-8 text-white">
                How did that block feel?
              </Text>
            </>
          )}

          {!props.practiceReady && (
            <Text className="mt-6 text-center text-sm text-amber-300">
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
              className={`flex-row items-center justify-center gap-3 rounded-3xl h-20 ${disabled ? "bg-emerald-500/40" : "bg-emerald-500 active:bg-emerald-600"
                }`}
            >
              <Play size={26} color="white" fill="white" />
              <Text className="text-xl font-bold text-white">Start block</Text>
            </Pressable>
          )}

          {phase === "active" && (
            <Pressable
              disabled={disabled}
              onPress={() => setPhase("rating")}
              className={`items-center justify-center rounded-3xl h-20 ${disabled ? "bg-white/20" : "bg-white active:opacity-80"
                }`}
            >
              <Text className="text-xl font-bold text-slate-950">Done with block</Text>
            </Pressable>
          )}

          {phase === "rating" && (
            <View>
              <View className="flex-row gap-3">
                {FEEL_ORDER.map((feel) => (
                  <Pressable
                    key={feel}
                    disabled={disabled}
                    onPress={() => handleRate(feel)}
                    className={`flex-1 items-center justify-center rounded-3xl h-24 border border-white/10 ${disabled ? "bg-white/5" : "bg-slate-900 active:bg-slate-800"
                      }`}
                  >
                    <Text className="text-lg font-bold text-white">
                      {FEEL_LABEL[feel]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                disabled={disabled}
                onPress={() => handleRate(null)}
                className="mt-3 items-center justify-center py-3 active:opacity-70"
              >
                <Text className="text-base font-medium text-slate-400">
                  Skip rating
                </Text>
              </Pressable>
            </View>
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
