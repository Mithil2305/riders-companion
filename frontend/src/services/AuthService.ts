import { Platform } from "react-native";
import {
	createUserWithEmailAndPassword,
	deleteUser,
	GoogleAuthProvider,
	signInWithPopup,
	signInWithCredential,
	signInWithEmailAndPassword,
	signOut,
	updateProfile,
} from "firebase/auth";
import {
	auth,
	firebaseEnvError,
	isFirebaseConfigured,
} from "../config/firebase";
import { getApiBaseCandidates, getApiUrl } from "./api";

const REQUEST_TIMEOUT_MS = 30000;

type AuthUser = {
	id: string;
	firebaseUid: string;
	email: string;
	username: string;
	name: string;
	bio: string | null;
	mobileNumber?: string | null;
	driverLicenseNumber?: string | null;
	profileImageUrl: string | null;
	bannerImageUrl: string | null;
	totalMiles: string | number;
	profileSetupCompletedAt?: string | null;
	createdAt: string;
	updatedAt: string;
};

type AuthPayload = {
	token: string;
	user: AuthUser;
};

type AuthApiResponse = {
	success: boolean;
	data?: AuthPayload;
	message?: string;
	code?: string;
};

class AuthService {
	private ensureFirebaseReady() {
		if (!isFirebaseConfigured || auth == null) {
			throw new Error(firebaseEnvError);
		}

		return auth;
	}

	private async postAuth(
		path: "/auth/login" | "/auth/signup",
		payload: object,
	): Promise<AuthPayload> {
		const execute = async (
			allowRetry: boolean,
			baseUrl: string,
		): Promise<AuthPayload> => {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				REQUEST_TIMEOUT_MS,
			);

			try {
				const response = await fetch(`${baseUrl}${path}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
					signal: controller.signal,
				});

				const data = (await response.json()) as AuthApiResponse;

				if (!response.ok || !data.success || data.data == null) {
					throw new Error(data.message ?? "Authentication failed");
				}

				return data.data;
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					if (allowRetry) {
						return execute(false, baseUrl);
					}

					throw error;
				}

				if (error instanceof TypeError) {
					throw error;
				}

				throw error;
			} finally {
				clearTimeout(timeoutId);
			}
		};

		const candidates = getApiBaseCandidates();
		let timeoutDetected = false;

		for (const candidate of candidates) {
			try {
				return await execute(true, candidate);
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					timeoutDetected = true;
					continue;
				}

				if (error instanceof TypeError) {
					continue;
				}

				throw error;
			}
		}

		const tried = candidates.join(", ");
		if (timeoutDetected) {
			throw new Error(
				`Request timed out while contacting backend. Tried: ${tried}. Current active API: ${getApiUrl()}.`,
			);
		}

		throw new Error(
			`Cannot reach backend for auth. Tried: ${tried}. Update EXPO_PUBLIC_API_URL or ensure backend is reachable on your current LAN IP.`,
		);
	}

	async login(email: string, password: string) {
		try {
			const firebaseAuth = this.ensureFirebaseReady();
			const credential = await signInWithEmailAndPassword(
				firebaseAuth,
				email.trim(),
				password,
			);
			const idToken = await credential.user.getIdToken();
			return await this.postAuth("/auth/login", { idToken });
		} catch (error) {
			console.error("Login error:", error);
			throw error;
		}
	}

	async sendMobileOtp(_mobileNumber: string) {
		throw new Error(
			"Mobile OTP login needs Firebase Phone Auth setup (reCAPTCHA verifier) in this Expo app.",
		);
	}

	async loginWithMobileOtp(_mobileNumber: string, _otpCode: string) {
		throw new Error(
			"Mobile OTP verification is not configured yet. Please use email/password for now.",
		);
	}

	async loginWithGoogle() {
		try {
			const firebaseAuth = this.ensureFirebaseReady();
			const provider = new GoogleAuthProvider();

			if (Platform.OS !== "web") {
				throw new Error(
					"Firebase Google sign-in popup is web-only in this setup. For Android/iOS, a native Google provider token flow is required.",
				);
			}

			const userCredential = await signInWithPopup(firebaseAuth, provider);
			const firebaseIdToken = await userCredential.user.getIdToken();
			return await this.postAuth("/auth/login", { idToken: firebaseIdToken });
		} catch (error) {
			console.error("Google login error:", error);
			throw error;
		}
	}

	async loginWithGoogleIdToken(idToken: string) {
		try {
			const firebaseAuth = this.ensureFirebaseReady();
			const credential = GoogleAuthProvider.credential(idToken);
			const userCredential = await signInWithCredential(
				firebaseAuth,
				credential,
			);
			const firebaseIdToken = await userCredential.user.getIdToken();
			return await this.postAuth("/auth/login", { idToken: firebaseIdToken });
		} catch (error) {
			console.error("Google login error:", error);
			throw error;
		}
	}

	async signup(
		email: string,
		password: string,
		name: string,
		username: string,
		mobileNumber?: string,
	) {
		let createdUser:
			| Awaited<ReturnType<typeof createUserWithEmailAndPassword>>["user"]
			| null = null;

		try {
			const firebaseAuth = this.ensureFirebaseReady();
			const credential = await createUserWithEmailAndPassword(
				firebaseAuth,
				email.trim(),
				password,
			);
			createdUser = credential.user;
			await updateProfile(credential.user, { displayName: name.trim() });
			const idToken = await credential.user.getIdToken();
			return await this.postAuth("/auth/signup", {
				idToken,
				name,
				username,
				mobileNumber,
			});
		} catch (error) {
			if (createdUser != null) {
				try {
					await deleteUser(createdUser);
				} catch {
					// Ignore rollback failures; original error is more important here.
				}
			}

			console.error("Signup error:", error);
			throw error;
		}
	}

	async logout() {
		const firebaseAuth = this.ensureFirebaseReady();
		await signOut(firebaseAuth);
	}
}

export default new AuthService();
