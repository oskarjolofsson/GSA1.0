// features/privacy/aiConsentStorage.ts
import * as SecureStore from "expo-secure-store";

import type { AiConsent } from "features/privacy/types";

const AI_CONSENT_KEY = "trueswing_ai_consent";
const CURRENT_AI_CONSENT_VERSION = "ai-consent-v1";


export async function getAiConsent(): Promise<AiConsent | null> {
    const value = await SecureStore.getItemAsync(AI_CONSENT_KEY);

    if (!value) return null;

    try {
        return JSON.parse(value) as AiConsent;
    } catch {
        return null;
    }
}

export async function hasValidAiConsent(): Promise<boolean> {
    const consent = await getAiConsent();

    return (
        consent?.accepted === true &&
        consent.version === CURRENT_AI_CONSENT_VERSION
    );
}

export async function saveAiConsent(): Promise<void> {
    const consent: AiConsent = {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        version: CURRENT_AI_CONSENT_VERSION,
    };

    await SecureStore.setItemAsync(AI_CONSENT_KEY, JSON.stringify(consent));
}

export async function resetAiConsentForDebug() {
  await SecureStore.deleteItemAsync(AI_CONSENT_KEY);
}

export async function clearAiConsent(): Promise<void> {
    await SecureStore.deleteItemAsync(AI_CONSENT_KEY);
}