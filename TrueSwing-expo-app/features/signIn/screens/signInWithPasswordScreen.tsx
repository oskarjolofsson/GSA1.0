import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";

type AuthMode = "signin" | "signup";

type Props = {
  onBack: () => void;
  handleEmailSignIn: (email: string, password: string) => Promise<void>;
  handleEmailSignUp?: (email: string, password: string, name: string) => Promise<void>;
};

export default function EmailSignInScreen({
  onBack,
  handleEmailSignIn,
  handleEmailSignUp,
}: Props) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSignUpMode = mode === "signup";

  function validateSignUp(emailValue: string, passwordValue: string): string | null {
    if (!fullName.trim()) {
      return "Enter your full name.";
    }

    const normalizedEmail = emailValue.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return "Enter a valid email address.";
    }

    if (passwordValue.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (!/[A-Z]/.test(passwordValue)) {
      return "Password must include at least one uppercase letter.";
    }

    if (!/[a-z]/.test(passwordValue)) {
      return "Password must include at least one lowercase letter.";
    }

    if (!/[0-9]/.test(passwordValue)) {
      return "Password must include at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(passwordValue)) {
      return "Password must include at least one special character.";
    }

    if (passwordValue !== confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  }

  function toggleMode() {
    setMode((prev) => (prev === "signin" ? "signup" : "signin"));
    setError(null);
    setSuccessMessage(null);
    setFullName("");
    setConfirmPassword("");
  }

  async function onSubmit() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      setError("Enter both email and password.");
      return;
    }

    if (isSignUpMode) {
      const signUpValidationError = validateSignUp(normalizedEmail, password);
      if (signUpValidationError) {
        setError(signUpValidationError);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (isSignUpMode) {
        if (!handleEmailSignUp) {
          setError("Sign-up is temporarily unavailable. Please try again later.");
          return;
        }

        await handleEmailSignUp(normalizedEmail, password, fullName.trim());
        setSuccessMessage(
          "Account created. Check your email to verify your account before signing in."
        );
        setPassword("");
        setConfirmPassword("");
        return;
      }

      await handleEmailSignIn(normalizedEmail, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : isSignUpMode ? "Failed to sign up." : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#09090b]"
    >
      {/* Decorative top-right corner lines */}
      <View
        className="absolute top-16 right-6 opacity-10"
        pointerEvents="none"
      >
        {[0, 14, 28].map((offset) => (
          <View
            key={offset}
            className="h-[1px] mb-[6px]"
            style={{ backgroundColor: "#60a5fa", width: 40 + offset }}
          />
        ))}
      </View>

      <View className="flex-col justify-between px-7 pt-20 pb-14">
        <View>
          {/* Back button */}
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 active:bg-white/10"
            style={{
              shadowColor: "#60a5fa",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
            }}
          >
            <ArrowLeft size={18} color="#93c5fd" />
          </Pressable>

          <View className="mt-10 mb-8">
            <Text className="text-3xl font-bold text-white">
              {isSignUpMode ? "Sign up" : "Sign in"}
            </Text>
            <Text className="mt-2 text-zinc-400">
              {isSignUpMode
                ? "Create your account with your email and password."
                : "Sign in with your email and password."}
            </Text>
          </View>
        </View>

        <View className="gap-4">
          {isSignUpMode && (
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!disabled}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-white"
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!disabled}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-white"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            textContentType={isSignUpMode ? "newPassword" : "password"}
            autoComplete={isSignUpMode ? "new-password" : "password"}
            editable={!disabled}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-white"
          />

          {isSignUpMode && (
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              editable={!disabled}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-white"
            />
          )}

          {successMessage && (
            <Text className="text-sm text-emerald-300">
              {successMessage}
            </Text>
          )}

          {error && (
            <Text className="text-sm text-red-400">
              {error}
            </Text>
          )}

          <Pressable
            onPress={onSubmit}
            disabled={disabled}
            className="mt-2 h-14 items-center justify-center rounded-2xl bg-white active:opacity-90"
            style={{ opacity: disabled ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text className="text-base font-semibold text-[#111111]">
                {isSignUpMode ? "Sign up" : "Sign in"}
              </Text>
            )}
          </Pressable>

          <View className="mt-2 flex-row items-center justify-center">
            <Text className="text-zinc-400">
              {isSignUpMode ? "Already have account? " : "No account? "}
            </Text>
            <Pressable onPress={toggleMode} disabled={disabled}>
              <Text className="font-semibold text-blue-300">
                {isSignUpMode ? "Sign in" : "Sign up"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}