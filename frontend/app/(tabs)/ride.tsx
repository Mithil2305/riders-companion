import React from "react";
import {
	ActivityIndicator,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../../src/components/common";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import RideService, { RideFriend } from "../../src/services/RideService";
import { useLocation } from "../../src/hooks/useLocation";
import {
	hasCompletedProfile,
	isPrivilegedAccount,
} from "../../src/utils/accessControl";
import { isProfileSetupDone } from "../../src/utils/profileSetupStorage";

type PrivacyMode = "friends" | "strangers" | "mixed";

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export default function RideScreen() {
	const router = useRouter();
	const { user: authUser } = useAuth();
	const { colors, metrics, typography } = useTheme();
	const [selectedType, setSelectedType] = React.useState<"solo" | "group">(
		"solo",
	);
	const [source, setSource] = React.useState("");
	const [destination, setDestination] = React.useState("");
	const [pickupLocation, setPickupLocation] = React.useState("");
	const [dropLocation, setDropLocation] = React.useState("");
	const [startDate, setStartDate] = React.useState("");
	const [endDate, setEndDate] = React.useState("");
	const [days, setDays] = React.useState("1");
	const [budget, setBudget] = React.useState("0");
	const [privacy, setPrivacy] = React.useState<PrivacyMode>("mixed");
	const [includesFood, setIncludesFood] = React.useState(false);
	const [includesFuel, setIncludesFuel] = React.useState(false);
	const [bikeProvided, setBikeProvided] = React.useState(false);
	const [stayArranged, setStayArranged] = React.useState(false);
	const [stayDetails, setStayDetails] = React.useState("");
	const [friends, setFriends] = React.useState<RideFriend[]>([]);
	const [selectedFriendIds, setSelectedFriendIds] = React.useState<string[]>(
		[],
	);
	const [loadingFriends, setLoadingFriends] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const [message, setMessage] = React.useState("");
	const [activeRideId, setActiveRideId] = React.useState<string | null>(null);
	const [locationSummary, setLocationSummary] = React.useState("");
	const [activeField, setActiveField] = React.useState<
		"source" | "destination" | "pickup" | "drop" | null
	>(null);
	const [locationSuggestions, setLocationSuggestions] = React.useState<
		string[]
	>([]);
	const [suggesting, setSuggesting] = React.useState(false);

	const { location, getCurrentLocation } = useLocation();

	const queryForSuggestions = React.useCallback(
		async (value: string, field: typeof activeField) => {
			if (value.trim().length < 3) {
				setLocationSuggestions([]);
				setActiveField(field);
				return;
			}

			setActiveField(field);
			setSuggesting(true);
			try {
				const suggestions = await RideService.searchLocations(value);
				setLocationSuggestions(suggestions);
			} catch {
				setLocationSuggestions([]);
			} finally {
				setSuggesting(false);
			}
		},
		[],
	);

	React.useEffect(() => {
		if (
			selectedType !== "group" ||
			(privacy !== "friends" && privacy !== "mixed")
		) {
			return;
		}

		let mounted = true;
		setLoadingFriends(true);

		RideService.getFriends()
			.then((result) => {
				if (mounted) {
					setFriends(result);
				}
			})
			.catch(() => {
				if (mounted) {
					setFriends([]);
				}
			})
			.finally(() => {
				if (mounted) {
					setLoadingFriends(false);
				}
			});

		return () => {
			mounted = false;
		};
	}, [privacy, selectedType]);

	const pushAndFetchLocations = React.useCallback(
		async (rideId: string) => {
			await getCurrentLocation();

			if (location) {
				await RideService.updateLocation(
					rideId,
					location.latitude,
					location.longitude,
				);
			}

			const live = await RideService.getRideLocations(rideId);
			setLocationSummary(
				`Live riders: ${live.locations.length} • Refresh every 15 minutes`,
			);
		},
		[getCurrentLocation, location],
	);

	React.useEffect(() => {
		if (!activeRideId) {
			return;
		}

		pushAndFetchLocations(activeRideId).catch(() => {
			setLocationSummary("Unable to sync live locations right now.");
		});

		const interval = setInterval(() => {
			pushAndFetchLocations(activeRideId).catch(() => {
				setLocationSummary("Unable to sync live locations right now.");
			});
		}, FIFTEEN_MIN_MS);

		return () => clearInterval(interval);
	}, [activeRideId, pushAndFetchLocations]);

	const toggleFriend = React.useCallback((friendId: string) => {
		setSelectedFriendIds((prev) =>
			prev.includes(friendId)
				? prev.filter((id) => id !== friendId)
				: [...prev, friendId],
		);
	}, []);

	const startRideNowOrLater = React.useCallback(
		async (rideId: string, startIso: string) => {
			const startAt = new Date(startIso).getTime();
			if (Number.isNaN(startAt)) {
				await RideService.startRide(rideId);
				setMessage(
					"Ride created and started. Live location sync enabled every 15 minutes.",
				);
				setActiveRideId(rideId);
				return;
			}

			const delay = startAt - Date.now();
			if (delay <= 0) {
				await RideService.startRide(rideId);
				setMessage(
					"Ride started. Live location sync enabled every 15 minutes.",
				);
				setActiveRideId(rideId);
				return;
			}

			setMessage(
				"Ride created. It will auto-start at your scheduled time while this app session is active.",
			);
			setTimeout(() => {
				RideService.startRide(rideId)
					.then(() => {
						setMessage(
							"Scheduled ride started. Live location sync enabled every 15 minutes.",
						);
						setActiveRideId(rideId);
					})
					.catch(() => {
						setMessage(
							"Ride was created but auto-start failed. Tap start manually in community.",
						);
					});
			}, delay);
		},
		[],
	);

	const handleCreateRide = React.useCallback(async () => {
		if (authUser == null) {
			setMessage("Please login again to continue.");
			router.replace("/auth/login");
			return;
		}

		if (!isPrivilegedAccount(authUser)) {
			const isComplete = hasCompletedProfile(authUser)
				? true
				: await isProfileSetupDone(authUser.firebaseUid);

			if (!isComplete) {
				setMessage("Complete your profile before creating rides.");
				router.push("/setup/profile");
				return;
			}
		}

		if (!source.trim() || !destination.trim() || !startDate.trim()) {
			setMessage("Please fill source, destination and start date/time.");
			return;
		}

		if (selectedType === "group" && !endDate.trim()) {
			setMessage("Please enter group ride end date/time.");
			return;
		}

		setSubmitting(true);
		setMessage("");

		try {
			const response = await RideService.createRide({
				rideType: selectedType,
				privacy: selectedType === "solo" ? "solo" : privacy,
				source,
				destination,
				pickupLocation:
					selectedType === "group" ? pickupLocation || source : source,
				dropLocation:
					selectedType === "group" ? dropLocation || destination : destination,
				startDate,
				endDate: selectedType === "group" ? endDate : undefined,
				days: Number(days) || 1,
				budget: Number(budget) || 0,
				includesFood,
				includesFuel,
				bikeProvided,
				stayArranged,
				stayDetails,
				invitedFriendIds:
					selectedType === "group" &&
					(privacy === "friends" || privacy === "mixed")
						? selectedFriendIds
						: [],
			});

			await startRideNowOrLater(response.ride.id, startDate);
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Failed to create ride.",
			);
		} finally {
			setSubmitting(false);
		}
	}, [
		authUser,
		bikeProvided,
		budget,
		days,
		destination,
		endDate,
		includesFood,
		includesFuel,
		pickupLocation,
		dropLocation,
		privacy,
		selectedFriendIds,
		selectedType,
		source,
		startDate,
		startRideNowOrLater,
		stayArranged,
		stayDetails,
		router,
	]);

	const renderLocationSuggestions = (field: typeof activeField) => {
		if (activeField !== field || locationSuggestions.length === 0) {
			return null;
		}

		return (
			<View style={styles.suggestionWrap}>
				{locationSuggestions.map((item) => (
					<Pressable
						key={`${field}-${item}`}
						onPress={() => {
							if (field === "source") {
								setSource(item);
							} else if (field === "destination") {
								setDestination(item);
							} else if (field === "pickup") {
								setPickupLocation(item);
							} else {
								setDropLocation(item);
							}

							setLocationSuggestions([]);
							setActiveField(null);
						}}
						style={styles.suggestionItem}
					>
						<Text style={styles.suggestionText}>{item}</Text>
					</Pressable>
				))}
			</View>
		);
	};

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
				formCard: {
					borderRadius: metrics.radius.xl,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.surface,
					padding: metrics.md,
					gap: metrics.md,
				},
				sectionTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				input: {
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: metrics.radius.lg,
					backgroundColor: colors.background,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					minHeight: 48,
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: metrics.sm,
				},
				optionRow: {
					flexDirection: "row",
					gap: metrics.sm,
				},
				optionChip: {
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: metrics.radius.full,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					minHeight: 40,
					backgroundColor: colors.background,
					justifyContent: "center",
				},
				optionChipSelected: {
					borderColor: colors.primary,
					backgroundColor: colors.overlayLight,
				},
				optionChipText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
				optionChipTextSelected: {
					color: colors.primary,
				},
				friendItem: {
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: metrics.radius.lg,
					padding: metrics.sm,
					marginTop: metrics.xs,
					minHeight: 56,
					justifyContent: "center",
				},
				friendItemSelected: {
					borderColor: colors.primary,
					backgroundColor: colors.overlayLight,
				},
				friendName: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
				friendHandle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					lineHeight: 18,
				},
				message: {
					color: colors.primary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
					lineHeight: 20,
				},
				suggestionWrap: {
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: metrics.radius.lg,
					backgroundColor: colors.background,
					overflow: "hidden",
					marginTop: -metrics.xs,
				},
				suggestionItem: {
					paddingHorizontal: metrics.sm,
					paddingVertical: metrics.md,
					borderTopWidth: StyleSheet.hairlineWidth,
					borderTopColor: colors.border,
				},
				suggestionText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					lineHeight: 20,
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<SafeAreaView edges={["left", "right"]} style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
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
						<Text style={styles.title}>Choose your ride</Text>
					</View>

					<Pressable
						onPress={() => setSelectedType("solo")}
						hitSlop={6}
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
						onPress={() => setSelectedType("group")}
						hitSlop={6}
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
						loading={submitting}
						onPress={handleCreateRide}
						title={`Start ${selectedType === "solo" ? "Solo" : "Group"} Ride`}
					/>

					<View style={styles.formCard}>
						<Text style={styles.sectionTitle}>Trip basics</Text>

						<TextInput
							onChangeText={(value) => {
								setSource(value);
								queryForSuggestions(value, "source").catch(() => {
									setLocationSuggestions([]);
								});
							}}
							placeholder="Source location"
							placeholderTextColor={colors.textTertiary}
							style={styles.input}
							value={source}
						/>
						{suggesting && activeField === "source" ? (
							<ActivityIndicator color={colors.primary} />
						) : null}
						{renderLocationSuggestions("source")}

						<TextInput
							onChangeText={(value) => {
								setDestination(value);
								queryForSuggestions(value, "destination").catch(() => {
									setLocationSuggestions([]);
								});
							}}
							placeholder="Destination location"
							placeholderTextColor={colors.textTertiary}
							style={styles.input}
							value={destination}
						/>
						{suggesting && activeField === "destination" ? (
							<ActivityIndicator color={colors.primary} />
						) : null}
						{renderLocationSuggestions("destination")}

						<TextInput
							onChangeText={setStartDate}
							placeholder="Start date/time (YYYY-MM-DD HH:mm)"
							placeholderTextColor={colors.textTertiary}
							style={styles.input}
							value={startDate}
						/>

						<TextInput
							keyboardType="numeric"
							onChangeText={setDays}
							placeholder="No. of days"
							placeholderTextColor={colors.textTertiary}
							style={styles.input}
							value={days}
						/>

						<TextInput
							keyboardType="numeric"
							onChangeText={setBudget}
							placeholder="Budget"
							placeholderTextColor={colors.textTertiary}
							style={styles.input}
							value={budget}
						/>
					</View>

					{selectedType === "solo" ? (
						<View style={styles.formCard}>
							<Text style={styles.sectionTitle}>Solo ride setup</Text>
							<Text style={styles.rideMeta}>Ride mode: Alone</Text>
							<Text style={styles.rideMeta}>
								Trip will start at your selected time.
							</Text>
						</View>
					) : (
						<View style={styles.formCard}>
							<Text style={styles.sectionTitle}>Group ride setup</Text>

							<TextInput
								onChangeText={(value) => {
									setPickupLocation(value);
									queryForSuggestions(value, "pickup").catch(() => {
										setLocationSuggestions([]);
									});
								}}
								placeholder="Pickup location"
								placeholderTextColor={colors.textTertiary}
								style={styles.input}
								value={pickupLocation}
							/>
							{renderLocationSuggestions("pickup")}

							<TextInput
								onChangeText={(value) => {
									setDropLocation(value);
									queryForSuggestions(value, "drop").catch(() => {
										setLocationSuggestions([]);
									});
								}}
								placeholder="Drop location"
								placeholderTextColor={colors.textTertiary}
								style={styles.input}
								value={dropLocation}
							/>
							{renderLocationSuggestions("drop")}

							<TextInput
								onChangeText={setEndDate}
								placeholder="End date/time (YYYY-MM-DD HH:mm)"
								placeholderTextColor={colors.textTertiary}
								style={styles.input}
								value={endDate}
							/>

							<View style={styles.optionRow}>
								{(["friends", "strangers", "mixed"] as PrivacyMode[]).map(
									(mode) => (
										<Pressable
											key={mode}
											hitSlop={4}
											onPress={() => setPrivacy(mode)}
											style={[
												styles.optionChip,
												privacy === mode && styles.optionChipSelected,
											]}
										>
											<Text
												style={[
													styles.optionChipText,
													privacy === mode && styles.optionChipTextSelected,
												]}
											>
												{mode === "friends"
													? "Friends"
													: mode === "strangers"
														? "Strangers"
														: "Mixed"}
											</Text>
										</Pressable>
									),
								)}
							</View>

							<View style={styles.row}>
								<Text style={styles.rideMeta}>Food included</Text>
								<Switch onValueChange={setIncludesFood} value={includesFood} />
							</View>

							<View style={styles.row}>
								<Text style={styles.rideMeta}>Fuel included</Text>
								<Switch onValueChange={setIncludesFuel} value={includesFuel} />
							</View>

							<View style={styles.row}>
								<Text style={styles.rideMeta}>Bike provided</Text>
								<Switch onValueChange={setBikeProvided} value={bikeProvided} />
							</View>

							<View style={styles.row}>
								<Text style={styles.rideMeta}>Stay arranged</Text>
								<Switch onValueChange={setStayArranged} value={stayArranged} />
							</View>

							{stayArranged ? (
								<TextInput
									multiline
									onChangeText={setStayDetails}
									placeholder="Stay details (hotel, check-in, room sharing, etc.)"
									placeholderTextColor={colors.textTertiary}
									style={[
										styles.input,
										{ minHeight: 82, textAlignVertical: "top" },
									]}
									value={stayDetails}
								/>
							) : null}

							{privacy === "friends" || privacy === "mixed" ? (
								<View>
									<Text style={styles.sectionTitle}>Invite friends</Text>
									{loadingFriends ? (
										<ActivityIndicator color={colors.primary} />
									) : null}
									{friends.map((friend) => {
										const selected = selectedFriendIds.includes(friend.id);
										return (
											<Pressable
												key={friend.id}
												hitSlop={4}
												onPress={() => toggleFriend(friend.id)}
												style={[
													styles.friendItem,
													selected && styles.friendItemSelected,
												]}
											>
												<Text style={styles.friendName}>{friend.name}</Text>
												<Text style={styles.friendHandle}>
													@{friend.username}
												</Text>
											</Pressable>
										);
									})}
								</View>
							) : null}
						</View>
					)}

					{message ? <Text style={styles.message}>{message}</Text> : null}
					{locationSummary ? (
						<Text style={styles.message}>{locationSummary}</Text>
					) : null}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
