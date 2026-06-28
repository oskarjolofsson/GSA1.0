// One-shot "the user is going to re-film for this program step" intent. Set when
// the retest modal's "Film now" routes to the Upload tab; consumed exactly once by
// the upload flow when an upload actually succeeds, so credit (square + advance)
// follows the real work, not the tap. Cleared on bail (home regains focus).

export type RetestIntent = {
    analysisIssueId: string;
    programId: string;
    stepId: string;
};

let pending: RetestIntent | null = null;

export function setRetestIntent(intent: RetestIntent): void {
    pending = intent;
}

export function consumeRetestIntent(): RetestIntent | null {
    const value = pending;
    pending = null;
    return value;
}

export function clearRetestIntent(): void {
    pending = null;
}
