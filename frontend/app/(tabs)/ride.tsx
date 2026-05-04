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
import RideService from "../../src/services/RideService";

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
	const [soloStartingLocation, setSoloStartingLocation] =
		useState<RideLocationValue | null>(null);
	const [soloEndingLocation, setSoloEndingLocation] =
		useState<RideLocationValue | null>(null);
	const [groupStartingLocation, setGroupStartingLocation] =
		useState<RideLocationValue | null>(null);
	const [groupEndingLocation, setGroupEndingLocation] =
		useState<RideLocationValue | null>(null);
	const [isSubmittingSoloRide, setIsSubmittingSoloRide] = useState(false);
	const [isSubmittingGroupRide, setIsSubmittingGroupRide] = useState(false);

	const isMapStep =
		currentStep === "solo-start" ||
		currentStep === "solo-end" ||
		currentStep === "group-start" ||
		currentStep === "group-end";
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("ride", { enabled: !isMapStep });

	const buildRideGroupName = React.useCallback((destination: string) => {
		const destinationWord =
			destination
				.trim()
				.split(/[\s,]+/)
				.filter((value) => value.length > 0)[0] ?? "ride";
		return `${destinationWord.toLowerCase()} ride group`;
	}, []);

	const handleSoloRideStart = React.useCallback(
		(rideId: string, startingPoint: string, endingPoint: string) => {
			router.push({
				pathname: "/navigation",
				params: {
					rideId,
					canEndRide: "true",
					sourceLabel: startingPoint,
					destinationLabel: endingPoint,
				},
			});
		},
		[router],
	);

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

	const handleSoloEndSubmit = async (location: RideLocationValue) => {
		setSoloEndingLocation(location);
		const startingPoint = soloStartingLocation?.placeName ?? "";
		const endingPoint = location.placeName;
		if (!startingPoint.trim() || !endingPoint.trim()) {
			return;
		}

		setIsSubmittingSoloRide(true);
		try {
			const startDate = new Date().toISOString();
			const response = await RideService.createRide({
				rideType: "solo",
				privacy: "solo",
				rideTitle: "",
				source: startingPoint,
				destination: endingPoint,
				pickupLocation: startingPoint,
				dropLocation: endingPoint,
				startDate,
				days: 1,
				budget: 0,
				maxRiders: 0,
				ridePace: "balanced",
				roadPreference: "mixed",
				meetupNotes: "",
				emergencyContactName: "",
				emergencyContactPhone: "",
				rideNotes: "",
				includesFood: false,
				includesFuel: false,
				bikeProvided: false,
				stayArranged: false,
				stayDetails: "",
				invitedFriendIds: [],
			});
			await RideService.startRide(response.ride.id).catch(() => null);
			handleSoloRideStart(response.ride.id, startingPoint, endingPoint);
		} catch {
			router.push({
				pathname: "/solo-ride/[id]",
				params: {
					id: "solo-live",
					startingPoint,
					endingPoint,
					rideType: "solo",
				},
			});
		} finally {
			setIsSubmittingSoloRide(false);
		}
	};

	const handleGroupRideStartProceed = (location: RideLocationValue) => {
		setGroupStartingLocation(location);
		setCurrentStep("group-end");
	};

	const handleGroupRideEndProceed = (location: RideLocationValue) => {
		setGroupEndingLocation(location);
		setCurrentStep("group-invite");
	};

	const handleGroupRideInviteSubmit = async (selectedRiders: CoRider[]) => {
		const startingPoint = groupStartingLocation?.placeName ?? "";
		const endingPoint = groupEndingLocation?.placeName ?? "";
		if (!startingPoint.trim() || !endingPoint.trim()) {
			return;
		}

		const groupName = buildRideGroupName(endingPoint);
		setIsSubmittingGroupRide(true);
		try {
			const startDate = new Date();
			const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
			const response = await RideService.createRide({
				rideType: "group",
				privacy: "friends",
				rideTitle: groupName,
				source: startingPoint,
				destination: endingPoint,
				pickupLocation: startingPoint,
				dropLocation: endingPoint,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				days: 1,
				budget: 0,
				maxRiders: Math.max(2, selectedRiders.length + 1),
				ridePace: "balanced",
				roadPreference: "mixed",
				meetupNotes: "",
				emergencyContactName: "",
				emergencyContactPhone: "",
				rideNotes: "",
				includesFood: false,
				includesFuel: false,
				bikeProvided: false,
				stayArranged: false,
				stayDetails: "",
				invitedFriendIds: selectedRiders.map((rider) => rider.id),
			});

			router.push({
				pathname: `/group-chat/${response.ride.id}`,
				params: {
					name: groupName,
					startingPoint,
					endingPoint,
					riderIds: selectedRiders.map((rider) => rider.id).join(","),
					rideType: "group",
				},
			});
		} finally {
			setIsSubmittingGroupRide(false);
		}
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
			<Pressable onPress={handleBack} hitSlop={8} style={styles.backButton}>
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
				scroll: {},
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

					<View style={styles.card}>
						<Pressable
							onPress={handleSelectSoloRide}
							style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
						>
							<Image
								source={rideOptions[0].image}
								style={{
									width: 240,
									height: 240,
									resizeMode: "contain",
								}}
							/>
						</Pressable>
						<Text style={styles.cardTitle}>{rideOptions[0].title}</Text>
					</View>

					<View style={styles.card}>
						<Pressable
							onPress={handleSelectGroupRide}
							style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
						>
							<Image
								source={rideOptions[1].image}
								style={{
									width: 260,
									height: 260,
									resizeMode: "contain",
								}}
							/>
						</Pressable>
						<Text style={styles.cardTitle}>{rideOptions[1].title}</Text>
					</View>
				</ScrollView>
			</Animated.View>
		);
	};

	const renderSoloForm = (step: "starting" | "ending") => (
		<Animated.View
			entering={FadeInDown}
			exiting={FadeOutUp}
			style={styles.content}
		>
			<SoloRideForm
				step={step}
				startingLocation={soloStartingLocation}
				endingLocation={soloEndingLocation}
				onChangeStartingLocation={setSoloStartingLocation}
				onChangeEndingLocation={setSoloEndingLocation}
				onNext={handleSoloStartProceed}
				onSubmit={handleSoloEndSubmit}
				isLoading={isSubmittingSoloRide}
			/>
		</Animated.View>
	);

	const renderGroupLevel1 = () => (
		<Animated.View
			entering={FadeInDown}
			exiting={FadeOutUp}
			style={styles.content}
		>
			<GroupRideFormLevel1
				startingLocation={groupStartingLocation}
				onChangeStartingLocation={setGroupStartingLocation}
				onProceed={handleGroupRideStartProceed}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderGroupLevel2 = () => (
		<Animated.View
			entering={FadeInDown}
			exiting={FadeOutUp}
			style={styles.content}
		>
			<GroupRideFormLevel2
				endingLocation={groupEndingLocation}
				onChangeEndingLocation={setGroupEndingLocation}
				onProceed={handleGroupRideEndProceed}
				isLoading={false}
			/>
		</Animated.View>
	);

	const renderGroupLevel3 = () => (
		<Animated.View
			entering={FadeInDown}
			exiting={FadeOutUp}
			style={styles.content}
		>
			<GroupRideFormLevel3
				startingPoint={groupStartingLocation?.placeName ?? ""}
				endingPoint={groupEndingLocation?.placeName ?? ""}
				onSubmit={(startingPoint, endingPoint, selectedRiders) => {
					if (!startingPoint || !endingPoint) {
						return;
					}
					void handleGroupRideInviteSubmit(selectedRiders);
				}}
				isLoading={isSubmittingGroupRide}
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
