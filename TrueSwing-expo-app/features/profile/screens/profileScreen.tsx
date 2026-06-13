import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, Alert } from "react-native";
import { useAuth } from "features/auth/AuthProvider";
import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import SubscriptionBanner from "features/billing/components/SubscriptionBanner";
import SubscriptionCard from "features/billing/components/SubscriptionCard";

import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
} from "react-native";
import { Mail, CircleHelp, ChevronRight, User2 } from "lucide-react-native";

export default function ProfileScreen() {
    const profile = {
        supportEmail: "team@trueswing.se",
    };

    const { user, loading, signOut, removeAccount } = useAuth();

    const handleContactSupport = async () => {
        const subject = encodeURIComponent("Support request");
        const body = encodeURIComponent(
            "Hi TrueSwing,\n\nI need help with my account.\n"
        );
        const url = `mailto:${profile.supportEmail}?subject=${subject}&body=${body}`;

        try {
            await Linking.openURL(url);
        } catch {
            Alert.alert("Error", "Could not open the email app.");
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            Alert.alert("Error", "Failed to sign out");
        }
    };

    if (loading) {
        return <LoadingState title="Loading profile" subtitle="Please wait a moment" />;
    }

    if (!user) {
        return <ErrorState
            title="Not authenticated"
            message="Please log in to view your profile."
            buttonText="Go to login"
            onRetry={() => {
                signOut();
            }}
        />;
    }


    return (
        <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                <View className="mt-4 mb-6 items-center">
                    <Text className="text-xl font-bold text-gray-300">Profile</Text>
                </View>

                <SubscriptionBanner />

                {/* Persnoal Info */}
                <View className="">
                    <View className="px-5 pb-4">
                        <View className="mb-5 flex-row items-center">
                            <View className="mr-4 h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/15">
                                {user.photoURL ? (
                                    <Image
                                        source={{ uri: user.photoURL }}
                                        className="h-20 w-20 rounded-2xl"
                                    />
                                ) : (
                                    <User2 size={48} color="#a5b4fc" />
                                )}
                            </View>

                            <View className="flex-1 text-center">
                                <Text className="text-3xl font-semibold text-white">
                                    {user.name || "User"}
                                </Text>
                                <Text className="mt-1 text-sm text-slate-400">
                                    TrueSwing account
                                </Text>
                            </View>
                        </View>


                        <View className="gap-4">

                            <InfoCard
                                label="Email address"
                                value={user.email || "No email"}
                                icon={<Mail size={20} color="#cbd5e1" />}
                            />
                        </View>
                    </View>
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity
                    onPress={handleSignOut}
                    activeOpacity={0.7}
                    className="mt-6 px-5"
                >
                    <Text className="text-center text-sm font-medium text-red-500/80 border border-red-500/20 rounded-lg py-3 mx-auto px-10">
                        Sign Out
                    </Text>
                </TouchableOpacity>

                {/* Delete Account */}
                <TouchableOpacity
                    onPress={() => Alert.alert("Delete Account", "Are you sure you want to delete your account? This action cannot be undone.", [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Delete", style: "destructive", onPress: () => {
                                removeAccount()
                                    .then(() => Alert.alert("Account Deleted", "Your account has been deleted."))
                                    .catch(() => Alert.alert("Error", "Failed to delete account."));
                            }
                        },
                    ])}
                    activeOpacity={0.7}
                    className="mt-4 px-5"
                >
                    <Text className="text-center text-sm font-medium text-red-500/80 border border-red-500/20 rounded-lg py-3 mx-auto px-10">
                        Delete Account
                    </Text>
                </TouchableOpacity>

                {/* Subscription */}
                <View className="mt-6">
                    <SubscriptionCard />
                </View>

                {/* Border */}
                <View className="my-8 h-px bg-white/10" />

                {/* Support */}
                <View className="mt-10 rounded-3xl border border-white/10 bg-slate-900 p-5">
                    <View className="mb-3 flex-row items-center">
                        <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-slate-800">
                            <CircleHelp size={20} color="#cbd5e1" />
                        </View>
                        <Text className="text-lg font-semibold text-white">Support</Text>
                    </View>

                    <Text className="text-base leading-7 text-slate-400">
                        For any questions regarding your account, please contact support at{" "}
                        <Text className="font-medium text-indigo-400">
                            {profile.supportEmail}
                        </Text>
                        .
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleContactSupport}
                        className="mt-5 flex-row items-center justify-between rounded-2xl border border-white/10 bg-slate-800 px-4 py-4"
                    >
                        <View>
                            <Text className="text-base font-semibold text-white">
                                Contact support
                            </Text>
                            <Text className="mt-1 text-sm text-slate-400">
                                We usually reply by email
                            </Text>
                        </View>

                        <ChevronRight size={20} color="#94a3b8" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <View className="rounded-2xl border border-white/10 bg-slate-800/90 p-4">
            <View className="mb-3 flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-700">
                    {icon}
                </View>
                <Text className="text-sm font-medium text-slate-400">{label}</Text>
            </View>

            <Text className="text-xl font-semibold text-white">{value}</Text>
        </View>
    );
}