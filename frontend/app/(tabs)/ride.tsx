import React, { useEffect, useState } from "react";
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
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import {
	SoloRideForm,
	GroupRideFormLevel1,
	GroupRideFormLevel2,
	type CoRider,
} from "../../src/components/ride";

type RideScreenStep = "picker" | "solo-form" | "group-level1" | "group-level2";

export default function RideScreen() {
	const router = useRouter();
	const { colors, metrics, typography } = useTheme();
	const [currentStep, setCurrentStep] = useState<RideScreenStep>("picker");
	const [groupRideData, setGroupRideData] = useState({
		startingPoint: "",
		endingPoint: "",
	});

	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("ride");

	const handleSoloRideStart = (startingPoint: string, endingPoint: string) => {
		router.push({
			pathname: "/solo-ride/[id]",
			params: {
				startingPoint,
				endingPoint,
				rideType: "solo",
			},
		});
	};

	const handleGroupRideLevel1Proceed = (
		startingPoint: string,
		endingPoint: string,
	) => {
		setGroupRideData({ startingPoint, endingPoint });
		setCurrentStep("group-level2");
	};

	const handleGroupRideLevel2Submit = (
		startingPoint: string,
		endingPoint: string,
		selectedRiders: CoRider[],
	) => {
		router.push({
			pathname: "/group-chat/[id]",
			params: {
				startingPoint,
				endingPoint,
				riderIds: selectedRiders.map((rider) => rider.id).join(","),
				rideType: "group",
			},
		});
	};

	const handleSelectSoloRide = () => {
		setCurrentStep("solo-form");
	};

	const handleSelectGroupRide = () => {
		setCurrentStep("group-level1");
	};

	const handleBack = () => {
		if (currentStep === "group-level2") {
			setCurrentStep("group-level1");
			return;
		}
		if (currentStep === "solo-form" || currentStep === "group-level1") {
			setCurrentStep("picker");
			return;
		}
		router.back();
	};

	const renderHeader = () => (
		<View style={styles.header}>
			<Pressable
				onPress={handleBack}
				hitSlop={8}
				style={styles.backButton}
			>
				<Ionicons name="arrow-back" size={24} color={colors.primary} />
			</Pressable>
			<View style={styles.brand}>
				<Ionicons name="navigate" size={18} color={colors.primary} />
				<Text style={styles.brandText}>Enroute</Text>
			</View>
		</View>
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				scroll: {
				},
				scrollContent: {
					paddingHorizontal: 24,
					paddingTop: 10,
					paddingBottom: 40,
				},
                mainHeader: {
                    flexDirection: "row",
					justifyContent: "center",
					alignItems: "center",
					marginTop: 10,
					marginBottom: 2,
                },
				header: {
					height: 64,
					paddingHorizontal: metrics.md,
					flexDirection: "row",
					alignItems: "center",
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
					backgroundColor: colors.background,
				},
				backButton: {
					paddingRight: metrics.sm,
				},
				brand: {
					flexDirection: "row",
					alignItems: "center",
				},
				brandText: {
					marginLeft: 6,
					fontSize: typography.sizes.lg,
					fontWeight: typography.weights.bold as any,
					color: colors.textPrimary,
				},
				headerIcon: {
					marginRight: 10,
					marginTop: 2,
				},
				title: {
					fontSize: typography.sizes["2xl"],
					fontWeight: typography.weights.bold as any,
					color: colors.textPrimary,
					letterSpacing: -0.5,
				},
				subtitle: {
					fontSize: typography.sizes.xs,
					textAlign: "center",
					color: colors.textSecondary,
					lineHeight: typography.sizes.sm * typography.lineHeights.normal,
					marginBottom: metrics.lg,
				},
				card: {
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 14,
				},
				cardImage: {
					width: 240,
					height: 240,
					resizeMode: "contain",
				},
				cardTitle: {
					marginTop: -10,
					fontSize: typography.sizes.xl,
					fontWeight: typography.weights.bold as any,
					color: colors.textPrimary,
				},
				cardSubtitle: {
					fontSize: typography.sizes.xs,
					color: colors.textTertiary,
					textAlign: "center",
					lineHeight: typography.sizes.sm * typography.lineHeights.normal,
				},
				content: {
					flex: 1,
				},
			}),
		[colors, metrics, typography],
	);

	const renderPicker = () => {
		const rideOptions = [
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

		return (
			<Animated.View entering={FadeInDown} exiting={FadeOutUp}>
				<ScrollView
					style={styles.scroll}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.mainHeader}>
						<Text style={styles.title}>Choose your ride</Text>
					</View>
					<Text style={styles.subtitle}>
						Select a mode to continue to ride details
					</Text>

					{rideOptions.map((option) => {
						const onPress = option.key === "solo" ? handleSelectSoloRide : handleSelectGroupRide;
						return (
							<View key={option.key} style={styles.card}>
								<Pressable
									onPress={onPress}
									style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
								>
									<Image source={option.image} style={styles.cardImage} />
								</Pressable>
								<Text style={styles.cardTitle}>{option.title}</Text>
							</View>
						);
					})}
				</ScrollView>
			</Animated.View>
		);
	};

	const renderSoloForm = () => (
		<Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.content}>
			<SoloRideForm
				onStartRide={handleSoloRideStart}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderGroupLevel1 = () => (
		<Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.content}>
			<GroupRideFormLevel1
				onProceed={handleGroupRideLevel1Proceed}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderGroupLevel2 = () => (
		<Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.content}>
			<GroupRideFormLevel2
				startingPoint={groupRideData.startingPoint}
				endingPoint={groupRideData.endingPoint}
				onSubmit={handleGroupRideLevel2Submit}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderContent = () => {
		switch (currentStep) {
			case "picker":
				return renderPicker();
			case "solo-form":
				return (
					<>
						{renderHeader()}
						{renderSoloForm()}
					</>
				);
			case "group-level1":
				return (
					<>
						{renderHeader()}
						{renderGroupLevel1()}
					</>
				);
			case "group-level2":
				return (
					<>
						{renderHeader()}
						{renderGroupLevel2()}
					</>
				);
			default:
				return renderPicker();
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<Animated.View
				style={[styles.container, swipeAnimatedStyle]}
				{...swipeHandlers}
			>
				{renderContent()}
			</Animated.View>
		</SafeAreaView>
	);
}
