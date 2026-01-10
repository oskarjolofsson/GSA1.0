import { auth } from "./firebase";
import userService from "../services/userService";

function getAnalyticsConsent() {
    const user = auth.currentUser;
    if (user) {
        return userService.getConsent();
    } else {
        return localStorage.getItem("analytics_consent") === "true";
    }
}

async function setAnalyticsConsent(consent) {
    // Make sure consent is a boolean
    consent = Boolean(consent);

    const user = auth.currentUser;
    if (user) {
        await userService.setConsent(consent);
    } else {
        localStorage.setItem("analytics_consent", consent.toString());
    }
}

export { getAnalyticsConsent, setAnalyticsConsent };