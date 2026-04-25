import React from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	Checkbox,
	FormInput,
	PrimaryButton,
	ThemeToggleButton,
} from "../../src/components/common";
import { useTheme } from "../../src/hooks/useTheme";
import { useNativeGoogleSignIn } from "../../src/hooks/useNativeGoogleSignIn";
import { useAuth } from "../../src/contexts/AuthContext";
import {
	isProfileSetupDone,
	isProfileSetupSkipped,
} from "../../src/utils/profileSetupStorage";
import {
	hasCompletedProfile,
	isPrivilegedAccount,
} from "../../src/utils/accessControl";

type LoginMethod = "email" | "mobile";
const SHOW_GOOGLE_SIGNIN = false;

export default function LoginScreen() {
	const { colors, metrics, typography } = useTheme();
	const {
		login,
		sendMobileOtp,
		loginWithMobileOtp,
		loginWithGoogle,
		loginWithGoogleIdToken,
	} = useAuth();
	const { getIdToken, googleReady } = useNativeGoogleSignIn();
	const router = useRouter();

	const routeAfterAuth = React.useCallback(
		async (signedInUser: {
			firebaseUid: string;
			email?: string;
			profileSetupCompletedAt?: string | null;
		}) => {
			const firebaseUid = signedInUser.firebaseUid;
			if (!firebaseUid) {
				router.replace("/auth/login");
				return;
			}

			if (isPrivilegedAccount(signedInUser.email)) {
				router.replace("/(tabs)");
				return;
			}

			const done = hasCompletedProfile(signedInUser)
				? true
				: await isProfileSetupDone(firebaseUid);
			const skipped = await isProfileSetupSkipped(firebaseUid);

			router.replace(done || skipped ? "/(tabs)" : "/setup/profile");
		},
		[router],
	);

	const [method, setMethod] = React.useState<LoginMethod>("email");

	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [agree, setAgree] = React.useState(false);

	const [mobileNumber, setMobileNumber] = React.useState("");
	const [otpCode, setOtpCode] = React.useState("");
	const [otpSent, setOtpSent] = React.useState(false);

	const [loading, setLoading] = React.useState(false);
	const [googleLoading, setGoogleLoading] = React.useState(false);
	const [authError, setAuthError] = React.useState<string | null>(null);
	const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
	const [errors, setErrors] = React.useState<{
		email?: string;
		password?: string;
		terms?: string;
		mobileNumber?: string;
		otpCode?: string;
	}>({});

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				keyboardContainer: {
					flex: 1,
					backgroundColor: colors.background,
				},
				topRightToggle: {
					position: "absolute",
					right: metrics.lg,
					top: metrics.lg,
					zIndex: 10,
				},
				scrollContent: {
					flexGrow: 1,
					padding: metrics.lg,
					paddingTop: metrics["3xl"],
					paddingBottom: metrics.xl,
					justifyContent: "center",
				},
				container: {
					gap: metrics.md,
					width: "100%",
				},
				toggleRow: {
					borderRadius: metrics.radius.full,
					padding: metrics.xs,
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.borderDark,
					flexDirection: "row",
					gap: metrics.xs,
				},
				togglePill: {
					minHeight: 48,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
					flex: 1,
				},
				activeToggle: {
					backgroundColor: colors.primary,
				},
				toggleText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					fontWeight: "600",
					lineHeight: 22,
				},
				toggleTextActive: {
					color: colors.textInverse,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes["3xl"],
					fontWeight: "700",
					marginTop: metrics.sm,
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					marginBottom: metrics.xs,
					lineHeight: 24,
				},
				methodRow: {
					flexDirection: "row",
					gap: metrics.xs,
				},
				methodBtn: {
					flex: 1,
					minHeight: 46,
					borderRadius: metrics.radius.md,
					borderWidth: 1,
					borderColor: colors.borderDark,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.surface,
				},
				methodBtnActive: {
					backgroundColor: colors.primary,
					borderColor: colors.primary,
				},
				methodText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
					lineHeight: 18,
					textAlign: "center",
					paddingHorizontal: metrics.xs,
				},
				methodTextActive: {
					color: colors.textInverse,
				},
				formWrap: {
					gap: metrics.md,
					backgroundColor: colors.surface,
					borderRadius: metrics.radius.xl,
					borderWidth: 1,
					borderColor: colors.borderDark,
					padding: metrics.md,
				},
				helperText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					lineHeight: 18,
				},
				errorText: {
					color: colors.error,
					fontSize: typography.sizes.xs,
					lineHeight: 18,
				},
				infoText: {
					color: colors.primary,
					fontSize: typography.sizes.xs,
					lineHeight: 18,
				},
				googleDividerWrap: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
					marginTop: metrics.sm,
				},
				dividerLine: {
					flex: 1,
					height: 1,
					backgroundColor: colors.borderDark,
				},
				dividerText: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					fontWeight: "600",
					letterSpacing: 0.8,
					textTransform: "uppercase",
				},
				googleBtn: {
					minHeight: 50,
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.borderDark,
					backgroundColor: colors.card,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					gap: metrics.sm,
					paddingHorizontal: metrics.md,
				},
				googleBtnText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "600",
					lineHeight: 22,
				},
				disabledBtn: {
					opacity: 0.55,
				},
			}),
		[colors, metrics, typography],
	);

	const resetMessages = () => {
		setAuthError(null);
		setInfoMessage(null);
	};

	const validateEmailMode = () => {
		const nextErrors: { email?: string; password?: string; terms?: string } =
			{};

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			nextErrors.email = "Enter a valid email";
		}
		if (password.length < 6) {
			nextErrors.password = "Password must be at least 6 characters";
		}
		if (!agree) {
			nextErrors.terms = "You must agree to continue";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const validateMobile = () => {
		const nextErrors: { mobileNumber?: string } = {};

		if (!/^\+?[0-9]{10,15}$/.test(mobileNumber.trim())) {
			nextErrors.mobileNumber = "Enter a valid mobile number";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const sendOtp = async () => {
		resetMessages();
		if (!validateMobile()) {
			return;
		}

		try {
			setLoading(true);
			await sendMobileOtp(mobileNumber.trim());
			setOtpSent(true);
			setLoading(false);
			setInfoMessage("OTP sent to your mobile number.");
		} catch (error) {
			setLoading(false);
			setAuthError(
				error instanceof Error ? error.message : "Unable to send OTP right now",
			);
		}
	};

	const submit = async () => {
		resetMessages();

		if (method === "email") {
			if (!validateEmailMode()) {
				return;
			}

			try {
				setLoading(true);
				const signedInUser = await login(email.trim(), password);
				setLoading(false);
				await routeAfterAuth(signedInUser);
			} catch (error) {
				setLoading(false);
				setAuthError(
					error instanceof Error ? error.message : "Unable to login right now",
				);
			}
			return;
		}

		if (method === "mobile") {
			const nextErrors: { mobileNumber?: string; otpCode?: string } = {};
			if (!/^\+?[0-9]{10,15}$/.test(mobileNumber.trim())) {
				nextErrors.mobileNumber = "Enter a valid mobile number";
			}
			if (!/^[0-9]{6}$/.test(otpCode.trim())) {
				nextErrors.otpCode = "Enter a valid 6-digit OTP";
			}
			setErrors(nextErrors);

			if (Object.keys(nextErrors).length > 0) {
				return;
			}

			try {
				setLoading(true);
				const signedInUser = await loginWithMobileOtp(
					mobileNumber.trim(),
					otpCode.trim(),
				);
				setLoading(false);
				await routeAfterAuth(signedInUser);
			} catch (error) {
				setLoading(false);
				setAuthError(
					error instanceof Error
						? error.message
						: "Unable to verify OTP right now",
				);
			}
			return;
		}

		setAuthError("Unsupported login method.");
	};

	const signInWithGoogle = async () => {
		resetMessages();
		try {
			setGoogleLoading(true);
			if (Platform.OS === "web") {
				const signedInUser = await loginWithGoogle();
				setGoogleLoading(false);
				await routeAfterAuth(signedInUser);
			} else {
				const idToken = await getIdToken();
				const signedInUser = await loginWithGoogleIdToken(idToken);
				setGoogleLoading(false);
				await routeAfterAuth(signedInUser);
			}
		} catch (error) {
			setGoogleLoading(false);
			setAuthError(
				error instanceof Error
					? error.message
					: "Unable to continue with Google",
			);
		}
	};

	const onChangeMethod = (nextMethod: LoginMethod) => {
		setMethod(nextMethod);
		setErrors({});
		setOtpCode("");
		setOtpSent(false);
		resetMessages();
	};

	return (
		<SafeAreaView
			edges={["top", "left", "right"]}
			style={styles.keyboardContainer}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardContainer}
			>
				<View style={styles.topRightToggle}>
					<ThemeToggleButton />
				</View>

				<ScrollView
					contentContainerStyle={styles.scrollContent}
					contentInsetAdjustmentBehavior="automatic"
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<Animated.View
						entering={FadeInLeft.duration(320)}
						style={styles.container}
					>
						<View style={styles.toggleRow}>
							<TouchableOpacity
								activeOpacity={0.85}
								style={[styles.togglePill, styles.activeToggle]}
							>
								<Text style={[styles.toggleText, styles.toggleTextActive]}>
									Login
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								activeOpacity={0.85}
								onPress={() => router.replace("/auth/signup")}
								style={styles.togglePill}
							>
								<Text style={styles.toggleText}>Signup</Text>
							</TouchableOpacity>
						</View>

						<Text style={styles.title}>Welcome Back</Text>
						<Text style={styles.subtitle}>
							Sign in to continue your riding journey.
						</Text>

						<View style={styles.methodRow}>
							<TouchableOpacity
								activeOpacity={0.9}
								onPress={() => onChangeMethod("email")}
								style={[
									styles.methodBtn,
									method === "email" && styles.methodBtnActive,
								]}
							>
								<Text
									style={[
										styles.methodText,
										method === "email" && styles.methodTextActive,
									]}
								>
									Email Password
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								activeOpacity={0.9}
								onPress={() => onChangeMethod("mobile")}
								style={[
									styles.methodBtn,
									method === "mobile" && styles.methodBtnActive,
								]}
							>
								<Text
									style={[
										styles.methodText,
										method === "mobile" && styles.methodTextActive,
									]}
								>
									Mobile OTP
								</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.formWrap}>
							{method === "email" ? (
								<>
									<FormInput
										error={errors.email}
										keyboardType="email-address"
										label="Email"
										onChangeText={setEmail}
										placeholder="name@example.com"
										value={email}
									/>
									<FormInput
										error={errors.password}
										label="Password"
										onChangeText={setPassword}
										placeholder="Enter your password"
										secureTextEntry
										showPasswordToggle
										value={password}
									/>

									<Checkbox
										checked={agree}
										label="Agree to Terms & Conditions"
										onToggle={() => setAgree((previous) => !previous)}
									/>
									{errors.terms != null ? (
										<Text style={styles.errorText}>{errors.terms}</Text>
									) : null}
								</>
							) : null}

							{method === "mobile" ? (
								<>
									<FormInput
										autoCapitalize="none"
										error={errors.mobileNumber}
										keyboardType="phone-pad"
										label="Mobile Number"
										onChangeText={setMobileNumber}
										placeholder="e.g. +919876543210"
										value={mobileNumber}
									/>
									<PrimaryButton
										loading={loading}
										onPress={sendOtp}
										title={otpSent ? "Resend OTP" : "Send OTP"}
									/>
									<FormInput
										autoCapitalize="none"
										error={errors.otpCode}
										keyboardType="number-pad"
										label="OTP"
										onChangeText={setOtpCode}
										placeholder="Enter 6-digit OTP"
										value={otpCode}
									/>
									<Text style={styles.helperText}>
										Use country code format for faster verification (example:
										+91).
									</Text>
								</>
							) : null}

							<PrimaryButton
								loading={loading}
								onPress={submit}
								title={method === "email" ? "Continue" : "Verify OTP"}
							/>
							{infoMessage != null ? (
								<Text style={styles.infoText}>{infoMessage}</Text>
							) : null}
							{authError != null ? (
								<Text style={styles.errorText}>{authError}</Text>
							) : null}

							{SHOW_GOOGLE_SIGNIN ? (
								<>
									<View style={styles.googleDividerWrap}>
										<View style={styles.dividerLine} />
										<Text style={styles.dividerText}>or</Text>
										<View style={styles.dividerLine} />
									</View>

									<TouchableOpacity
										disabled={googleLoading || loading || !googleReady}
										activeOpacity={0.9}
										onPress={signInWithGoogle}
										style={[
											styles.googleBtn,
											(googleLoading || loading || !googleReady) &&
												styles.disabledBtn,
										]}
									>
										<FontAwesome color={colors.primary} name="google" size={18} />
										<Text style={styles.googleBtnText}>
											{googleLoading
												? "Signing in..."
												: !googleReady
													? "Google setup required"
													: "Sign in with Google"}
										</Text>
									</TouchableOpacity>
								</>
							) : null}
						</View>
					</Animated.View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
