import { auth } from "./firebase";
import userService from "../services/userService";

async function getAnalyticsConsent() {
    const cached = localStorage.getItem("analytics_consent");
    if (cached !== null) {
        return cached === "true";
    }

    const user = auth.currentUser;
    if (user) {
        try {
            const consent = await userService.getConsent();    
            localStorage.setItem("analytics_consent", consent.toString());
            return consent === "true";
        } catch (error) {
            console.error("Failed to fetch consent from server:", error);
            // Fallback: return false (deny tracking) on error as safe default
            return false;
        }
    }
    
    // No cached value and user not logged in - return false as safe default
    return false;
}

async function setAnalyticsConsent(consent) {
    consent = Boolean(consent);
    localStorage.setItem("analytics_consent", consent.toString());
    
    const user = auth.currentUser;
    if (user) {
        try {
            await userService.setConsent(consent);
        } catch (error) {
            console.error("Failed to save consent to server:", error);
            // Still saved locally, but warn user about sync failure
        }
    }
}

function hasUserGivenConsent() {
    const consent = localStorage.getItem("analytics_consent");
    return consent === "true" || consent === "false";
}



export { getAnalyticsConsent, setAnalyticsConsent, hasUserGivenConsent };