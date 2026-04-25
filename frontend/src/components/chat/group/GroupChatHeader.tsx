import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

interface GroupChatHeaderProps {
	title: string;
	subtitle: string;
	rideStatus?: "active" | "ended";
	onBack: () => void;
	onOpenMenu: () => void;
}

export function GroupChatHeader({
	title,
	subtitle,
	rideStatus = "active",
	onBack,
	onOpenMenu,
}: GroupChatHeaderProps) {
	const { colors, metrics, typography } = useTheme();
	const isEnded = rideStatus === "ended";

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				root: {
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
					backgroundColor: colors.background,
					paddingHorizontal: metrics.md,
					paddingTop: metrics.sm,
					paddingBottom: metrics.md,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				leftTap: {
					width: 36,
					height: 36,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
				},
				center: {
					flex: 1,
					marginLeft: metrics.sm,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					fontWeight: "500",
				},
				subtitleRow: {
					marginTop: 2,
					flexDirection: "row",
					alignItems: "center",
				},
				right: {
					flexDirection: "row",
					alignItems: "center",
					marginLeft: metrics.sm,
				},
				menuTap: {
					width: 34,
					height: 34,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<View style={styles.root}>
			<View style={styles.row}>
				<Pressable
					accessibilityLabel="Back"
					onPress={onBack}
					style={styles.leftTap}
				>
					<Ionicons color={colors.textPrimary} name="arrow-back" size={26} />
				</Pressable>

				<View style={styles.center}>
					<Text numberOfLines={1} style={styles.title}>
						{title}
					</Text>
					<View style={styles.subtitleRow}>
						<Text numberOfLines={1} style={styles.subtitle}>
							{subtitle}
						</Text>
					</View>
				</View>

				<View style={styles.right}>
					<Pressable
						accessibilityLabel="Open menu"
						onPress={onOpenMenu}
						disabled={isEnded}
						style={styles.menuTap}
					>
						<Ionicons
							color={isEnded ? colors.primary : colors.textPrimary}
							name={"ellipsis-vertical"}
							size={22}
						/>
					</Pressable>
				</View>
			</View>
		</View>
	);
}
