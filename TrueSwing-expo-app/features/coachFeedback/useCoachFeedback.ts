import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import {
    structureFeedback,
    createCustomIssue,
    type FeedbackDraft,
    type DraftIssue,
    type DraftDrill,
    type CatalogIssue,
} from "features/issues/services/issueAuthoringService";
import { generateProgramFromIssue } from "features/programs/services/programService";
import { getErrorMessage } from "lib/errors";

type Image = { base64: string; mime: string } | null;

/**
 * Drives the coach-feedback flow: paste notes -> AI formats into an editable
 * draft (nothing saved) -> user edits/confirms -> a custom issue + program.
 * The AI only formats; all wording stays the user's to edit.
 */
export function useCoachFeedback() {
    const [text, setText] = useState("");
    const [image, setImage] = useState<Image>(null);
    const [draft, setDraft] = useState<FeedbackDraft | null>(null);
    const [structuring, setStructuring] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pickImage = useCallback(async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            base64: true,
            quality: 0.6,
        });
        if (res.canceled || !res.assets?.[0]?.base64) return;
        const asset = res.assets[0];
        setImage({ base64: asset.base64!, mime: asset.mimeType ?? "image/jpeg" });
    }, []);

    const clearImage = useCallback(() => setImage(null), []);

    const structure = useCallback(async () => {
        if (!text.trim()) return;
        setStructuring(true);
        setError(null);
        try {
            const result = await structureFeedback(text, image ?? undefined);
            setDraft(result);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setStructuring(false);
        }
    }, [text, image]);

    const setIssue = useCallback((patch: Partial<DraftIssue>) => {
        setDraft((d) => (d ? { ...d, issue: { ...d.issue, ...patch } } : d));
    }, []);

    const setDrill = useCallback((index: number, patch: Partial<DraftDrill>) => {
        setDraft((d) => {
            if (!d) return d;
            const drills = d.drills.map((dr, i) => (i === index ? { ...dr, ...patch } : dr));
            return { ...d, drills };
        });
    }, []);

    const removeDrill = useCallback((index: number) => {
        setDraft((d) => (d ? { ...d, drills: d.drills.filter((_, i) => i !== index) } : d));
    }, []);

    // "Use this existing focus instead": skip creating a custom issue and start a
    // program straight from the matched catalog issue (same as the browse path).
    const useSimilarIssue = useCallback(
        async (similar: CatalogIssue, onDone: () => void) => {
            setSubmitting(true);
            setError(null);
            try {
                await generateProgramFromIssue(similar.id);
                onDone();
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setSubmitting(false);
            }
        },
        []
    );

    // "Create mine": persist the edited draft as a custom issue, then start it.
    const confirm = useCallback(
        async (onDone: () => void) => {
            if (!draft) return;
            setSubmitting(true);
            setError(null);
            try {
                const created = await createCustomIssue(draft.issue, draft.drills);
                await generateProgramFromIssue(created.id);
                onDone();
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setSubmitting(false);
            }
        },
        [draft]
    );

    return {
        text, setText,
        image, pickImage, clearImage,
        draft,
        structuring, submitting, error,
        structure, setIssue, setDrill, removeDrill,
        useSimilarIssue, confirm,
    };
}
