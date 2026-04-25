import React from "react";
import {
	ActivityIndicator,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import DateTimePicker, {
	DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/hooks/useTheme";
import RideService, { RideFriend } from "../src/services/RideService";
import {
	hasCompletedProfile,
	isPrivilegedAccount,
} from "../src/utils/accessControl";
import { isProfileSetupDone } from "../src/utils/profileSetupStorage";

type PrivacyMode = "friends" | "strangers" | "mixed";
type RidePace = "calm" | "balanced" | "fast";
type RoadPreference = "scenic" | "highway" | "mixed";
type DateField = "start" | "end";
type RideDetailsScreenProps = {
	forcedRideType?: "solo" | "group";
	showBackButton?: boolean;
	showTypeBadge?: boolean;
	actionPlacement?: "sticky" | "inline";
	showSafetySection?: boolean;
};

const resolveRideType = (
	value: string | string[] | undefined,
): "solo" | "group" => {
	if (Array.isArray(value)) {
		return value[0] === "group" ? "group" : "solo";
	}
	return value === "group" ? "group" : "solo";
};

const formatDateLabel = (value: Date | null) => {
	if (value == null) {
		return "Select date and time";
	}

	return value.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const titleCase = (value: string) =>
	value.charAt(0).toUpperCase() + value.slice(1);

export function RideDetailsScreen({
	forcedRideType,
	showBackButton = true,
	showTypeBadge = true,
	actionPlacement = "sticky",
	showSafetySection = true,
}: RideDetailsScreenProps) {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { user: authUser } = useAuth();
	const { colors } = useTheme();

	const palette = React.useMemo(
		() => ({
			bg: colors.background,
			card: colors.surface,
			border: colors.border,
			textPrimary: colors.textPrimary,
			textSecondary: colors.textSecondary,
			activeBg: colors.overlayLight,
			activeBorder: colors.primary,
			activeText: colors.primary,
			button: colors.buttonPrimaryBg,
			buttonText: colors.buttonPrimaryText,
			overlay: colors.overlay,
			shadow: colors.shadow,
		}),
		[colors],
	);

	const styles = React.useMemo(() => createStyles(palette), [palette]);

	const selectedType = React.useMemo<"solo" | "group">(
		() => forcedRideType ?? resolveRideType(params.rideType),
		[forcedRideType, params.rideType],
	);

	const [rideTitle, setRideTitle] = React.useState("");
	const [source, setSource] = React.useState("");
	const [destination, setDestination] = React.useState("");
	const [pickupLocation, setPickupLocation] = React.useState("");
	const [dropLocation, setDropLocation] = React.useState("");
	const [startDate, setStartDate] = React.useState<Date | null>(null);
	const [endDate, setEndDate] = React.useState<Date | null>(null);
	const [days, setDays] = React.useState("");
	const [budget, setBudget] = React.useState("");
	const [maxRiders, setMaxRiders] = React.useState("");
	const [ridePace, setRidePace] = React.useState<RidePace>("balanced");
	const [roadPreference, setRoadPreference] =
		React.useState<RoadPreference>("mixed");
	const [meetupNotes, setMeetupNotes] = React.useState("");
	const [emergencyContactName, setEmergencyContactName] = React.useState("");
	const [emergencyContactPhone, setEmergencyContactPhone] = React.useState("");
	const [rideNotes, setRideNotes] = React.useState("");
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
	const [activeField, setActiveField] = React.useState<
		"source" | "destination" | "pickup" | "drop" | null
	>(null);
	const [locationSuggestions, setLocationSuggestions] = React.useState<
		string[]
	>([]);
	const [suggesting, setSuggesting] = React.useState(false);
	const [dateField, setDateField] = React.useState<DateField>("start");
	const [showDatePicker, setShowDatePicker] = React.useState(false);
	const [pickerDraft, setPickerDraft] = React.useState(new Date());
	const [showInvitePopup, setShowInvitePopup] = React.useState(false);

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

	const redirectToLiveScreen = React.useCallback(
		(rideId: string) => {
			if (selectedType === "group") {
				router.replace(`/group-chat/${rideId}`);
				return;
			}

			router.replace(`/solo-ride/${rideId}`);
		},
		[router, selectedType],
	);

	const toggleFriend = React.useCallback((friendId: string) => {
		setSelectedFriendIds((prev) =>
			prev.includes(friendId)
				? prev.filter((id) => id !== friendId)
				: [...prev, friendId],
		);
	}, []);

	const openDatePicker = React.useCallback(
		(field: DateField) => {
			const nextValue =
				field === "start"
					? (startDate ?? new Date())
					: (endDate ?? startDate ?? new Date());

			setDateField(field);
			setPickerDraft(nextValue);

			if (Platform.OS === "android") {
				DateTimePickerAndroid.open({
					value: nextValue,
					mode: "date",
					display: "default",
					minimumDate:
						field === "end" && startDate != null ? startDate : undefined,
					onChange: (event, selectedDate) => {
						if (event.type !== "set" || selectedDate == null) {
							return;
						}

						DateTimePickerAndroid.open({
							value: selectedDate,
							mode: "time",
							display: "default",
							is24Hour: true,
							onChange: (timeEvent, selectedTime) => {
								if (timeEvent.type !== "set" || selectedTime == null) {
									return;
								}

								const combined = new Date(selectedDate);
								combined.setHours(
									selectedTime.getHours(),
									selectedTime.getMinutes(),
									0,
									0,
								);

								if (field === "start") {
									setStartDate(combined);
									if (
										endDate != null &&
										combined.getTime() > endDate.getTime()
									) {
										setEndDate(combined);
									}
								} else {
									setEndDate(combined);
								}

								setPickerDraft(combined);
							},
						});
					},
				});
				return;
			}

			setShowDatePicker(true);
		},
		[endDate, startDate],
	);

	const setDateValue = React.useCallback(
		(field: DateField, value: Date) => {
			if (field === "start") {
				setStartDate(value);
				if (endDate != null && value.getTime() > endDate.getTime()) {
					setEndDate(value);
				}
				return;
			}

			setEndDate(value);
		},
		[endDate],
	);

	const applyDatePickerValue = React.useCallback(() => {
		setDateValue(dateField, pickerDraft);

		setShowDatePicker(false);
	}, [dateField, pickerDraft, setDateValue]);

	const handleDateChange = React.useCallback(
		(_event: unknown, selectedValue?: Date) => {
			if (selectedValue) {
				setPickerDraft(selectedValue);
			}
		},
		[],
	);

	const startRideNowOrLater = React.useCallback(
		async (rideId: string, startIso: string) => {
			const startAt = new Date(startIso).getTime();
			if (Number.isNaN(startAt)) {
				await RideService.startRide(rideId);
				setMessage("Ride created and started.");
				redirectToLiveScreen(rideId);
				return;
			}

			const delay = startAt - Date.now();
			if (delay <= 0) {
				await RideService.startRide(rideId);
				setMessage("Ride started.");
				redirectToLiveScreen(rideId);
				return;
			}

			setMessage(
				"Ride created. It will auto-start at your scheduled time while this app session is active.",
			);
			setTimeout(() => {
				RideService.startRide(rideId)
					.then(() => {
						setMessage("Scheduled ride started.");
						redirectToLiveScreen(rideId);
					})
					.catch(() => {
						setMessage(
							"Ride was created but auto-start failed. Tap start manually in community.",
						);
					});
			}, delay);
		},
		[redirectToLiveScreen],
	);

	const createRide = React.useCallback(
		async (sendInvites: boolean) => {
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

			if (!source.trim() || !destination.trim() || startDate == null) {
				setMessage(
					"Please fill source, destination and choose a start date/time.",
				);
				return;
			}

			if (selectedType === "group" && endDate == null) {
				setMessage("Please choose a group ride end date/time.");
				return;
			}

			if (
				selectedType === "group" &&
				startDate != null &&
				endDate != null &&
				endDate.getTime() < startDate.getTime()
			) {
				setMessage("End date/time cannot be earlier than start date/time.");
				return;
			}

			if (
				selectedType === "group" &&
				privacy === "friends" &&
				sendInvites &&
				selectedFriendIds.length === 0
			) {
				setMessage(
					"Select at least one friend to invite for a friends-only ride.",
				);
				return;
			}

			setSubmitting(true);
			setMessage("");

			try {
				const startIso = startDate.toISOString();
				const endIso = endDate?.toISOString();

				const response = await RideService.createRide({
					rideType: selectedType,
					privacy: selectedType === "solo" ? "solo" : privacy,
					rideTitle: rideTitle.trim(),
					source,
					destination,
					pickupLocation:
						selectedType === "group" ? pickupLocation || source : source,
					dropLocation:
						selectedType === "group"
							? dropLocation || destination
							: destination,
					startDate: startIso,
					endDate: selectedType === "group" ? endIso : undefined,
					days: Number(days) || 1,
					budget: Number(budget) || 0,
					maxRiders: selectedType === "group" ? Number(maxRiders) || 0 : 0,
					ridePace,
					roadPreference,
					meetupNotes: meetupNotes.trim(),
					emergencyContactName: emergencyContactName.trim(),
					emergencyContactPhone: emergencyContactPhone.trim(),
					rideNotes: rideNotes.trim(),
					includesFood,
					includesFuel,
					bikeProvided,
					stayArranged,
					stayDetails,
					invitedFriendIds:
						selectedType === "group" &&
						(privacy === "friends" || privacy === "mixed")
							? sendInvites
								? selectedFriendIds
								: []
							: [],
				});

				await startRideNowOrLater(response.ride.id, startIso);
			} catch (error) {
				setMessage(
					error instanceof Error ? error.message : "Failed to create ride.",
				);
			} finally {
				setSubmitting(false);
			}
		},
		[
			authUser,
			bikeProvided,
			budget,
			days,
			destination,
			endDate,
			emergencyContactName,
			emergencyContactPhone,
			includesFood,
			includesFuel,
			maxRiders,
			meetupNotes,
			pickupLocation,
			dropLocation,
			privacy,
			rideNotes,
			ridePace,
			rideTitle,
			roadPreference,
			selectedFriendIds,
			selectedType,
			source,
			startDate,
			startRideNowOrLater,
			stayArranged,
			stayDetails,
			router,
		],
	);

	const onPressCreate = React.useCallback(() => {
		if (
			selectedType === "group" &&
			(privacy === "friends" || privacy === "mixed")
		) {
			setShowInvitePopup(true);
			return;
		}

		void createRide(false);
	}, [createRide, privacy, selectedType]);

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

	const renderOptionChip = (
		key: string,
		label: string,
		selected: boolean,
		onPress: () => void,
	) => (
		<Pressable
			key={key}
			hitSlop={4}
			onPress={onPress}
			style={[styles.optionChip, selected && styles.optionChipSelected]}
		>
			<Text
				style={[
					styles.optionChipText,
					selected && styles.optionChipTextSelected,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);

	return (
		<SafeAreaView
			edges={["top", "left", "right", "bottom"]}
			style={styles.container}
		>
			{Platform.OS === "ios" ? (
				<Modal animationType="fade" transparent visible={showDatePicker}>
					<View style={styles.modalOverlay}>
						<View style={styles.modalCard}>
							<Text style={styles.modalTitle}>
								{dateField === "start" ? "Pick start date" : "Pick end date"}
							</Text>
							<DateTimePicker
								display="spinner"
								minimumDate={
									dateField === "end" && startDate != null
										? startDate
										: undefined
								}
								mode="datetime"
								onChange={handleDateChange}
								value={pickerDraft}
							/>
							<View style={styles.modalActions}>
								<Pressable
									onPress={() => setShowDatePicker(false)}
									style={styles.modalAction}
								>
									<Text style={styles.modalActionText}>Cancel</Text>
								</Pressable>
								<Pressable
									onPress={applyDatePickerValue}
									style={[styles.modalAction, styles.modalActionPrimary]}
								>
									<Text
										style={[
											styles.modalActionText,
											styles.modalActionTextPrimary,
										]}
									>
										Apply
									</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</Modal>
			) : null}

			<Modal animationType="fade" transparent visible={showInvitePopup}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Send invitations now?</Text>
						<Text style={styles.modalText}>
							This {privacy} ride supports invites. You selected{" "}
							{selectedFriendIds.length} friend
							{selectedFriendIds.length === 1 ? "" : "s"}.
						</Text>

						<View style={styles.modalActions}>
							<Pressable
								onPress={() => setShowInvitePopup(false)}
								style={styles.modalAction}
							>
								<Text style={styles.modalActionText}>Back</Text>
							</Pressable>
							<Pressable
								onPress={() => {
									setShowInvitePopup(false);
									void createRide(true);
								}}
								style={[styles.modalAction, styles.modalActionPrimary]}
							>
								<Text
									style={[
										styles.modalActionText,
										styles.modalActionTextPrimary,
									]}
								>
									Send and Create
								</Text>
							</Pressable>
						</View>

						{privacy === "mixed" ? (
							<Pressable
								onPress={() => {
									setShowInvitePopup(false);
									void createRide(false);
								}}
								style={styles.modalSecondaryAction}
							>
								<Text style={styles.modalActionText}>
									Create without invites
								</Text>
							</Pressable>
						) : null}
					</View>
				</View>
			</Modal>

			<View style={styles.screen}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
					style={styles.scroll}
				>
					<View style={styles.headerBlock}>
						<View style={styles.headerRow}>
							<View style={styles.headerLeft}>
								{showBackButton ? (
									<Pressable hitSlop={8} onPress={() => router.back()}>
										<Ionicons
											color={palette.textPrimary}
											name="arrow-back"
											size={22}
										/>
									</Pressable>
								) : null}
								<Text style={styles.headerTitle}>Ride details</Text>
								{showTypeBadge ? (
									<View style={styles.groupPill}>
										<Text style={styles.groupPillText}>
											{selectedType === "group" ? "GROUP" : "SOLO"}
										</Text>
									</View>
								) : null}
							</View>
						</View>
						<Text style={styles.subtitle}>
							Plan smarter with quick cards and contextual settings.
						</Text>
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Trip basics</Text>

						<TextInput
							onChangeText={setRideTitle}
							placeholder="Ride title "
							placeholderTextColor={palette.textSecondary}
							style={styles.input}
							value={rideTitle}
						/>

						<TextInput
							onChangeText={(value) => {
								setSource(value);
								queryForSuggestions(value, "source").catch(() => {
									setLocationSuggestions([]);
								});
							}}
							placeholder="Source location"
							placeholderTextColor={palette.textSecondary}
							style={styles.input}
							value={source}
						/>
						{suggesting && activeField === "source" ? (
							<ActivityIndicator color={palette.activeBorder} size="small" />
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
							placeholderTextColor={palette.textSecondary}
							style={styles.input}
							value={destination}
						/>
						{suggesting && activeField === "destination" ? (
							<ActivityIndicator color={palette.activeBorder} size="small" />
						) : null}
						{renderLocationSuggestions("destination")}

						<Pressable
							onPress={() => openDatePicker("start")}
							style={styles.input}
						>
							<Text
								style={[
									styles.inputText,
									startDate == null && styles.inputPlaceholder,
								]}
							>
								{formatDateLabel(startDate)}
							</Text>
						</Pressable>

						<View style={styles.rowTwoInputs}>
							<TextInput
								keyboardType="numeric"
								onChangeText={setDays}
								placeholder="Days"
								placeholderTextColor={palette.textSecondary}
								style={[styles.input, styles.flexInput]}
								value={days}
							/>

							<TextInput
								keyboardType="numeric"
								onChangeText={setBudget}
								placeholder="Budget"
								placeholderTextColor={palette.textSecondary}
								style={[styles.input, styles.flexInput]}
								value={budget}
							/>
						</View>
					</View>

					{selectedType === "group" ? (
						<>
							<View style={styles.card}>
								<Text style={styles.sectionTitle}>Group ride setup</Text>

								<TextInput
									onChangeText={(value) => {
										setPickupLocation(value);
										queryForSuggestions(value, "pickup").catch(() => {
											setLocationSuggestions([]);
										});
									}}
									placeholder="Pickup location"
									placeholderTextColor={palette.textSecondary}
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
									placeholderTextColor={palette.textSecondary}
									style={styles.input}
									value={dropLocation}
								/>
								{renderLocationSuggestions("drop")}

								<Pressable
									onPress={() => openDatePicker("end")}
									style={styles.input}
								>
									<Text
										style={[
											styles.inputText,
											endDate == null && styles.inputPlaceholder,
										]}
									>
										{formatDateLabel(endDate)}
									</Text>
								</Pressable>

								<View style={styles.rowTwoInputs}>
									<TextInput
										keyboardType="numeric"
										onChangeText={setMaxRiders}
										placeholder="Max riders"
										placeholderTextColor={palette.textSecondary}
										style={[styles.input, styles.flexInput]}
										value={maxRiders}
									/>
								</View>
							</View>

							<View style={styles.card}>
								<Text style={styles.sectionTitle}>Who can join?</Text>
								<View style={styles.optionWrap}>
									{renderOptionChip(
										"privacy-friends",
										"Friends",
										privacy === "friends",
										() => setPrivacy("friends"),
									)}
									{renderOptionChip(
										"privacy-strangers",
										"Strangers",
										privacy === "strangers",
										() => setPrivacy("strangers"),
									)}
									{renderOptionChip(
										"privacy-mixed",
										"Mixed",
										privacy === "mixed",
										() => setPrivacy("mixed"),
									)}
								</View>
								<Text style={styles.helperText}>
									Friends and Mixed rides can trigger invitation flow before
									creation.
								</Text>
							</View>
						</>
					) : null}

					{selectedType === "group" ? (
						<>
							<View style={styles.card}>
								<Text style={styles.sectionTitle}>Ride preferences</Text>
								<View style={styles.twoColumnRow}>
									<View style={styles.column}>
										<Text style={styles.columnTitle}>Ride pace</Text>
										<View style={styles.optionWrap}>
											{(["calm", "balanced", "fast"] as RidePace[]).map((value) =>
												renderOptionChip(
													`pace-${value}`,
													titleCase(value),
													ridePace === value,
													() => setRidePace(value),
												),
											)}
										</View>
									</View>
									<View style={styles.column}>
										<Text style={styles.columnTitle}>Road preference</Text>
										<View style={styles.optionWrap}>
											{(["scenic", "highway", "mixed"] as RoadPreference[]).map(
												(value) =>
													renderOptionChip(
														`road-${value}`,
														titleCase(value),
														roadPreference === value,
														() => setRoadPreference(value),
													),
											)}
										</View>
									</View>
								</View>
							</View>

							<View style={styles.card}>
								<Text style={styles.sectionTitle}>Logistics</Text>
								<View style={styles.switchRow}>
									<Text style={styles.switchLabel}>Food included</Text>
									<Switch onValueChange={setIncludesFood} value={includesFood} />
								</View>
								<View style={styles.switchRow}>
									<Text style={styles.switchLabel}>Fuel included</Text>
									<Switch onValueChange={setIncludesFuel} value={includesFuel} />
								</View>
								<View style={styles.switchRow}>
									<Text style={styles.switchLabel}>Bike provided</Text>
									<Switch onValueChange={setBikeProvided} value={bikeProvided} />
								</View>
								<View style={styles.switchRowLast}>
									<Text style={styles.switchLabel}>Stay arranged</Text>
									<Switch onValueChange={setStayArranged} value={stayArranged} />
								</View>
								{stayArranged ? (
									<TextInput
										multiline
										onChangeText={setStayDetails}
										placeholder="Stay details (hotel, check-in, room sharing, etc.)"
										placeholderTextColor={palette.textSecondary}
										style={[styles.input, styles.textArea]}
										value={stayDetails}
									/>
								) : null}
							</View>

							{showSafetySection ? (
								<View style={styles.card}>
									<Text style={styles.sectionTitle}>Safety and communication</Text>
									<TextInput
										onChangeText={setEmergencyContactName}
										placeholder="Emergency contact name"
										placeholderTextColor={palette.textSecondary}
										style={styles.input}
										value={emergencyContactName}
									/>
									<TextInput
										keyboardType="phone-pad"
										onChangeText={setEmergencyContactPhone}
										placeholder="Emergency contact phone"
										placeholderTextColor={palette.textSecondary}
										style={styles.input}
										value={emergencyContactPhone}
									/>
									<TextInput
										multiline
										onChangeText={setMeetupNotes}
										placeholder="Meetup notes (helmet checks, exact landmark, fuel stop before departure)"
										placeholderTextColor={palette.textSecondary}
										style={[styles.input, styles.textArea]}
										value={meetupNotes}
									/>
									<TextInput
										multiline
										onChangeText={setRideNotes}
										placeholder="Extra ride notes (weather backup route, regroup points, leader instructions)"
										placeholderTextColor={palette.textSecondary}
										style={[styles.input, styles.textArea]}
										value={rideNotes}
									/>
								</View>
							) : null}
						</>
					) : null}

					{selectedType === "group" &&
					(privacy === "friends" || privacy === "mixed") ? (
						<View style={styles.card}>
							<Text style={styles.sectionTitle}>Invite friends</Text>
							<Text style={styles.helperText}>
								Tap riders to include in the invite popup before final create.
							</Text>
							{loadingFriends ? (
								<ActivityIndicator color={palette.activeBorder} size="small" />
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
										<Text style={styles.friendHandle}>@{friend.username}</Text>
									</Pressable>
								);
							})}
						</View>
					) : null}

					{message ? <Text style={styles.message}>{message}</Text> : null}

					{actionPlacement === "inline" ? (
						<View style={styles.inlineActionWrap}>
							<Pressable
								disabled={submitting}
								onPress={onPressCreate}
								style={styles.createButton}
							>
								{submitting ? (
									<ActivityIndicator color={palette.buttonText} size="small" />
								) : (
									<Text style={styles.createButtonText}>
										Create {selectedType === "solo" ? "Solo" : "Group"} Ride
									</Text>
								)}
							</Pressable>
						</View>
					) : null}
				</ScrollView>

				{actionPlacement === "sticky" ? (
					<View style={styles.footer}>
						<Pressable
							disabled={submitting}
							onPress={onPressCreate}
							style={styles.createButton}
						>
							{submitting ? (
								<ActivityIndicator color={palette.buttonText} size="small" />
							) : (
								<Text style={styles.createButtonText}>
									Create {selectedType === "solo" ? "Solo" : "Group"} Ride
								</Text>
							)}
						</Pressable>
					</View>
				) : null}
			</View>
		</SafeAreaView>
	);
}

export default function RideDetailsRoute() {
	return <RideDetailsScreen />;
}

const createStyles = (palette: {
	bg: string;
	card: string;
	border: string;
	textPrimary: string;
	textSecondary: string;
	activeBg: string;
	activeBorder: string;
	activeText: string;
	button: string;
	buttonText: string;
	overlay: string;
	shadow: string;
}) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: palette.bg,
	},
	screen: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 140,
		gap: 24,
	},
	headerBlock: {
		paddingTop: 4,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	headerTitle: {
		fontSize: 30,
		fontWeight: "700",
		color: palette.textPrimary,
	},
	groupPill: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: palette.activeBg,
		borderWidth: 1,
		borderColor: palette.activeBorder,
	},
	groupPillText: {
		fontSize: 12,
		fontWeight: "700",
		color: palette.activeBorder,
	},
	subtitle: {
		marginTop: 4,
		fontSize: 13,
		color: palette.textSecondary,
		lineHeight: 18,
	},
	card: {
		backgroundColor: palette.card,
		borderWidth: 1,
		borderColor: palette.border,
		borderRadius: 16,
		padding: 16,
		shadowColor: palette.shadow,
		shadowOpacity: 0.03,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 10,
		elevation: 1,
		gap: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: palette.textPrimary,
		marginBottom: 4,
	},
	input: {
		height: 48,
		borderWidth: 1,
		borderColor: palette.border,
		borderRadius: 12,
		paddingHorizontal: 12,
		backgroundColor: palette.card,
		justifyContent: "center",
		fontSize: 14,
		color: palette.textPrimary,
	},
	inputText: {
		fontSize: 14,
		color: palette.textPrimary,
	},
	inputPlaceholder: {
		color: palette.textSecondary,
	},
	textArea: {
		minHeight: 100,
		height: 100,
		paddingTop: 12,
		textAlignVertical: "top",
	},
	rowTwoInputs: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
	},
	flexInput: {
		flex: 1,
	},
	helperText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 17,
		color: palette.textSecondary,
		paddingTop: 8,
	},
	optionWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	optionChip: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: palette.border,
		backgroundColor: palette.card,
		alignItems: "center",
		justifyContent: "center",
	},
	optionChipSelected: {
		backgroundColor: palette.activeBg,
		borderColor: palette.activeBorder,
	},
	optionChipText: {
		fontSize: 13,
		fontWeight: "600",
		color: palette.textSecondary,
	},
	optionChipTextSelected: {
		color: palette.activeText,
	},
	twoColumnRow: {
		flexDirection: "row",
		gap: 12,
		alignItems: "flex-start",
	},
	column: {
		flex: 1,
		gap: 10,
	},
	columnTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: palette.textPrimary,
	},
	switchRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: palette.border,
	},
	switchRowLast: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
	},
	switchLabel: {
		fontSize: 14,
		color: palette.textPrimary,
		fontWeight: "500",
	},
	friendItem: {
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: palette.border,
		backgroundColor: palette.card,
		gap: 2,
	},
	friendItemSelected: {
		backgroundColor: palette.activeBg,
		borderColor: palette.activeBorder,
	},
	friendName: {
		fontSize: 14,
		fontWeight: "600",
		color: palette.textPrimary,
	},
	friendHandle: {
		fontSize: 12,
		color: palette.textSecondary,
	},
	message: {
		fontSize: 13,
		fontWeight: "600",
		lineHeight: 20,
		color: palette.activeBorder,
	},
	inlineActionWrap: {
		paddingTop: 4,
		paddingBottom: 8,
	},
	suggestionWrap: {
		borderWidth: 1,
		borderColor: palette.border,
		borderRadius: 12,
		overflow: "hidden",
	},
	suggestionItem: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		backgroundColor: palette.card,
		borderBottomWidth: 1,
		borderBottomColor: palette.border,
	},
	suggestionText: {
		fontSize: 13,
		color: palette.textPrimary,
	},
	footer: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 14,
		backgroundColor: palette.card,
		borderTopWidth: 1,
		borderTopColor: palette.border,
		shadowColor: palette.shadow,
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: -2 },
		shadowRadius: 8,
		elevation: 6,
	},
	createButton: {
		height: 56,
		borderRadius: 12,
		backgroundColor: palette.button,
		justifyContent: "center",
		alignItems: "center",
	},
	createButtonText: {
		fontSize: 17,
		fontWeight: "700",
		color: palette.buttonText,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: palette.overlay,
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	modalCard: {
		backgroundColor: palette.card,
		borderWidth: 1,
		borderColor: palette.border,
		borderRadius: 16,
		padding: 16,
		gap: 12,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: palette.textPrimary,
	},
	modalText: {
		fontSize: 14,
		lineHeight: 20,
		color: palette.textSecondary,
	},
	modalActions: {
		flexDirection: "row",
		gap: 10,
	},
	modalAction: {
		flex: 1,
		height: 44,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: palette.border,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: palette.card,
	},
	modalActionPrimary: {
		borderColor: palette.activeBorder,
		backgroundColor: palette.activeBg,
	},
	modalActionText: {
		fontSize: 14,
		fontWeight: "600",
		color: palette.textPrimary,
	},
	modalActionTextPrimary: {
		color: palette.activeText,
	},
	modalSecondaryAction: {
		height: 44,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: palette.border,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: palette.card,
	},
});
