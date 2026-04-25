import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";

type RideOption = {
	key: "solo" | "group";
	title: string;
	subtitle: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	accent: string;
};

export default function RideScreen() {
	const router = useRouter();
	const { colors, metrics, typography } = useTheme();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("ride");

	const rideOptions = React.useMemo<RideOption[]>(
		() => [
			{
				key: "solo",
				title: "Solo Ride",
				subtitle: "Set your own plan, timing, and route details.",
				icon: "person-outline",
				accent: colors.primary,
			},
			{
				key: "group",
				title: "Group Ride",
				subtitle: "Create a shared ride with pickup, invites, and group settings.",
				icon: "people-outline",
				accent: colors.success,
			},
		],
		[colors.primary, colors.success],
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				content: {
					flex: 1,
					paddingHorizontal: metrics.lg,
					paddingTop: metrics.xl,
					paddingBottom: metrics["2xl"],
					gap: metrics.lg,
				},
				header: {
					gap: metrics.sm,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes["2xl"],
					fontWeight: "800",
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
				},
				optionCard: {
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.surface,
					padding: metrics.lg,
					gap: metrics.md,
				},
				optionTop: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				iconWrap: {
					width: 48,
					height: 48,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.overlayLight,
				},
				optionTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				optionSubtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
				},
				helperText: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<Animated.View
			style={[styles.container, swipeAnimatedStyle]}
			{...swipeHandlers}
		>
			<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
				<View style={styles.content}>
					<View style={styles.header}>
						<Text style={styles.title}>Start a ride</Text>
						<Text style={styles.subtitle}>
							Choose how you want to ride today. Solo keeps it simple. Group
							opens the full shared-ride setup.
						</Text>
					</View>

					{rideOptions.map((option) => (
						<Pressable
							key={option.key}
							onPress={() =>
								router.push({
									pathname: "/ride-details",
									params: { rideType: option.key },
								})
							}
							style={styles.optionCard}
						>
							<View style={styles.optionTop}>
								<View
									style={[
										styles.iconWrap,
										{ backgroundColor: `${option.accent}20` },
									]}
								>
									<Ionicons color={option.accent} name={option.icon} size={24} />
								</View>
								<Ionicons
									color={colors.textTertiary}
									name="chevron-forward"
									size={20}
								/>
							</View>
							<Text style={styles.optionTitle}>{option.title}</Text>
							<Text style={styles.optionSubtitle}>{option.subtitle}</Text>
						</Pressable>
					))}

					<Text style={styles.helperText}>
						Community quick start opens directly into the group ride form.
					</Text>
				</View>
			</SafeAreaView>
		</Animated.View>
	);
}
