import { useState, useEffect } from 'react';
import { setAnalyticsConsent, getAnalyticsConsent } from '../../../lib/consent';

export function useConsentToggle() {
    const [consent, setConsent] = useState(null);
    const [pendingConsent, setPendingConsent] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchConsent() {
            const currentConsent = await getAnalyticsConsent();
            if (!cancelled) setConsent(currentConsent);
        }

        fetchConsent();
        return () => {
            cancelled = true;
        };
    }, []);

    // What the toggle currently shows in the UI
    const effectiveConsent = pendingConsent ?? consent;

    // Only show Save/Cancel when the pending value differs from saved value
    const hasChanges = pendingConsent !== null && pendingConsent !== consent;

    const handleToggle = () => {
        const next = !effectiveConsent;

        // If user toggles back to the saved value, clear pending state (auto-collapses)
        if (next === consent) {
            setPendingConsent(null);
        } else {
            setPendingConsent(next);
        }
    };

    const handleSave = async () => {
        if (!hasChanges) return;

        setIsSaving(true);
        try {
            setConsent(pendingConsent);
            await setAnalyticsConsent(pendingConsent);
            setPendingConsent(null);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setPendingConsent(null);
    };

    return {
        consent,
        effectiveConsent,
        hasChanges,
        isSaving,
        handleToggle,
        handleSave,
        handleCancel,
    };
}
