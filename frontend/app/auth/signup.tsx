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
import Animated, { FadeInRight } from "react-native-reanimated";
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

export default function SignupScreen() {
	const { colors, metrics, typography } = useTheme();
	const { signup, loginWithGoogle, loginWithGoogleIdToken } = useAuth();
	const { getIdToken, googleReady } = useNativeGoogleSignIn();
	const router = useRouter();
	const [name, setName] = React.useState("");
	const [username, setUsername] = React.useState("");
	const [mobileNumber, setMobileNumber] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [confirmPassword, setConfirmPassword] = React.useState("");
	const [agree, setAgree] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [googleLoading, setGoogleLoading] = React.useState(false);
	const [authError, setAuthError] = React.useState<string | null>(null);
	const [errors, setErrors] = React.useState<{
		name?: string;
		username?: string;
		mobileNumber?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
		terms?: string;
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
					justifyContent: "center",
				},
				container: {
					gap: metrics.md,
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
					marginBottom: metrics.sm,
				},
				formWrap: {
					gap: metrics.md,
					backgroundColor: colors.surface,
					borderRadius: metrics.radius.xl,
					borderWidth: 1,
					borderColor: colors.borderDark,
					padding: metrics.md,
				},
				errorText: {
					color: colors.error,
					fontSize: typography.sizes.xs,
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
				},
				disabledBtn: {
					opacity: 0.55,
				},
			}),
		[colors, metrics, typography],
	);

	const signInWithGoogle = async () => {
		setAuthError(null);
		try {
			setGoogleLoading(true);
			if (Platform.OS === "web") {
				await loginWithGoogle();
			} else {
				const idToken = await getIdToken();
				await loginWithGoogleIdToken(idToken);
			}
			setGoogleLoading(false);
			router.replace("/setup/profile");
		} catch (error) {
			setGoogleLoading(false);
			setAuthError(
				error instanceof Error
					? error.message
					: "Unable to continue with Google",
			);
		}
	};

	const submit = async () => {
		const nextErrors: {
			name?: string;
			username?: string;
			mobileNumber?: string;
			email?: string;
			password?: string;
			confirmPassword?: string;
			terms?: string;
		} = {};

		if (name.trim().length < 2) {
			nextErrors.name = "Name must be at least 2 characters";
		}
		if (!/^[a-z0-9_]{3,50}$/.test(username.trim().toLowerCase())) {
			nextErrors.username =
				"Username must be 3-50 chars, letters/numbers/_ only";
		}
		if (!/^\+?[0-9]{10,15}$/.test(mobileNumber.trim())) {
			nextErrors.mobileNumber = "Enter a valid mobile number";
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			nextErrors.email = "Enter a valid email";
		}
		if (password.length < 6) {
			nextErrors.password = "Password must be at least 6 characters";
		}
		if (confirmPassword !== password) {
			nextErrors.confirmPassword = "Passwords do not match";
		}
		if (!agree) {
			nextErrors.terms = "You must agree to continue";
		}

		setErrors(nextErrors);
		setAuthError(null);

		if (Object.keys(nextErrors).length > 0) {
			return;
		}

		try {
			setLoading(true);
			await signup(
				email.trim(),
				password,
				name.trim(),
				username.trim().toLowerCase(),
				mobileNumber.trim(),
			);
			setLoading(false);
			router.replace("/setup/profile");
		} catch (error) {
			setLoading(false);
			setAuthError(
				error instanceof Error ? error.message : "Unable to signup right now",
			);
		}
	};

	return (
		<SafeAreaView
			edges={["top", "left", "right"]}
			style={styles.keyboardContainer}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.keyboardContainer}
			>
				<View style={styles.topRightToggle}>
					<ThemeToggleButton />
				</View>

				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<Animated.View
						entering={FadeInRight.duration(340)}
						style={styles.container}
					>
						<View style={styles.toggleRow}>
							<TouchableOpacity
								onPress={() => router.replace("/auth/login")}
								style={styles.togglePill}
							>
								<Text style={styles.toggleText}>Login</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.togglePill, styles.activeToggle]}
							>
								<Text style={[styles.toggleText, styles.toggleTextActive]}>
									Signup
								</Text>
							</TouchableOpacity>
						</View>

						<Text style={styles.title}>Create Account</Text>
						<Text style={styles.subtitle}>
							Join riders and start your first setup.
						</Text>

						<View style={styles.formWrap}>
							<FormInput
								autoCapitalize="words"
								error={errors.name}
								label="Name"
								onChangeText={setName}
								placeholder="Your full name"
								value={name}
							/>
							<FormInput
								autoCapitalize="none"
								error={errors.username}
								label="Username"
								onChangeText={setUsername}
								placeholder="e.g. roadcaptain_21"
								value={username}
							/>
							<FormInput
								autoCapitalize="none"
								error={errors.mobileNumber}
								keyboardType="phone-pad"
								label="Mobile Number"
								onChangeText={setMobileNumber}
								placeholder="e.g. +919876543210"
								value={mobileNumber}
							/>
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
								placeholder="Create your password"
								secureTextEntry
								showPasswordToggle
								value={password}
							/>
							<FormInput
								error={errors.confirmPassword}
								label="Confirm Password"
								onChangeText={setConfirmPassword}
								placeholder="Confirm your password"
								secureTextEntry
								showPasswordToggle
								value={confirmPassword}
							/>

							<Checkbox
								checked={agree}
								label="Agree to Terms & Conditions"
								onToggle={() => setAgree((previous) => !previous)}
							/>
							{errors.terms != null ? (
								<Text style={styles.errorText}>{errors.terms}</Text>
							) : null}

							<PrimaryButton
								loading={loading}
								onPress={submit}
								title="Create Account"
							/>

							<View style={styles.googleDividerWrap}>
								<View style={styles.dividerLine} />
								<Text style={styles.dividerText}>or</Text>
								<View style={styles.dividerLine} />
							</View>

							<TouchableOpacity
								disabled={googleLoading || loading || !googleReady}
								onPress={signInWithGoogle}
								style={[
									styles.googleBtn,
									(googleLoading || loading || !googleReady) &&
										styles.disabledBtn,
								]}
							>
								<FontAwesome color="#DB4437" name="google" size={18} />
								<Text style={styles.googleBtnText}>
									{googleLoading
										? "Signing in..."
										: !googleReady
											? "Google setup required"
											: "Continue with Google"}
								</Text>
							</TouchableOpacity>

							{authError != null ? (
								<Text style={styles.errorText}>{authError}</Text>
							) : null}
						</View>
					</Animated.View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
