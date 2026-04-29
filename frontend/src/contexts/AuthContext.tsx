import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, isFirebaseConfigured } from "../config/firebase";
import AuthService from "../services/AuthService";

interface AuthContextType {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isRestoring: boolean;
	login: (email: string, password: string) => Promise<AuthUser>;
	sendMobileOtp: (mobileNumber: string) => Promise<void>;
	loginWithMobileOtp: (
		mobileNumber: string,
		otpCode: string,
	) => Promise<AuthUser>;
	loginWithGoogle: () => Promise<AuthUser>;
	loginWithGoogleIdToken: (idToken: string) => Promise<AuthUser>;
	signup: (
		email: string,
		password: string,
		name: string,
		username: string,
		mobileNumber: string,
	) => Promise<AuthUser>;
	logout: () => Promise<void>;
	emailVerificationPending: boolean;
	setEmailVerificationPending: (value: boolean) => void;
}

type AuthUser = {
	id: string;
	firebaseUid: string;
	email: string;
	username: string;
	name: string;
	bio?: string | null;
	mobileNumber?: string | null;
	driverLicenseNumber?: string | null;
	profileImageUrl?: string | null;
	bannerImageUrl?: string | null;
	totalMiles?: string | number;
	profileSetupCompletedAt?: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_SESSION_STORAGE_KEY = "auth:session:v1";

type StoredAuthSession = {
	user: AuthUser;
};

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthContextType["user"]>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isRestoring, setIsRestoring] = useState(true);
	const [emailVerificationPending, setEmailVerificationPending] =
		useState(false);
	const restorationAttemptedRef = useRef(false);
	const hydratedFromStorageRef = useRef(false);
	const hasStoredSessionRef = useRef(false);

	const persistSession = async (nextUser: AuthUser) => {
		const payload: StoredAuthSession = { user: nextUser };
		await AsyncStorage.setItem(
			AUTH_SESSION_STORAGE_KEY,
			JSON.stringify(payload),
		);
	};

	const clearPersistedSession = async () => {
		hasStoredSessionRef.current = false;
		await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
	};

	const hydrateSessionFromStorage = async () => {
		if (hydratedFromStorageRef.current) {
			return;
		}

		hydratedFromStorageRef.current = true;

		try {
			const raw = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
			if (!raw) {
				return;
			}

			const parsed = JSON.parse(raw) as StoredAuthSession;
			if (parsed?.user) {
				hasStoredSessionRef.current = true;
				setUser(parsed.user);
				setIsAuthenticated(true);
			}
		} catch {
			hasStoredSessionRef.current = false;
			await clearPersistedSession();
		}
	};

	const applyAuthenticatedState = async (nextUser: AuthUser) => {
		hasStoredSessionRef.current = true;
		setUser(nextUser);
		setIsAuthenticated(true);
		restorationAttemptedRef.current = true;
		await persistSession(nextUser);
	};

	// Listen for Firebase auth state changes and restore session automatically
	useEffect(() => {
		let isMounted = true;
		let unsubscribeAuthListener: (() => void) | null = null;
		let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

		const bootstrap = async () => {
			await hydrateSessionFromStorage();

			if (!isFirebaseConfigured || auth == null) {
				if (isMounted) {
					setIsRestoring(false);
				}
				return;
			}

			unsubscribeAuthListener = onAuthStateChanged(
				auth,
				async (firebaseUser) => {
					if (!isMounted) {
						return;
					}

					if (firebaseUser) {
						// User is signed in — restore backend user data when possible.
						if (!restorationAttemptedRef.current) {
							restorationAttemptedRef.current = true;
							try {
								const idToken = await firebaseUser.getIdToken();
								const data = await AuthService.restoreSession(idToken);
								if (!isMounted) {
									return;
								}
								setUser(data.user);
								setIsAuthenticated(true);
								await persistSession(data.user);
							} catch {
								// Keep the hydrated session if available to avoid forcing re-login on reload.
								if (hasStoredSessionRef.current) {
									setIsAuthenticated(true);
								} else {
									setUser(null);
									setIsAuthenticated(false);
								}
							}
						}
					} else {
						setUser(null);
						setIsAuthenticated(false);
						hasStoredSessionRef.current = false;
						restorationAttemptedRef.current = false;
						await clearPersistedSession();
					}

					setIsRestoring(false);
				},
			);

			// Fallback timeout so we never hang on splash forever
			fallbackTimer = setTimeout(() => {
				if (isMounted) {
					setIsRestoring(false);
				}
			}, 5000);
		};

		void bootstrap();

		return () => {
			isMounted = false;
			if (unsubscribeAuthListener) {
				unsubscribeAuthListener();
			}
			if (fallbackTimer) {
				clearTimeout(fallbackTimer);
			}
		};
	}, []);

	const login = async (email: string, password: string) => {
		const data = await AuthService.login(email, password);
		await applyAuthenticatedState(data.user);
		return data.user;
	};

	const sendMobileOtp = async (mobileNumber: string) => {
		await AuthService.sendMobileOtp(mobileNumber);
	};

	const loginWithMobileOtp = async (mobileNumber: string, otpCode: string) => {
		await AuthService.loginWithMobileOtp(mobileNumber, otpCode);
		throw new Error("Mobile OTP login is not configured yet.");
	};

	const loginWithGoogle = async () => {
		const data = await AuthService.loginWithGoogle();
		await applyAuthenticatedState(data.user);
		return data.user;
	};

	const loginWithGoogleIdToken = async (idToken: string) => {
		const data = await AuthService.loginWithGoogleIdToken(idToken);
		await applyAuthenticatedState(data.user);
		return data.user;
	};

	const signup = async (
		email: string,
		password: string,
		name: string,
		username: string,
		mobileNumber: string,
	) => {
		const data = await AuthService.signup(
			email,
			password,
			name,
			username,
			mobileNumber,
		);
		await applyAuthenticatedState(data.user);
		return data.user;
	};

	const logout = async () => {
		await AuthService.logout();
		setUser(null);
		setIsAuthenticated(false);
		hasStoredSessionRef.current = false;
		restorationAttemptedRef.current = false;
		await clearPersistedSession();
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				isRestoring,
				login,
				sendMobileOtp,
				loginWithMobileOtp,
				loginWithGoogle,
				loginWithGoogleIdToken,
				signup,
				logout,
				emailVerificationPending,
				setEmailVerificationPending,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
