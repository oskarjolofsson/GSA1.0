import { useCallback, useEffect, useRef, useState } from "react";
import { View, Image, ActivityIndicator, type ImageSourcePropType } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "features/auth/AuthProvider";
import { getErrorMessage } from "lib/errors";

import { useIntroFlowSequence, type IntroScreen } from "./hooks/useIntroFlowSequence";
import { useIntroCatalog } from "./hooks/useIntroCatalog";
import {
    hasSeenIntro,
    markIntroSeen,
    savePendingSelection,
} from "./services/introSelectionService";
import type { IntroArea, IntroBranch, IntroIssue } from "./services/introCatalogService";

import IntroStepTransition from "./components/IntroStepTransition";
import IntroProgressDots from "./components/IntroProgressDots";
import IntroAmbientOverlay from "./components/IntroAmbientOverlay";
import IntroWelcomeScreen from "./screens/IntroWelcomeScreen";
import IntroAreaScreen from "./screens/IntroAreaScreen";
import IntroGoalScreen from "./screens/IntroGoalScreen";
import IntroBranchScreen from "./screens/IntroBranchScreen";
import IntroFocusScreen from "./screens/IntroFocusScreen";

const SIGN_IN = "/(public)/sign-in" as const;

// area/goal/branch/focus — welcome is the entry point, not a step to count.
const PICKABLE_STEPS: IntroScreen[] = ["area", "goal", "branch", "focus"];

// Metro needs each require() written out literally — a variable path won't
// resolve. One photo per picking step; welcome has its own bespoke hero.
const AMBIENT_IMAGE: Partial<Record<IntroScreen, ImageSourcePropType>> = {
    area: require("../../assets/hero/ambient-area.webp"),
    goal: require("../../assets/hero/ambient-goal.webp"),
    branch: require("../../assets/hero/ambient-branch.webp"),
    focus: require("../../assets/hero/ambient-focus.webp"),
};

/**
 * The pre-signup intro: welcome -> area -> goal -> branch -> focus -> sign up.
 *
 * The branch step mirrors the signed-in library's fork (`features/library/utils/
 * libraryFork.ts`): under "fix an issue" it narrows by miss, under "get better"
 * by goal, before the focus list.
 *
 * The pick cannot be sent anywhere yet — there is no account. It goes to the
 * device (`savePendingSelection`), and `useApplyIntroSelection` starts it on the
 * first authenticated mount, so the golfer's first home screen already has the
 * focus they chose rather than an empty plan and a tour of the tabs.
 *
 * Shown once per device. Every step can be skipped: nothing here is worth
 * standing between someone and the account they came to make.
 */
export default function IntroFlow() {
    const router = useRouter();
    const { session, loading } = useAuth();
    const { currentScreen, currentIndex, goToWelcome, goToArea, goToGoal, goToBranch, goToFocus } =
        useIntroFlowSequence();
    const catalog = useIntroCatalog();
    const insets = useSafeAreaInsets();
    const stepIndex = PICKABLE_STEPS.indexOf(currentScreen);

    // Direction the transition should slide: forward when the step index grew
    // since the last render, back when it shrank (or repeated, e.g. "Skip").
    const previousIndexRef = useRef(currentIndex);
    const direction: 1 | -1 = currentIndex >= previousIndexRef.current ? 1 : -1;
    // Welcome (index 0) is the one screen with its own separate hero image, not
    // the shared static background — a fade in or out of it is safe either way.
    const transitionVariant: "push" | "fade" =
        currentIndex === 0 || previousIndexRef.current === 0 ? "fade" : "push";
    useEffect(() => {
        previousIndexRef.current = currentIndex;
    }, [currentIndex]);

    // null while the flag is still being read — rendering the intro before that
    // resolves would flash it at golfers who have already been through it.
    const [seen, setSeen] = useState<boolean | null>(null);
    const [area, setArea] = useState<IntroArea | null>(null);
    const [kind, setKind] = useState<IntroIssue["kind"] | null>(null);
    const [branch, setBranch] = useState<IntroBranch | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        hasSeenIntro().then(setSeen);
    }, []);

    const leaveToSignIn = useCallback(async () => {
        await markIntroSeen();
        router.replace(SIGN_IN);
    }, [router]);

    const chooseArea = useCallback(
        (next: IntroArea) => {
            setArea(next);
            setKind(null);
            setBranch(null);
            setSelectedId(null);
            goToGoal();
        },
        [goToGoal]
    );

    const chooseKind = useCallback(
        (next: IntroIssue["kind"]) => {
            setKind(next);
            setBranch(null);
            setSelectedId(null);
            goToBranch();
        },
        [goToBranch]
    );

    const chooseBranch = useCallback(
        (next: IntroBranch) => {
            setBranch(next);
            setSelectedId(null);
            goToFocus();
        },
        [goToFocus]
    );

    const backToAreas = useCallback(() => {
        setSaveError(null);
        goToArea();
    }, [goToArea]);

    const backToGoal = useCallback(() => {
        setSaveError(null);
        goToGoal();
    }, [goToGoal]);

    const backToBranch = useCallback(() => {
        setSaveError(null);
        goToBranch();
    }, [goToBranch]);

    const confirm = useCallback(async () => {
        if (!selectedId || !area) return;
        setSaving(true);
        setSaveError(null);
        try {
            await savePendingSelection(selectedId, area.key);
            await leaveToSignIn();
        } catch (err) {
            // Kept on the screen deliberately. Walking on would take the golfer
            // through sign-up believing they had chosen a focus, and land them on
            // a home screen that never mentions it again.
            setSaveError(`We couldn't save that pick. ${getErrorMessage(err)}`);
        } finally {
            setSaving(false);
        }
    }, [selectedId, area, leaveToSignIn]);

    // An already-signed-in golfer reaching this route (deep link, or a stale
    // history entry) belongs in the app, not in onboarding.
    if (!loading && session) return <Redirect href="/" />;
    if (seen === null) {
        return (
            <View className="flex-1 items-center justify-center bg-ink">
                <ActivityIndicator color="#E4C892" />
            </View>
        );
    }
    if (seen) return <Redirect href={SIGN_IN} />;

    return (
        <View className="flex-1 bg-ink">
            {/* Overlaid, not part of the flow: every step's own header (via
                `IntroHeader` or the goal screen's own nav row) occupies the same
                44pt band starting at insets.top + 8, so centering the dots there
                lands them beside each back button without touching four screen
                files or double-applying the safe-area inset. */}
            {stepIndex >= 0 && (
                <>
                    {/* Static: never keyed by screen, never inside the sliding
                        transition. A background that animated WAS the bug —
                        opacity on a screen meant opacity on its darkening too,
                        so mid-transition the dimming visibly lifted. The photo
                        still changes per step, but as a hard cut, and the wash
                        + gradient on top of it never move at all. */}
                    <Image
                        source={AMBIENT_IMAGE[currentScreen]}
                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                        resizeMode="cover"
                    />
                    <IntroAmbientOverlay />
                </>
            )}
            {stepIndex >= 0 && (
                <View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        top: insets.top + 8,
                        left: 0,
                        right: 0,
                        height: 44,
                        justifyContent: "center",
                        zIndex: 10,
                    }}
                >
                    <IntroProgressDots total={PICKABLE_STEPS.length} current={stepIndex} />
                </View>
            )}
            <IntroStepTransition screenKey={currentScreen} direction={direction} variant={transitionVariant}>
            {currentScreen === "welcome" && (
                <IntroWelcomeScreen onStart={goToArea} onSignIn={leaveToSignIn} />
            )}
            {currentScreen === "area" && (
                <IntroAreaScreen
                    areas={catalog.areas}
                    status={catalog.status}
                    error={catalog.error}
                    onRetry={catalog.retry}
                    onSelect={chooseArea}
                    onBack={goToWelcome}
                    onSkip={leaveToSignIn}
                />
            )}
            {currentScreen === "goal" && area && (
                <IntroGoalScreen
                    areaLabel={area.golfer_label}
                    // A kind with nothing behind it in this area (e.g. an area
                    // that's skill-only, no faults catalogued yet) still shows,
                    // disabled — hiding it would look like the tap missed.
                    skillAvailable={catalog.branchesIn(area.key, "skill").length > 0}
                    faultAvailable={catalog.branchesIn(area.key, "fault").length > 0}
                    onSelect={chooseKind}
                    onBack={backToAreas}
                    onSkip={leaveToSignIn}
                />
            )}
            {currentScreen === "branch" && area && kind && (
                <IntroBranchScreen
                    areaLabel={area.golfer_label}
                    kind={kind}
                    branches={catalog.branchesIn(area.key, kind)}
                    onSelect={chooseBranch}
                    onBack={backToGoal}
                    onSkip={leaveToSignIn}
                />
            )}
            {currentScreen === "focus" && area && kind && branch && (
                <IntroFocusScreen
                    area={area}
                    kind={kind}
                    issues={catalog.issuesOn(area.key, kind, branch.key)}
                    selectedId={selectedId}
                    onSelect={(issue: IntroIssue) => setSelectedId(issue.id)}
                    saving={saving}
                    saveError={saveError}
                    onContinue={confirm}
                    onBack={backToBranch}
                    onSkip={leaveToSignIn}
                />
            )}
            </IntroStepTransition>
        </View>
    );
}
