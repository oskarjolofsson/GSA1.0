import { auth } from "./firebase";
import userService from "../services/userService";

async function getAnalyticsConsent() {
    if (localStorage.getItem("analytics_consent") !== null) {
        return localStorage.getItem("analytics_consent") === "true";
    }

    let consent;
    const user = auth.currentUser;
    if (user) {
        consent = await userService.getConsent();
        localStorage.setItem("analytics_consent", consent.toString());
        return consent;
    } else {
        return localStorage.getItem("analytics_consent") === "true";
    }
}

async function setAnalyticsConsent(consent) {
    // Make sure consent is a boolean
    consent = Boolean(consent);

    localStorage.setItem("analytics_consent", consent.toString());
    const user = auth.currentUser;
    if (user) {
        await userService.setConsent(consent);
    }
}

function hasUserGivenConsent() {
    const consent = localStorage.getItem("analytics_consent");
    return consent === "true" || consent === "false";
}



export { getAnalyticsConsent, setAnalyticsConsent, hasUserGivenConsent };