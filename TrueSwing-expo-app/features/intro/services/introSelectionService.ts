import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The intro's two pieces of local state, both of which have to survive the leap
 * from signed-out to signed-in:
 *
 *   seen      — whether this device has been through the intro at all, so it is
 *               shown once rather than on every visit to the sign-in screen.
 *   selection — the focus the golfer picked before they had an account. There is
 *               no server to write it to yet, so it waits here until the first
 *               authenticated mount starts it (see useApplyIntroSelection).
 *
 * Device-scoped, not account-scoped: a golfer who signs out and back in on the
 * same phone has already seen this.
 */

/** Bump both when the stored shape changes, so an older blob is ignored rather
 *  than half-read — the same reason `taxonomyService` versions its cache key. */
export const INTRO_STORAGE_VERSION = 1;
export const INTRO_SEEN_KEY = `intro.seen.v${INTRO_STORAGE_VERSION}`;
export const INTRO_SELECTION_KEY = `intro.selection.v${INTRO_STORAGE_VERSION}`;

/** A focus point chosen in the intro, waiting to be started on an account.
 *  `areaKey` rides along so home can open on that area afterwards without
 *  re-resolving the issue. */
export type IntroSelection = {
    issueId: string;
    areaKey: string;
    /** ISO timestamp. Read by `isStale` below. */
    savedAt: string;
};

/** How long a pending pick stays worth applying. A phone that sat on the intro
 *  for a month has an issue id that may no longer exist, and a golfer who signs
 *  up that much later does not remember choosing it. */
const MAX_PENDING_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function isSelection(value: unknown): value is IntroSelection {
    if (!value || typeof value !== "object") return false;
    const sel = value as Record<string, unknown>;
    return (
        typeof sel.issueId === "string" &&
        typeof sel.areaKey === "string" &&
        typeof sel.savedAt === "string"
    );
}

function isStale(selection: IntroSelection): boolean {
    const savedAt = Date.parse(selection.savedAt);
    if (Number.isNaN(savedAt)) return true;
    return Date.now() - savedAt > MAX_PENDING_AGE_MS;
}

/** Whether this device has been through the intro. Never throws: a storage
 *  failure has to read as "not seen", because showing the intro twice is a far
 *  smaller cost than a blank first launch. */
export async function hasSeenIntro(): Promise<boolean> {
    try {
        return (await AsyncStorage.getItem(INTRO_SEEN_KEY)) === "1";
    } catch {
        return false;
    }
}

/** Mark the intro done. Best-effort: called on both the finish and skip paths. */
export async function markIntroSeen(): Promise<void> {
    try {
        await AsyncStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
        // Costs a second showing of the intro, nothing more.
    }
}

/**
 * Hold the golfer's pick until they have an account.
 *
 * Throws on a storage failure, unlike everything else here — the caller shows a
 * message and keeps the golfer on the screen. Silently swallowing it would send
 * them through sign-up believing they had chosen a focus, and land them on an
 * empty home screen with no way to know why.
 */
export async function savePendingSelection(issueId: string, areaKey: string): Promise<void> {
    const selection: IntroSelection = { issueId, areaKey, savedAt: new Date().toISOString() };
    await AsyncStorage.setItem(INTRO_SELECTION_KEY, JSON.stringify(selection));
}

/** The pending pick, or null when there isn't a usable one. A stale or malformed
 *  blob is cleared here rather than returned, so it cannot be retried forever. */
export async function readPendingSelection(): Promise<IntroSelection | null> {
    try {
        const raw = await AsyncStorage.getItem(INTRO_SELECTION_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isSelection(parsed) || isStale(parsed)) {
            await clearPendingSelection();
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

/** Drop the pending pick. Called once it has been started on an account, or once
 *  it is clear it never will be. */
export async function clearPendingSelection(): Promise<void> {
    try {
        await AsyncStorage.removeItem(INTRO_SELECTION_KEY);
    } catch {
        // Next launch retries; `readPendingSelection` ages it out regardless.
    }
}
