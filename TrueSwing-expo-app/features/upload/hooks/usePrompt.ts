import type { Prompt } from "../types";
import { useState, useCallback } from "react";

export type UsePromptReturn = {
    prompt: Prompt;
    setDesiredShot: (shot: string) => void;
    setMiss: (miss: string) => void;
    setExtra: (extra: string) => void;
    setStartTime: (start_time: number) => void;
    setEndTime: (end_time: number) => void;
}

export function usePrompt() {
    const [prompt, setPrompt] = useState<Prompt>({
        desired_shot: "",
        miss: "",
        extra: "",
        start_time: 0,
        end_time: 0
    });

    const setDesiredShot = useCallback((shot: string) => setPrompt(prev => ({ ...prev, desired_shot: shot })), []);
    const setMiss = useCallback((miss: string) => setPrompt(prev => ({ ...prev, miss })), []);
    const setExtra = useCallback((extra: string) => setPrompt(prev => ({ ...prev, extra })), []);

    const setStartTime = useCallback((start_time: number) => setPrompt(prev => ({ ...prev, start_time })), []);
    const setEndTime = useCallback((end_time: number) => setPrompt(prev => ({ ...prev, end_time })), []);

    return {
        prompt,
        setDesiredShot,
        setMiss,
        setExtra,
        setStartTime,
        setEndTime
     } as UsePromptReturn;
}