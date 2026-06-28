import { startPracticeSession, endPracticeSession } from "features/practice/services/sessionService";
import { completeStep } from "./programService";
import type { RetestIntent } from "../retestIntent";

// Credit a re-test once the swing has actually been uploaded: log a completed
// `retest` session (earns the streak square) and advance the program step.
export async function logRetestUpload({ analysisIssueId, programId, stepId }: RetestIntent): Promise<void> {
    const session = await startPracticeSession(analysisIssueId, { session_type: "retest" });
    await endPracticeSession(session.id);
    await completeStep(programId, stepId, { practice_session_id: session.id });
}
