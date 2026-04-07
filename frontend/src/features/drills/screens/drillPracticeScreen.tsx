import ProgressBar from "../components/practicePage/progressbar";
import DrillPopup from "../components/practicePage/instructions";
import PracticeActionCard from "../components/practicePage/practiceActioncard";
import { ErrorState } from "@/shared/components/cards/error";
import { LoadingState } from "@/shared/components/cards/loading";
import { usePracticeScreenState } from "../hooks/usePracticeScreenState";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useAwakeScreen from "../hooks/useAwakeScreen";

export default function DrillsPracticeScreen() {
    const [searchParams] = useSearchParams();
    const issueId = searchParams.get("issueId");
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
    useAwakeScreen();

    const {
        activeDrill,
        progress,
        handleSuccess,
        handleFailure,
        loading,
        error,
    } = usePracticeScreenState(issueId || "");

    useEffect(() => {
        setIsInstructionsOpen(true);
    }, [activeDrill?.id]);

    if (!issueId) {
        return (
            <ErrorState
                title="Issue Not Found"
                error={new Error("Issue ID is required to load drills")}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (loading) {
        return (
            <LoadingState
                title="Loading Drills"
                message="Fetching drills for this issue..."
            />
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load Drills"
                error={new Error(error)}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (!activeDrill) {
        return (
            <ErrorState
                title="No Drills Found"
                error={new Error("No drills are available for this issue.")}
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="h-[100dvh] overflow-hidden text-slate-100 reminder">
            <div className="mx-auto grid h-full w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)] gap-3 px-4 py-3 md:gap-4 md:px-6 md:py-6">
                <div className="min-h-0">
                    <ProgressBar
                        succeeded={progress.succeeded}
                        failed={progress.failed}
                        total={progress.total}
                    />
                </div>

                <div className="min-h-0 grid gap-2 sm:gap-3 grid-rows-[1fr_auto_1fr] [@media(orientation:landscape)]:grid-rows-none [@media(orientation:landscape)]:grid-cols-[1fr_minmax(130px,0.46fr)_1fr] min-[900px]:grid-rows-none min-[900px]:grid-cols-[1fr_minmax(150px,0.55fr)_1fr] pb-4 sm:pb-6">
                    <PracticeActionCard
                        type="success"
                        title="Successful"
                        description="Hips maintain depth and do not move closer to the ball. Chest stays down and posture is maintained. Contact feels more centered and controlled."
                        onClick={handleSuccess}
                    />

                    <PracticeActionCard
                        type="instructions"
                        title=""
                        description=""
                        onClick={() => setIsInstructionsOpen(true)}
                        compact
                    />

                    <PracticeActionCard
                        type="fail"
                        title="Unsuccessful"
                        description="Hips move toward the ball during the downswing (early extension). Chest lifts up out of posture. Contact becomes inconsistent or thin."
                        onClick={handleFailure}
                    />
                </div>
            </div>

            <DrillPopup
                title={activeDrill.title}
                instructions={activeDrill.task}
                isOpen={isInstructionsOpen}
                onClose={() => setIsInstructionsOpen(false)}
            />
        </div>
    );
}