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
	GroupRideFormLevel3,
	type CoRider,
} from "../../src/components/ride";
import type { RideLocationValue } from "../../src/components/map/RideLocationPicker";

type RideScreenStep =
	| "picker"
	| "solo-start"
	| "solo-end"
	| "group-start"
	| "group-end"
	| "group-invite";

export default function RideScreen() {
	const router = useRouter();
	const { colors, metrics, typography } = useTheme();
	const [currentStep, setCurrentStep] = useState<RideScreenStep>("picker");
	const [soloStartingLocation, setSoloStartingLocation] = useState<RideLocationValue | null>(null);
	const [soloEndingLocation, setSoloEndingLocation] = useState<RideLocationValue | null>(null);
	const [groupStartingLocation, setGroupStartingLocation] = useState<RideLocationValue | null>(null);
	const [groupEndingLocation, setGroupEndingLocation] = useState<RideLocationValue | null>(null);

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

	const handleSelectSoloRide = () => {
		setCurrentStep("solo-start");
	};

	const handleSelectGroupRide = () => {
		setCurrentStep("group-start");
	};

	const handleSoloStartProceed = (location: RideLocationValue) => {
		setSoloStartingLocation(location);
		setCurrentStep("solo-end");
	};

	const handleSoloEndSubmit = (location: RideLocationValue) => {
		setSoloEndingLocation(location);
		const startingPoint = soloStartingLocation?.placeName ?? '';
		if (!startingPoint.trim()) {
			return;
		}
		handleSoloRideStart(startingPoint, location.placeName);
	};

	const handleGroupRideStartProceed = (location: RideLocationValue) => {
		setGroupStartingLocation(location);
		setCurrentStep("group-end");
	};

	const handleGroupRideEndProceed = (location: RideLocationValue) => {
		setGroupEndingLocation(location);
		setCurrentStep("group-invite");
	};

	const handleGroupRideInviteSubmit = (selectedRiders: CoRider[]) => {
		const startingPoint = groupStartingLocation?.placeName ?? "";
		const endingPoint = groupEndingLocation?.placeName ?? "";
		if (!startingPoint.trim() || !endingPoint.trim()) {
			return;
		}
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

	const handleBack = () => {
		if (currentStep === "solo-end") {
			setCurrentStep("solo-start");
			return;
		}
		if (currentStep === "group-end") {
			setCurrentStep("group-start");
			return;
		}
		if (currentStep === "group-invite") {
			setCurrentStep("group-end");
			return;
		}
		if (currentStep === "solo-start" || currentStep === "group-start") {
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

	const renderSoloForm = (step: "starting" | "ending") => (
		<Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.content}>
			<SoloRideForm
				step={step}
				startingLocation={soloStartingLocation}
				endingLocation={soloEndingLocation}
				onChangeStartingLocation={setSoloStartingLocation}
				onChangeEndingLocation={setSoloEndingLocation}
				onNext={handleSoloStartProceed}
				onSubmit={handleSoloEndSubmit}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderGroupLevel1 = () => (
		<Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.content}>
			<GroupRideFormLevel1
				startingLocation={groupStartingLocation}
				onChangeStartingLocation={setGroupStartingLocation}
				onProceed={handleGroupRideStartProceed}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderGroupLevel2 = () => (
		<Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.content}>
			<GroupRideFormLevel2
				endingLocation={groupEndingLocation}
				onChangeEndingLocation={setGroupEndingLocation}
				onProceed={handleGroupRideEndProceed}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderGroupLevel3 = () => (
		<Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.content}>
			<GroupRideFormLevel3
				startingPoint={groupStartingLocation?.placeName ?? ""}
				endingPoint={groupEndingLocation?.placeName ?? ""}
				onSubmit={(startingPoint, endingPoint, selectedRiders) => {
					if (!startingPoint || !endingPoint) {
						return;
					}
					handleGroupRideInviteSubmit(selectedRiders);
				}}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderContent = () => {
		switch (currentStep) {
			case "picker":
				return renderPicker();
			case "solo-start":
				return (
					<>
						{renderHeader()}
						{renderSoloForm("starting")}
					</>
				);
			case "solo-end":
				return (
					<>
						{renderHeader()}
						{renderSoloForm("ending")}
					</>
				);
			case "group-start":
				return (
					<>
						{renderHeader()}
						{renderGroupLevel1()}
					</>
				);
			case "group-end":
				return (
					<>
						{renderHeader()}
						{renderGroupLevel2()}
					</>
				);
			case "group-invite":
				return (
					<>
						{renderHeader()}
						{renderGroupLevel3()}
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
