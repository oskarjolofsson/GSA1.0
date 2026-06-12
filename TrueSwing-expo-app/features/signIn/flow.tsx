import { useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "features/auth/AuthProvider";
import { View } from "react-native";

import { useSignInFlowSequence } from "./hooks/useSignInFlowSequence";

import LandingScreen from "./screens/landingScreen";
import EmailSignInScreen from "./screens/signInWithPasswordScreen";


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
        } catch (err: any) {
            setError(err.message ?? "Failed to sign in");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEmailSignIn = async (email: string, password: string) => {
        try {
            setSubmitting(true);
            setError(null);
            await signInWithPassword(email, password);
        } catch (err: any) {
            setError(err.message ?? "Failed to sign in");
        } finally {
            setSubmitting(false);
        }
    }

    const handleEmailSignUp = async (email: string, password: string, name: string) => {
        try {
            setSubmitting(true);
            setError(null);
            await signUpWithPassword(email, password, name);
        } catch (err: any) {
            setError(err.message ?? "Failed to sign up");
            throw err;
        } finally {
            setSubmitting(false);
        }
    }

    const handleAppleSignIn = async () => {
        try {
            setSubmitting(true);
            setError(null);
            await signInWithApple();
        } catch (err: any) {
            setError(err.message ?? "Failed to sign in with Apple");
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
