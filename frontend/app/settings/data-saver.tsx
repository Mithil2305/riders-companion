import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/hooks/useTheme";
import { usePlaybackSettings } from "../../src/hooks/usePlaybackSettings";

export default function DataSaverSettingsScreen() {
	const router = useRouter();
	const { colors, metrics, typography } = useTheme();
	const { dataSaverEnabled, setDataSaverEnabled } = usePlaybackSettings();

	const toggleDataSaver = React.useCallback(() => {
		setDataSaverEnabled(!dataSaverEnabled);
	}, [dataSaverEnabled, setDataSaverEnabled]);

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
				detail: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					lineHeight: typography.sizes.sm * typography.lineHeights.normal,
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
				<Text style={styles.headerTitle}>Data Saver</Text>
			</View>

			<View style={styles.content}>
				<View style={styles.card}>
					<View style={styles.row}>
						<View>
							<Text style={styles.label}>Playback data</Text>
							<Text style={styles.subtitle}>
								{dataSaverEnabled ? "Enabled" : "Off"}
							</Text>
						</View>
						<Pressable onPress={toggleDataSaver} style={styles.button}>
							<Text style={styles.buttonText}>
								{dataSaverEnabled ? "Turn off" : "Turn on"}
							</Text>
						</Pressable>
					</View>
					<Text style={styles.detail}>
						When enabled, clips load with lighter buffering and reduced
						preloading.
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}
