
import type { Issue } from "features/issues/types";
import { usePracticeScreenState } from "features/practice/hooks/usePracticeScreenState";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import type { ScreenProps } from "features/shared/types";
import type { PracticeSession } from "../types";
import { ProgressBar } from "../components/ProgressBar";
import DrillInstructionsOverlay from "../components/DrillInstructionsOverlay";
import { CheckCircle2, XCircle, ClipboardList } from "lucide-react-native";
import { MotiText } from "moti";

type Props = ScreenProps & {
  issue: Issue;
  session: PracticeSession;
}

// OnNext in this case is to go to the result screen
export default function DrillPracticeScreen({ issue, session, onNext }: Props) {
  const props = usePracticeScreenState(issue, session, onNext);
  const [isInstructionsVisible, setInstructionsVisible] = useState(false);
  const previousDrillIdRef = useRef<string | null>(null);
  const hasDrill = !!props.activeDrill;
  const disabled = props.loading || !props.practiceReady || !hasDrill;

  useEffect(() => {
    const drillId = props.activeDrill?.id ?? null;
    if (!drillId) {
      previousDrillIdRef.current = null;
      return;
    }

    if (previousDrillIdRef.current !== drillId) {
      previousDrillIdRef.current = drillId;
      setInstructionsVisible(true);
    }
  }, [props.activeDrill?.id]);

  if (props.loading) return <LoadingState title="Loading practice session..." />;
  if (props.error) return <ErrorState title="Failed to load practice session" buttonText={"End Practice Session"} onRetry={onNext} />;

  const onOpenInstructions = () => {
    setInstructionsVisible(true);
  }

  const currentRep = props.progress.failed + props.progress.succeeded;


  return (
    <View className="flex-1 bg-slate-950">
      <View className="flex-1 px-5 pt-8 pb-6 justify-between">
        {/* Header */}
        <View className="px-4 pt-12">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-slate-500">
                Practice drill
              </Text>

              <Text
                numberOfLines={2}
                className="mt-2 text-[30px] font-extrabold leading-[36px] text-white"
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
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm uppercase tracking-[2px] text-slate-500">
            Current rep
          </Text>

          <MotiText
            key={currentRep}
            from={{ opacity: 0, translateY: 10, scale: 0.96 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: "timing", duration: 220 }}
            className="mt-3 text-8xl font-extrabold text-white"
          >
            {currentRep}
          </MotiText>


          {!props.practiceReady && (
            <Text className="mt-3 text-center text-sm text-amber-300">
              Practice is not ready yet
            </Text>
          )}
        </View>

        {/* Bottom actions */}
        <View>
          <ProgressBar succeeded={props.progress.succeeded} failed={props.progress.failed} total={props.progress.total} />

          <View className="flex-row gap-4">
            <Pressable
              disabled={disabled}
              onPress={props.handleSuccess}
              className={`flex-1 items-center justify-center rounded-3xl h-40 ${disabled ? "bg-emerald-500/40" : "bg-emerald-500 active:bg-emerald-600"
                }`}
            >
              <CheckCircle2 size={34} color="white" />
              <Text className="mt-3 text-xl font-bold text-white">GOOD</Text>
            </Pressable>

            <Pressable
              disabled={disabled}
              onPress={props.handleFailure}
              className={`flex-1 items-center justify-center rounded-3xl h-40 ${disabled ? "bg-rose-500/40" : "bg-rose-500 active:bg-rose-600"
                }`}
            >
              <XCircle size={34} color="white" />
              <Text className="mt-3 text-xl font-bold text-white">BAD</Text>
            </Pressable>
          </View>
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