import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

interface LiveLocationBannerProps {
	enabled: boolean;
	onToggle: (value: boolean) => void;
	onRecenter?: () => void;
}

export function LiveLocationBanner({
	enabled,
	onToggle,
	onRecenter,
}: LiveLocationBannerProps) {
	const { colors, metrics, typography } = useTheme();
	const primaryRed = "#D32F2F";

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				banner: {
					marginHorizontal: metrics.md,
					marginTop: metrics.sm,
					borderRadius: 16,
					backgroundColor: "#FFFFFF",
					borderWidth: 1,
					borderColor: "#EDEDED",
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					shadowColor: colors.shadow,
					shadowOpacity: 0.04,
					shadowOffset: { width: 0, height: 2 },
					shadowRadius: 6,
					elevation: 1,
				},
				leftRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				label: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				recenterBtn: {
					height: 44,
					borderRadius: 22,
					paddingHorizontal: metrics.lg,
					backgroundColor: primaryRed,
					alignItems: "center",
					justifyContent: "center",
				},
				recenterText: {
					color: "#FFFFFF",
					fontSize: typography.sizes.xl,
					fontWeight: "800",
				},
			}),
		[colors, metrics, primaryRed, typography],
	);

	return (
		<View style={styles.banner}>
			<View style={styles.leftRow}>
				<Text style={styles.label}>Live Location</Text>
				<Switch
					accessibilityLabel="Toggle live location"
					onValueChange={onToggle}
					thumbColor={colors.textInverse}
					trackColor={{ false: colors.border, true: primaryRed }}
					value={enabled}
				/>
			</View>
			<Pressable onPress={onRecenter} style={styles.recenterBtn}>
				<Text style={styles.recenterText}>Recenter</Text>
			</Pressable>
		</View>
	);
}
