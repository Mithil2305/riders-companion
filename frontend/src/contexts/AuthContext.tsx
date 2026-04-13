import React, { createContext, useContext, useState, ReactNode } from "react";
import AuthService from "../services/AuthService";

interface AuthContextType {
	user: {
		id: string;
		firebaseUid: string;
		email: string;
		username: string;
		name: string;
	} | null;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	sendMobileOtp: (mobileNumber: string) => Promise<void>;
	loginWithMobileOtp: (mobileNumber: string, otpCode: string) => Promise<void>;
	loginWithGoogle: () => Promise<void>;
	loginWithGoogleIdToken: (idToken: string) => Promise<void>;
	signup: (
		email: string,
		password: string,
		name: string,
		username: string,
		mobileNumber: string,
	) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthContextType["user"]>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const login = async (email: string, password: string) => {
		const data = await AuthService.login(email, password);
		setUser(data.user);
		setIsAuthenticated(true);
	};

	const sendMobileOtp = async (mobileNumber: string) => {
		await AuthService.sendMobileOtp(mobileNumber);
	};

	const loginWithMobileOtp = async (mobileNumber: string, otpCode: string) => {
		const data = await AuthService.loginWithMobileOtp(mobileNumber, otpCode);
		setUser(data.user);
		setIsAuthenticated(true);
	};

	const loginWithGoogle = async () => {
		const data = await AuthService.loginWithGoogle();
		setUser(data.user);
		setIsAuthenticated(true);
	};

	const loginWithGoogleIdToken = async (idToken: string) => {
		const data = await AuthService.loginWithGoogleIdToken(idToken);
		setUser(data.user);
		setIsAuthenticated(true);
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
