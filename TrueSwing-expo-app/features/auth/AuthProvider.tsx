import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "lib/supabase";
import type { AppUser, AuthContextType } from "./types";
import * as AppleAuthentication from "expo-apple-authentication";
import apiClient from "lib/apiClient";
import {
  configurePurchases,
  identifyUser,
  forgetUser,
} from "features/billing/services/purchaseService";

WebBrowser.maybeCompleteAuthSession();

type AuthContextWithMethods = AuthContextType & {
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  removeAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextWithMethods | undefined>(undefined);

const redirectTo = makeRedirectUri({
  scheme: "trueswing",
});

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const access_token = Array.isArray(params.access_token)
    ? params.access_token[0]
    : params.access_token;

  const refresh_token = Array.isArray(params.refresh_token)
    ? params.refresh_token[0]
    : params.refresh_token;

  if (!access_token || !refresh_token) {
    throw new Error("Missing access token or refresh token");
  }

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    throw error;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);  // Changed from User
  const [loading, setLoading] = useState(true);

  // Helper to transform Supabase User to AppUser
  function toAppUser(supabaseUser: User | undefined): AppUser | null {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? null,
      name: supabaseUser.user_metadata?.full_name ?? null,
      photoURL: supabaseUser.user_metadata?.avatar_url ?? null,
    };
  }

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;
        if (error) {
          console.error("getSession error:", error);
        }

        setSession(data.session ?? null);
        setUser(toAppUser(data.session?.user));  // Use transformer
      } catch (error) {
        console.error("initializeAuth error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        console.log("onAuthStateChange:", event, !!nextSession);
        setSession(nextSession ?? null);
        setUser(toAppUser(nextSession?.user));  // Use transformer
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const sub = Linking.addEventListener("url", async ({ url }) => {
      try {
        if (
          url.includes("access_token=") &&
          url.includes("refresh_token=")
        ) {
          await createSessionFromUrl(url);
        }
      } catch (error) {
        console.error("Linking session parse error:", error);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  // Keep the RevenueCat identity in lockstep with the Supabase session so
  // purchases always map to the right account.
  useEffect(() => {
    configurePurchases();
    const userId = session?.user?.id;
    if (userId) {
      identifyUser(userId).catch((e) =>
        console.error("RevenueCat logIn error:", e)
      );
    } else {
      forgetUser().catch((e) => console.error("RevenueCat logOut error:", e));
    }
  }, [session?.user?.id]);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,

      signInWithPassword: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      },

      signInWithGoogle: async () => {
        console.log("Google OAuth redirectTo:", redirectTo);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: {
              prompt: "select_account",
            },
          },
        });

        if (error) {
          throw error;
        }

        const authUrl = data?.url;
        if (!authUrl) {
          throw new Error("No OAuth URL returned from Supabase");
        }

        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectTo
        );

        console.log("Google OAuth result:", result.type);

        if (result.type === "success") {
          await createSessionFromUrl(result.url);
        } else if (result.type === "cancel") {
          throw new Error("Google sign-in was cancelled");
        } else if (result.type === "dismiss") {
          throw new Error("Google sign-in was dismissed");
        }
      },

      signInWithApple: async () => {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        if (!credential.identityToken) {
          throw new Error("No Apple identity token returned");
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });

        if (error) {
          alert("Apple sign-in error: " + error.message);
          throw error;
        }

        const fullName = credential.fullName;

        if (fullName?.givenName || fullName?.familyName) {
          await supabase.auth.updateUser({
            data: {
              full_name: [fullName.givenName, fullName.familyName]
                .filter(Boolean)
                .join(" "),
              given_name: fullName.givenName,
              family_name: fullName.familyName,
            },
          });
        }
      },

      signUpWithPassword: async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        })

        if (error) {
          throw error;
        }
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      },

      removeAccount: async () => {
        apiClient.delete(`/api/v1/users/${user?.id}/`)
          .then(() => supabase.auth.signOut())
          .catch((error) => {
            console.error("Error deleting account:", error);
            throw error;
          });
      }
    }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}