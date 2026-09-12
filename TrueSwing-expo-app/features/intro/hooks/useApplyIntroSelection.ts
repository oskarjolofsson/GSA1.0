import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { generateProgramFromIssue, listPrograms } from "features/programs/services/programService";
import { ApiError } from "lib/errors";

import {
    clearPendingSelection,
    readPendingSelection,
} from "../services/introSelectionService";

/** idle: nothing was waiting. applying: starting it. done: this mount is finished. */
export type ApplyState = "checking" | "applying" | "done";

/** Ask before overwriting an account that already has something on it — a
 *  device-scoped pending selection has no idea whether the session it lands on
 *  is the fresh signup it assumed, or an existing account someone signed into
 *  instead (see the "already have an account" path on the welcome screen).
 *  `listPrograms` is the same read the home screen's own emptiness check
 *  would make; a non-empty list is "this account has been used". A failed
 *  check applies without asking rather than blocking the golfer over it — the
 *  same non-blocking stance every other failure path here takes. */
async function accountHasExistingData(): Promise<boolean> {
    try {
        return (await listPrograms()).length > 0;
    } catch {
        return false;
    }
}

/** Resolves once the golfer answers, `true` for "apply it anyway". */
function confirmOverwrite(): Promise<boolean> {
    return new Promise((resolve) => {
        Alert.alert(
            "You already have an account",
            "This account already has programs on it. Apply the focus you picked during setup anyway?",
            [
                { text: "Not now", style: "cancel", onPress: () => resolve(false) },
                { text: "Apply it", onPress: () => resolve(true) },
            ]
        );
    });
}

/**
 * Start the focus the golfer picked in the intro, once they have an account.
 *
 * This is the second half of the pre-signup pick: the intro could only write the
 * issue id to the device, because there was no account to attach it to. The first
 * authenticated mount is where it becomes a real program, via exactly the call
 * the library's Start button makes.
 *
 * Runs at most once per mount (`attempted`), because it is mounted above a
 * navigator that re-renders often and starting a program is a POST.
 *
 * Failure never blocks the golfer — they still reach their home screen, just
 * without the focus started. What differs is whether the pick is kept:
 *
 *   ApiError      the server refused (issue gone, area full, no entitlement).
 *                 Retrying next launch would refuse identically, so the pick is
 *                 dropped rather than left to fail on every cold start forever.
 *   anything else offline or a dropped request. Kept, and the next launch retries.
 */
export function useApplyIntroSelection(): { state: ApplyState } {
    const [state, setState] = useState<ApplyState>("checking");
    const attempted = useRef(false);

    const apply = useCallback(async () => {
        const selection = await readPendingSelection();
        if (!selection) {
            setState("done");
            return;
        }

        if (await accountHasExistingData()) {
            const proceed = await confirmOverwrite();
            if (!proceed) {
                // A deliberate "no" — don't ask again on every future launch.
                await clearPendingSelection();
                setState("done");
                return;
            }
        }

        setState("applying");
        try {
            await generateProgramFromIssue(selection.issueId);
            await clearPendingSelection();
        } catch (err) {
            if (err instanceof ApiError) await clearPendingSelection();
            // Deliberately not surfaced. The golfer has just signed up and has no
            // idea a program was being created; an error about one would be the
            // first thing the product ever said to them.
            console.warn("Could not start the focus picked in the intro:", err);
        } finally {
            setState("done");
        }
    }, []);

    useEffect(() => {
        if (attempted.current) return;
        attempted.current = true;
        apply();
    }, [apply]);

    return { state };
}
