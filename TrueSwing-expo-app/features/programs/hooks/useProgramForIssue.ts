import { useState, useEffect, useCallback } from "react";
import { getActiveProgram, getNextStep } from "../services/programService";
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
 */
export function useProgramForIssue(analysisIssueId: string | null | undefined): UseProgramForIssueReturn {
    const [program, setProgram] = useState<Program | null>(null);
    const [nextStep, setNextStep] = useState<ProgramStep | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nonce, setNonce] = useState(0);

    const refetch = useCallback(() => setNonce((n) => n + 1), []);

    useEffect(() => {
        let active = true;

        if (!analysisIssueId) {
            setProgram(null);
            setNextStep(null);
            setError(null);
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const prog = await getActiveProgram(analysisIssueId);
                if (!active) return;
                setProgram(prog);

                const step = prog ? await getNextStep(prog.id) : null;
                if (!active) return;
                setNextStep(step);
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

    return { program, nextStep, loading, error, refetch };
}

export default useProgramForIssue;
