import React from "react";
import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../../src/components/common";
import { useTheme } from "../../src/hooks/useTheme";

export default function RideScreen() {
	const router = useRouter();
	const { colors, metrics, typography } = useTheme();
	const [selectedType, setSelectedType] = React.useState<"solo" | "group">(
		"solo",
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				content: {
					padding: metrics.lg,
					paddingBottom: metrics["3xl"],
					gap: metrics.lg,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				title: {
					fontSize: typography.sizes["3xl"],
					color: colors.textPrimary,
					fontWeight: "700",
					lineHeight: 38,
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					lineHeight: 22,
				},
				card: {
					borderRadius: metrics.radius.xl,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.surface,
					padding: metrics.md,
					alignItems: "center",
					gap: metrics.sm,
					minHeight: 268,
				},
				selectedCard: {
					borderColor: colors.primary,
				},
				rideImage: {
					width: 180,
					height: 180,
					borderRadius: metrics.radius.lg,
				},
				rideLabel: {
					color: colors.textPrimary,
					fontSize: typography.sizes.xl,
					fontWeight: "600",
				},
				rideMeta: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					lineHeight: 20,
					textAlign: "center",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<SafeAreaView edges={["left", "right"]} style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				style={styles.container}
			>
				<View style={styles.content}>
					<View style={styles.header}>
						<Ionicons
							color={colors.primary}
							name="navigate-outline"
							size={24}
						/>
						<View>
							<Text style={styles.title}>Choose your ride</Text>
							<Text style={styles.subtitle}>
								Select a mode to continue to ride details
							</Text>
						</View>
					</View>

					<Pressable
						hitSlop={6}
						onPress={() => setSelectedType("solo")}
						style={[
							styles.card,
							selectedType === "solo" && styles.selectedCard,
						]}
					>
						<Image
							source={require("../../assets/images/solo_ride.png")}
							style={styles.rideImage}
						/>
						<Text style={styles.rideLabel}>Solo ride</Text>
						<Text style={styles.rideMeta}>Freedom ride with your own pace</Text>
					</Pressable>

					<Pressable
						hitSlop={6}
						onPress={() => setSelectedType("group")}
						style={[
							styles.card,
							selectedType === "group" && styles.selectedCard,
						]}
					>
						<Image
							source={require("../../assets/images/group_ride.png")}
							style={styles.rideImage}
						/>
						<Text style={styles.rideLabel}>Group ride</Text>
						<Text style={styles.rideMeta}>
							Ride with community and route sync
						</Text>
					</Pressable>

					<PrimaryButton
						onPress={() => {
							router.push({
								pathname: "/ride-details",
								params: { rideType: selectedType },
							});
						}}
						title={`Start ${selectedType === "solo" ? "Solo" : "Group"} Ride`}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
