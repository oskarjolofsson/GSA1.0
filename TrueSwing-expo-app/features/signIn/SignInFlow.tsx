import { useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "features/auth/AuthProvider";
import { View } from "react-native";

import { getAuthErrorMessage } from "lib/errors";

import { useSignInFlowSequence } from "./hooks/useSignInFlowSequence";

import LandingScreen from "./screens/LandingScreen";
import EmailSignInScreen from "./screens/SignInWithPasswordScreen";


export default function SignInFlow() {

    const { session, loading, signInWithGoogle, signInWithPassword, signUpWithPassword, signInWithApple } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { currentScreen, goToLanding, goToEmailSignIn } = useSignInFlowSequence();

    if (!loading && session) {
        return <Redirect href="/(app)/(tabs)" />;
    }

    const handleGoogleSignIn = async () => {
        try {
            setSubmitting(true);
            setError(null);
            await signInWithGoogle();
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEmailSignIn = async (email: string, password: string) => {
        try {
            setSubmitting(true);
            setError(null);
            await signInWithPassword(email, password);
        } catch (err) {
            const message = getAuthErrorMessage(err);
            setError(message);       // keeps LandingScreen feedback consistent
            throw new Error(message); // lets EmailSignInScreen.catch render it
        } finally {
            setSubmitting(false);
        }
    }

    const handleEmailSignUp = async (email: string, password: string, name: string) => {
        try {
            setSubmitting(true);
            setError(null);
            await signUpWithPassword(email, password, name);
        } catch (err) {
            const message = getAuthErrorMessage(err);
            setError(message);
            throw new Error(message);
        } finally {
            setSubmitting(false);
        }
    }

    const handleAppleSignIn = async () => {
        try {
            setSubmitting(true);
            setError(null);
            await signInWithApple();
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <View style={{ flex: 1 }}>
            {currentScreen === "landing" && (
                <LandingScreen
                    onGoogleButtonPress={handleGoogleSignIn}
                    onEmailButtonPress={goToEmailSignIn}
                    onAppleButtonPress={handleAppleSignIn}
                    submitting={submitting}
                    error={error}
                />
            )}
            {currentScreen === "emailSignIn" && (
                <EmailSignInScreen
                    onBack={goToLanding}
                    handleEmailSignIn={handleEmailSignIn}
                    handleEmailSignUp={handleEmailSignUp}
                />
            )}
        </View>

    )
}
