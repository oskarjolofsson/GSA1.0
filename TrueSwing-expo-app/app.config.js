const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = {
    expo: {
        scheme: "trueswing",
        name: IS_DEV ? "True Swing (Dev)" : "True Swing",
        slug: "trueswing",
        version: "1.4.1",
        web: {
            favicon: "./assets/true_swing_logo2.png"
        },
        experiments: {
            tsconfigPaths: true,
            typedRoutes: true
        },
        plugins: [
            "expo-router",
            "expo-secure-store",
            "expo-web-browser",
            "expo-video",
            [
                "expo-camera",
                {
                    cameraPermission: "This app uses the camera to record your golf swing.",
                    microphonePermission: "This app uses the microphone when recording swing videos.",
                    recordAudioAndroid: true
                }
            ],
            [
                "expo-image-picker",
                {
                    photosPermission: "This app needs access to your photos for you to select swing videos from your gallery.",
                    savePhotosPermission: "This app needs permission to save trimmed swing videos to your gallery."
                }
            ],
            "@react-native-google-signin/google-signin",
            "expo-font",
            "expo-updates",
            [
                "expo-build-properties",
                {
                    ios: {
                        useFrameworks: "static"
                    }
                }
            ]
        ],
        updates: {
            url: "https://u.expo.dev/83665fdd-d5ac-4c47-9ea0-98f510bdb4ee"
        },
        runtimeVersion: {
            policy: "appVersion"
        },
        orientation: "portrait",
        icon: "./assets/true_swing_logo.png",
        // iOS only in practice: prebuild writes this to Info.plist as UIUserInterfaceStyle,
        // which is what covers app launch before JS boots. On Android it is a no-op without
        // expo-system-ui -- `Appearance.setColorScheme('dark')` in app/_layout.tsx is what
        // pins Android. Change one, change the other.
        userInterfaceStyle: "dark",
        splash: {
            image: "./assets/true_swing_logo2.png",
            resizeMode: "contain",
            backgroundColor: "#0a0f1a"
        },
        assetBundlePatterns: [
            "**/*"
        ],
        ios: {
            version: "1.4.1",
            supportsTablet: false,
            bundleIdentifier: IS_DEV ? "app.trueswing.se.dev" : "app.trueswing.se",
            infoPlist: {
                NSCameraUsageDescription: "This app uses the camera to record your golf swing.",
                NSMicrophoneUsageDescription: "This app uses the microphone when recording swing videos.",
                ITSAppUsesNonExemptEncryption: false
            }
        },
        android: {
            version: "1.4.1",
            adaptiveIcon: {
                foregroundImage: "./assets/true_swing_logo3.png",
                backgroundColor: "#0a0f1a"
            },
            permissions: [
                "android.permission.CAMERA",
                "android.permission.RECORD_AUDIO"
            ],
            package: IS_DEV ? "se.trueswing.app.dev" : "se.trueswing.app",
            intentFilters: [],
            allowBackup: false
        },
        extra: {
            router: {},
            eas: {
                projectId: "83665fdd-d5ac-4c47-9ea0-98f510bdb4ee"
            }
        }
    }
};