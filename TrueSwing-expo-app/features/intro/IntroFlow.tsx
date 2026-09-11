import { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";

import { useAuth } from "features/auth/AuthProvider";
import { getErrorMessage } from "lib/errors";

import { useIntroFlowSequence } from "./hooks/useIntroFlowSequence";
import { useIntroCatalog } from "./hooks/useIntroCatalog";
import {
    hasSeenIntro,
    markIntroSeen,
    savePendingSelection,
} from "./services/introSelectionService";
import type { IntroArea, IntroBranch, IntroIssue } from "./services/introCatalogService";

import IntroWelcomeScreen from "./screens/IntroWelcomeScreen";
import IntroAreaScreen from "./screens/IntroAreaScreen";
import IntroGoalScreen from "./screens/IntroGoalScreen";
import IntroBranchScreen from "./screens/IntroBranchScreen";
import IntroFocusScreen from "./screens/IntroFocusScreen";

const SIGN_IN = "/(public)/sign-in" as const;

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
    const { currentScreen, goToWelcome, goToArea, goToGoal, goToBranch, goToFocus } =
        useIntroFlowSequence();
    const catalog = useIntroCatalog();

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
        <View style={{ flex: 1 }}>
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
        </View>
    );
}
