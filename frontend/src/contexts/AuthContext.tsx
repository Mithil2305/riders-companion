import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
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

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthContextType["user"]>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isRestoring, setIsRestoring] = useState(true);
	const [emailVerificationPending, setEmailVerificationPending] = useState(false);
	const restorationAttemptedRef = useRef(false);

	// Listen for Firebase auth state changes and restore session automatically
	useEffect(() => {
		if (!isFirebaseConfigured || auth == null) {
			setIsRestoring(false);
			return;
		}

		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				// User is signed in — restore the backend session
				if (!restorationAttemptedRef.current) {
					restorationAttemptedRef.current = true;
					try {
						const idToken = await firebaseUser.getIdToken();
						const data = await AuthService.restoreSession(idToken);
						setUser(data.user);
						setIsAuthenticated(true);
					} catch {
						// Backend session restoration failed — user must re-login
						setUser(null);
						setIsAuthenticated(false);
					}
				}
			} else {
				// User is signed out
				setUser(null);
				setIsAuthenticated(false);
				restorationAttemptedRef.current = false;
			}

			setIsRestoring(false);
		});

		// Fallback timeout so we never hang on splash forever
		const fallbackTimer = setTimeout(() => {
			setIsRestoring(false);
		}, 5000);

		return () => {
			unsubscribe();
			clearTimeout(fallbackTimer);
		};
	}, []);

	const login = async (email: string, password: string) => {
		const data = await AuthService.login(email, password);
		setUser(data.user);
		setIsAuthenticated(true);
		restorationAttemptedRef.current = true;
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
		setUser(data.user);
		setIsAuthenticated(true);
		restorationAttemptedRef.current = true;
		return data.user;
	};

	const loginWithGoogleIdToken = async (idToken: string) => {
		const data = await AuthService.loginWithGoogleIdToken(idToken);
		setUser(data.user);
		setIsAuthenticated(true);
		restorationAttemptedRef.current = true;
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
		setUser(data.user);
		setIsAuthenticated(true);
		restorationAttemptedRef.current = true;
		return data.user;
	};

	const logout = async () => {
		await AuthService.logout();
		setUser(null);
		setIsAuthenticated(false);
		restorationAttemptedRef.current = false;
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
