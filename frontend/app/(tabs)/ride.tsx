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
import Animated from "react-native-reanimated";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";

type RideOption = {
	key: "solo" | "group";
	title: string;
	subtitle: string;
	image: ReturnType<typeof require>;
};

export default function RideScreen() {
	const router = useRouter();
	const { colors, metrics, typography } = useTheme();

	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("ride");

	const rideOptions: RideOption[] = [
		{
			key: "solo",
			title: "Solo ride",
			subtitle: "Freedom ride with your own pace",
			image: require("../../assets/images/solo_ride.png"),
		},
		{
			key: "group",
			title: "Group ride",
			subtitle: "Ride with community and route sync",
			image: require("../../assets/images/group_ride.png"),
		},
	];

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				scroll: {
					flex: 1,
				},
				scrollContent: {
					paddingHorizontal: 24,
					paddingTop: 10,
					paddingBottom: 40,
				},
				header: {
					flexDirection: "row",
					justifyContent: "center",
					alignItems: "center",
					marginBottom: 2,
				},
				headerIcon: {
					marginRight: 10,
					marginTop: 2,
				},
				title: {
					fontSize: typography.sizes["3xl"],
					fontWeight: typography.weights.bold as any,
					color: colors.textPrimary,
					letterSpacing: -0.5,
				},
				subtitle: {
					fontSize: typography.sizes.sm,
					color: colors.textSecondary,
					lineHeight: typography.sizes.sm * typography.lineHeights.normal,
					marginBottom: metrics.md,
					marginLeft: 30,
				},
				card: {
					backgroundColor: colors.card,
					borderRadius: 20,
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: 24,
					paddingHorizontal: 24,
					marginBottom: 20,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.12,
					shadowRadius: 8,
					elevation: 4,
				},
				cardImage: {
					width: 180,
					height: 180,
					resizeMode: "contain",
					marginBottom: 16,
				},
				cardTitle: {
					fontSize: typography.sizes.xl,
					fontWeight: typography.weights.bold as any,
					color: colors.textPrimary,
					marginBottom: 6,
				},
				cardSubtitle: {
					fontSize: typography.sizes.sm,
					color: colors.textTertiary,
					textAlign: "center",
					lineHeight: typography.sizes.sm * typography.lineHeights.normal,
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<Animated.View
				style={[styles.container, swipeAnimatedStyle]}
				{...swipeHandlers}
			>
				<ScrollView
					style={styles.scroll}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.header}>
						{/* <Ionicons
							name="send"
							size={20}
							color={colors.primary}
							style={styles.headerIcon}
						/> */}
						<Text style={styles.title}>Choose your ride</Text>
					</View>
					<Text style={styles.subtitle}>
						Select a mode to continue to ride details
					</Text>

					{rideOptions.map((option) => {
						return (
							<View key={option.key} style={styles.card}>
								<Pressable
									onPress={() => {
										router.push({
											pathname: "/ride-details",
											params: { rideType: option.key },
										});
									}}
									style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
								>
									<Image source={option.image} style={styles.cardImage} />
								</Pressable>
								<Text style={styles.cardTitle}>{option.title}</Text>
								<Text style={styles.cardSubtitle}>{option.subtitle}</Text>
							</View>
						);
					})}
				</ScrollView>
			</Animated.View>
		</SafeAreaView>
	);
}
