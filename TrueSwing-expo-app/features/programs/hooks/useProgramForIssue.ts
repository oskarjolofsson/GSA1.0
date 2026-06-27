import { useState, useEffect, useCallback } from "react";
import { getActiveProgram, getNextStep, peekProgramSession } from "../services/programService";
import type { Program, ProgramStep } from "../types";

interface UseProgramForIssueReturn {
    program: Program | null;
    nextStep: ProgramStep | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Loads the active program (if any) and its next scheduled step for an issue,
 * for display on the home card. Returns nulls cleanly when the issue has no
 * program yet (the `/active/` null contract) — the card then shows "Start your
 * plan". Read-only: never generates a program.
 *
 * `loadedId` guards against showing the previous issue's data while a new issue
 * is loading: until the loaded data matches the requested issue, `loading` is
 * true and the card shows its loading state instead of stale content.
 */
export function useProgramForIssue(analysisIssueId: string | null | undefined): UseProgramForIssueReturn {
    const [program, setProgram] = useState<Program | null>(null);
    const [nextStep, setNextStep] = useState<ProgramStep | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadedId, setLoadedId] = useState<string | null>(null);
    const [nonce, setNonce] = useState(0);

    const refetch = useCallback(() => setNonce((n) => n + 1), []);

    useEffect(() => {
        let active = true;

        if (!analysisIssueId) {
            setProgram(null);
            setNextStep(null);
            setError(null);
            setLoading(false);
            setLoadedId(null);
            return;
        }

        // Fresh cache hit: render instantly, no loading flash, no stale content.
        const cached = peekProgramSession(analysisIssueId);
        if (cached) {
            setProgram(cached.program);
            setNextStep(cached.nextStep);
            setError(null);
            setLoading(false);
            setLoadedId(analysisIssueId);
            return;
        }

        // Cache miss: clear the previous issue's content so the card shows the
        // loading state rather than the old drill while we fetch.
        setProgram(null);
        setNextStep(null);
        setLoading(true);
        setError(null);

        const load = async () => {
            try {
                const prog = await getActiveProgram(analysisIssueId);
                if (!active) return;
                setProgram(prog);

                const step = prog ? await getNextStep(prog.id) : null;
                if (!active) return;
                setNextStep(step);
                setLoadedId(analysisIssueId);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Failed to load program");
                setProgram(null);
                setNextStep(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [analysisIssueId, nonce]);

    // While the loaded state still belongs to the previous issue (the effect runs
    // after render), prefer a synchronous cache hit so a re-viewed issue renders
    // immediately with no loading flash. Only show loading when nothing is cached
    // yet for the requested issue.
    if (analysisIssueId && loadedId !== analysisIssueId) {
        const cached = peekProgramSession(analysisIssueId);
        if (cached) {
            return { program: cached.program, nextStep: cached.nextStep, loading: false, error: null, refetch };
        }
        return { program: null, nextStep: null, loading: true, error: null, refetch };
    }

    return { program, nextStep, loading, error, refetch };
}

export default useProgramForIssue;
