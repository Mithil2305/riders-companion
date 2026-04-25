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

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				banner: {
					marginHorizontal: metrics.md,
					marginTop: metrics.sm,
					borderRadius: 16,
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.border,
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
					height: 40,
					borderRadius: 20,
					paddingHorizontal: metrics.sm,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
				},
				recenterText: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "800",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<View style={styles.banner}>
			<View style={styles.leftRow}>
				<Text style={styles.label}>Live Location</Text>
				<Switch
					accessibilityLabel="Toggle live location"
					onValueChange={onToggle}
					thumbColor={colors.textInverse}
					trackColor={{ false: colors.border, true: colors.primary }}
					value={enabled}
				/>
			</View>
			<Pressable onPress={onRecenter} style={styles.recenterBtn}>
				<Text style={styles.recenterText}>Recenter</Text>
			</Pressable>
		</View>
	);
}
