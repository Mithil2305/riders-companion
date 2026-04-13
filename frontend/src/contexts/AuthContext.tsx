import React, { createContext, useContext, useState, ReactNode } from "react";
import AuthService from "../services/AuthService";

interface AuthContextType {
	user: AuthUser | null;
	isAuthenticated: boolean;
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

	const login = async (email: string, password: string) => {
		const data = await AuthService.login(email, password);
		setUser(data.user);
		setIsAuthenticated(true);
		return data.user;
	};

	const sendMobileOtp = async (mobileNumber: string) => {
		await AuthService.sendMobileOtp(mobileNumber);
	};

	const loginWithMobileOtp = async (mobileNumber: string, otpCode: string) => {
		const data = await AuthService.loginWithMobileOtp(mobileNumber, otpCode);
		setUser(data.user);
		setIsAuthenticated(true);
		return data.user;
	};

	const loginWithGoogle = async () => {
		const data = await AuthService.loginWithGoogle();
		setUser(data.user);
		setIsAuthenticated(true);
		return data.user;
	};

	const loginWithGoogleIdToken = async (idToken: string) => {
		const data = await AuthService.loginWithGoogleIdToken(idToken);
		setUser(data.user);
		setIsAuthenticated(true);
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
		return data.user;
	};

	const logout = async () => {
		await AuthService.logout();
		setUser(null);
		setIsAuthenticated(false);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				login,
				sendMobileOtp,
				loginWithMobileOtp,
				loginWithGoogle,
				loginWithGoogleIdToken,
				signup,
				logout,
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
