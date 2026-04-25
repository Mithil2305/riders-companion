import React from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendEmailVerification } from "firebase/auth";
import Animated, { FadeInUp } from "react-native-reanimated";
import { auth } from "../../config/firebase";
import { useTheme } from "../../hooks/useTheme";
import { withAlpha } from "../../utils/color";

interface EmailVerificationModalProps {
	visible: boolean;
	email: string;
	onDismiss: () => void;
}

export function EmailVerificationModal({
	visible,
	email,
	onDismiss,
}: EmailVerificationModalProps) {
	const { colors, metrics, typography } = useTheme();
	const [sending, setSending] = React.useState(false);
	const [sent, setSent] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const sendVerification = React.useCallback(async () => {
		const user = auth?.currentUser;
		if (!user) {
			setError("No user found. Please try again.");
			return;
		}

		try {
			setSending(true);
			setError(null);
			await sendEmailVerification(user);
			setSent(true);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Unable to send verification email.",
			);
		} finally {
			setSending(false);
		}
	}, []);

	// Send the initial verification email when modal opens
	React.useEffect(() => {
		if (visible && !sent) {
			void sendVerification();
		}
	}, [visible, sent, sendVerification]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				overlay: {
					flex: 1,
					backgroundColor: colors.overlay,
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: metrics.lg,
				},
				card: {
					width: "100%",
					maxWidth: 380,
					backgroundColor: colors.surface,
					borderRadius: metrics.radius.xl,
					padding: metrics.xl,
					alignItems: "center",
					gap: metrics.md,
					borderWidth: 1,
					borderColor: colors.borderDark,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 16 },
					shadowOpacity: 0.2,
					shadowRadius: 24,
					elevation: 12,
				},
				iconCircle: {
					width: 80,
					height: 80,
					borderRadius: 40,
					backgroundColor: colors.primarySoft,
					alignItems: "center",
					justifyContent: "center",
					borderWidth: 2,
					borderColor: withAlpha(colors.primary, 0.3),
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.xl,
					fontWeight: "800",
					textAlign: "center",
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
					lineHeight: 22,
					maxWidth: 300,
				},
				emailText: {
					color: colors.primary,
					fontWeight: "700",
				},
				resendBtn: {
					minHeight: 44,
					paddingHorizontal: metrics.xl,
					borderRadius: metrics.radius.full,
					borderWidth: 1.5,
					borderColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "row",
					gap: metrics.sm,
				},
				resendText: {
					color: colors.primary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				continueBtn: {
					minHeight: 48,
					width: "100%",
					borderRadius: metrics.radius.full,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
					shadowColor: colors.primary,
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.2,
					shadowRadius: 16,
					elevation: 6,
				},
				continueText: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				errorText: {
					color: colors.error,
					fontSize: typography.sizes.xs,
					textAlign: "center",
				},
				successText: {
					color: colors.primary,
					fontSize: typography.sizes.xs,
					textAlign: "center",
					fontWeight: "600",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<Modal
			animationType="fade"
			onRequestClose={onDismiss}
			transparent
			visible={visible}
		>
			<View style={styles.overlay}>
				<Animated.View
					entering={FadeInUp.delay(100).springify().damping(14)}
					style={styles.card}
				>
					<View style={styles.iconCircle}>
						<Ionicons color={colors.primary} name="mail-outline" size={36} />
					</View>

					<Text style={styles.title}>Verify Your Email</Text>

					<Text style={styles.subtitle}>
						We&apos;ve sent a verification link to{" "}
						<Text style={styles.emailText}>{email}</Text>. Please check your
						inbox to complete registration.
					</Text>

					{sent ? (
						<Text style={styles.successText}>
							✓ Verification email sent successfully!
						</Text>
					) : null}

					{error ? <Text style={styles.errorText}>{error}</Text> : null}

					<Pressable
						disabled={sending}
						onPress={sendVerification}
						style={[styles.resendBtn, sending && { opacity: 0.5 }]}
					>
						{sending ? (
							<ActivityIndicator color={colors.primary} size="small" />
						) : (
							<>
								<Ionicons
									color={colors.primary}
									name="refresh"
									size={metrics.icon.sm}
								/>
								<Text style={styles.resendText}>Resend Email</Text>
							</>
						)}
					</Pressable>

					<Pressable onPress={onDismiss} style={styles.continueBtn}>
						<Text style={styles.continueText}>Continue</Text>
					</Pressable>
				</Animated.View>
			</View>
		</Modal>
	);
}
