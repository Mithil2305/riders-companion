import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "@firebase/auth";

type FirebaseAuthReactNativeModule = {
	getAuth: (app?: ReturnType<typeof getApp>) => Auth;
	getReactNativePersistence: (
		storage: typeof AsyncStorage,
	) => unknown;
	initializeAuth: (
		app: ReturnType<typeof getApp>,
		deps?: { persistence?: unknown },
	) => Auth;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FirebaseAuthReactNative = require(
	"@firebase/auth/dist/rn/index.js",
) as FirebaseAuthReactNativeModule;
const { getAuth, getReactNativePersistence, initializeAuth } =
	FirebaseAuthReactNative;

const projectId =
	process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "riders-companion-8e4f8";
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();

export const isFirebaseConfigured = apiKey != null && apiKey.length > 0;

export const firebaseEnvError =
	"Missing EXPO_PUBLIC_FIREBASE_API_KEY. Add Firebase web config values to frontend environment variables.";

let auth: Auth | null = null;

if (isFirebaseConfigured) {
	const firebaseConfig = {
		apiKey,
		authDomain:
			process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
			`${projectId}.firebaseapp.com`,
		projectId,
		storageBucket:
			process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
			`${projectId}.appspot.com`,
		messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
	};

	const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

	if (Platform.OS === "web") {
		auth = getAuth(app);
	} else {
		try {
			auth = initializeAuth(app, {
				persistence: getReactNativePersistence(AsyncStorage),
			});
		} catch {
			auth = getAuth(app);
		}
	}
}

export { auth };
