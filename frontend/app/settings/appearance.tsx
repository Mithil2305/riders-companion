import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/hooks/useTheme";

export default function AppearanceSettingsScreen() {
	const router = useRouter();
	const { colors, metrics, typography, resolvedMode, setMode } = useTheme();
	const isDarkModeEnabled = resolvedMode === "dark";

	const toggleTheme = React.useCallback(() => {
		const nextMode = isDarkModeEnabled ? "light" : "dark";
		void setMode(nextMode);
	}, [isDarkModeEnabled, setMode]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					height: 64,
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: metrics.md,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				},
				headerTitle: {
					marginLeft: metrics.sm,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
					color: colors.textPrimary,
				},
				content: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.lg,
				},
				card: {
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					padding: metrics.md,
					gap: metrics.sm,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				label: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
				},
				button: {
					borderRadius: metrics.radius.full,
					borderWidth: 1,
					borderColor: colors.primary,
					paddingHorizontal: metrics.lg,
					paddingVertical: metrics.xs + 6,
				},
				buttonText: {
					color: colors.primary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} hitSlop={8}>
					<Ionicons color={colors.textPrimary} name="arrow-back" size={22} />
				</Pressable>
				<Text style={styles.headerTitle}>Appearance</Text>
			</View>

			<View style={styles.content}>
				<View style={styles.card}>
					<View style={styles.row}>
						<View>
							<Text style={styles.label}>Theme</Text>
							<Text style={styles.subtitle}>
								{isDarkModeEnabled ? "Dark mode enabled" : "Light mode enabled"}
							</Text>
						</View>
						<Pressable onPress={toggleTheme} style={styles.button}>
							<Text style={styles.buttonText}>
								{isDarkModeEnabled ? "Use Light" : "Use Dark"}
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
