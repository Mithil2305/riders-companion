import { Platform } from "react-native";

const googleClientIds = {
	androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
	iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
	webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
	clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
};

const missingClientIdMessage =
	"Missing Google OAuth client ID. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (plus EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID for web). backend/firebase.json is a service account and does not contain these OAuth client IDs.";

const nativeGoogleUnsupportedMessage =
	"Native Google sign-in is unavailable in this Expo Go/runtime setup. Use a development build (expo run:android / expo run:ios) with valid Google OAuth client IDs.";

export function useNativeGoogleSignIn() {
	const googleReady =
		Platform.OS === "android"
			? Boolean(googleClientIds.androidClientId)
			: Platform.OS === "ios"
				? Boolean(googleClientIds.iosClientId)
				: Boolean(googleClientIds.webClientId);

	const getIdToken = async (): Promise<string> => {
		const hasNativeId =
			Platform.OS === "android"
				? Boolean(googleClientIds.androidClientId)
				: Platform.OS === "ios"
					? Boolean(googleClientIds.iosClientId)
					: Boolean(googleClientIds.webClientId);

		if (!hasNativeId) {
			throw new Error(missingClientIdMessage);
		}

		throw new Error(nativeGoogleUnsupportedMessage);
	};

	return {
		googleReady,
		getIdToken,
	};
}
