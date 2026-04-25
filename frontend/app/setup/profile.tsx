import React from "react";
import {
	KeyboardAvoidingView,
	LayoutAnimation,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	AvatarPicker,
	BikeCard,
	type Bike,
} from "../../src/components/profile";
import {
	FormInput,
	PrimaryButton,
	ThemeToggleButton,
} from "../../src/components/common";
import { useTheme } from "../../src/hooks/useTheme";
import { useAuth } from "../../src/contexts/AuthContext";
import ProfileService from "../../src/services/ProfileService";
import {
	getStoredDriverLicense,
	markProfileSetupSkipped,
	markProfileSetupDone,
} from "../../src/utils/profileSetupStorage";
import { isPrivilegedAccount } from "../../src/utils/accessControl";

interface UserProfile {
	name: string;
	username: string;
	driverLicenseNumber: string;
	bio: string;
	avatar: string;
}

interface BikeForm {
	brand: string;
	model: string;
	year: string;
	image: string;
}

const initialUser: UserProfile = {
	name: "",
	username: "",
	driverLicenseNumber: "",
	bio: "",
	avatar: "",
};

const initialBikes: Bike[] = [
	// Loaded from backend when available.
];

const emptyBikeForm: BikeForm = {
	brand: "",
	model: "",
	year: "",
	image: "",
};

export default function ProfileSetupScreen() {
	const { colors, metrics, typography } = useTheme();
	const { user: authUser } = useAuth();
	const router = useRouter();
	const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
	const [user, setUser] = React.useState<UserProfile>(initialUser);
	const [bikes, setBikes] = React.useState<Bike[]>(initialBikes);
	const [bikeForm, setBikeForm] = React.useState<BikeForm>(emptyBikeForm);
	const [submitting, setSubmitting] = React.useState(false);
	const [loadError, setLoadError] = React.useState<string | null>(null);

	const [userErrors, setUserErrors] = React.useState<{
		name?: string;
		username?: string;
		driverLicenseNumber?: string;
	}>({});
	const [bikeErrors, setBikeErrors] = React.useState<{
		brand?: string;
		model?: string;
		year?: string;
	}>({});

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				keyboardContainer: {
					flex: 1,
					backgroundColor: colors.background,
				},
				topRightToggle: {
					position: "absolute",
					top: metrics.lg,
					right: metrics.lg,
					zIndex: 10,
				},
				scrollContent: {
					padding: metrics.lg,
					paddingBottom: metrics["3xl"],
				},
				container: {
					gap: metrics.lg,
				},
				titleRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes["xl"],
					fontWeight: "700",
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
				},
				section: {
					gap: metrics.md,
					backgroundColor: colors.surface,
					padding: metrics.md,
					borderRadius: metrics.radius.xl,
					borderWidth: 1,
					borderColor: colors.borderDark,
				},
				sectionTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "600",
				},
				requiredHintRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: 4,
					marginTop: -metrics.xs,
				},
				requiredAsterisk: {
					color: colors.error,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				requiredHintText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
				},
				optionalText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
				},
				bikeList: {
					gap: metrics.sm,
				},
				emptyState: {
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					borderStyle: "dashed",
					minHeight: 108,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: metrics.md,
					gap: metrics.xs,
				},
				emptyTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "600",
				},
				emptyText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
				},
				cancelButton: {
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: metrics.radius.xl,
					textAlign: "center",
					justifyContent: "center",
					paddingHorizontal: metrics.md,
				},
				cancelButtonText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					fontWeight: "600",
				},
			}),
		[colors, metrics, typography],
	);

	const isEditMode = React.useMemo(() => {
		const modeValue = Array.isArray(mode) ? mode[0] : mode;
		return modeValue === "edit";
	}, [mode]);

	const screenTitle = isEditMode
		? "Edit Your Profile"
		: "Complete Your Profile";
	const screenSubtitle = isEditMode
		? "Update your rider identity and garage."
		: "Set up your rider identity and garage.";
	const submitTitle = isEditMode ? "Save Profile" : "Complete Setup";
	const canSkip = !isEditMode && !isPrivilegedAccount(authUser?.email);

	React.useEffect(() => {
		if (authUser == null) {
			return;
		}

		let mounted = true;

		setUser((previous) => ({
			...previous,
			name: authUser.name || previous.name,
			username: authUser.username || previous.username,
		}));

		ProfileService.getMyProfile()
			.then((data) => {
				if (!mounted) {
					return;
				}

				setUser((previous) => ({
					...previous,
					name: data.profile.name || previous.name,
					username: data.profile.username || previous.username,
					driverLicenseNumber:
						data.profile.driverLicenseNumber || previous.driverLicenseNumber,
					bio: data.profile.bio || previous.bio,
					avatar: data.profile.profileImageUrl || previous.avatar,
				}));

				setBikes(
					data.bikes.map((bike) => ({
						id: bike.id,
						brand: bike.brand,
						model: bike.model,
						year: String(bike.year),
						image: bike.bikeImageUrl || "",
					})),
				);
			})
			.catch(() => {
				if (mounted) {
					setLoadError("Unable to load saved profile. You can still continue.");
				}
			});

		getStoredDriverLicense(authUser.firebaseUid)
			.then((license) => {
				if (license && mounted) {
					setUser((previous) => ({
						...previous,
						driverLicenseNumber: license,
					}));
				}
			})
			.catch(() => {
				// Ignore local storage read failures.
			});

		return () => {
			mounted = false;
		};
	}, [authUser]);

	const validateBike = () => {
		const nextErrors: { brand?: string; model?: string; year?: string } = {};

		if (bikeForm.brand.trim().length === 0) {
			nextErrors.brand = "Brand is required";
		}
		if (bikeForm.model.trim().length === 0) {
			nextErrors.model = "Model is required";
		}
		if (!/^\d{4}$/.test(bikeForm.year.trim())) {
			nextErrors.year = "Year must be 4 digits";
		}

		setBikeErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const addBike = () => {
		if (!validateBike()) {
			return;
		}

		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setBikes((previous) => [
			...previous,
			{
				id: `local-${Date.now()}`,
				brand: bikeForm.brand.trim(),
				model: bikeForm.model.trim(),
				year: bikeForm.year.trim(),
				image: bikeForm.image,
			},
		]);
		setBikeForm(emptyBikeForm);
		setBikeErrors({});
	};

	const completeSetup = async () => {
		const nextErrors: {
			name?: string;
			username?: string;
			driverLicenseNumber?: string;
		} = {};
		if (user.name.trim().length === 0) {
			nextErrors.name = "Name is required";
		}
		if (user.username.trim().length === 0) {
			nextErrors.username = "Username is required";
		}
		if (!isEditMode && user.driverLicenseNumber.trim().length < 6) {
			nextErrors.driverLicenseNumber =
				"Driver's license is required (min 6 characters)";
		}

		setUserErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) {
			return;
		}

		setSubmitting(true);
		setLoadError(null);

		if (authUser == null) {
			setSubmitting(false);
			router.replace("/auth/login");
			return;
		}

		try {
			await ProfileService.updateMyProfile({
				name: user.name.trim(),
				username: user.username.trim().toLowerCase(),
				bio: user.bio.trim(),
				driverLicenseNumber: user.driverLicenseNumber.trim(),
				profileImageUrl: user.avatar || undefined,
			});

			const localBikes = bikes.filter((bike) => bike.id.startsWith("local-"));
			for (const bike of localBikes) {
				await ProfileService.addGarageBike({
					brand: bike.brand,
					model: bike.model,
					year: Number(bike.year),
					bikeImageUrl: bike.image || undefined,
				});
			}

			await markProfileSetupDone(
				authUser.firebaseUid,
				user.driverLicenseNumber.trim(),
			);

			setSubmitting(false);
			router.replace("/(tabs)");
		} catch (error) {
			setSubmitting(false);
			setLoadError(
				error instanceof Error
					? error.message
					: "Unable to save profile details right now.",
			);
		}
	};

	const skipForNow = React.useCallback(async () => {
		if (authUser == null) {
			router.replace("/auth/login");
			return;
		}

		await markProfileSetupSkipped(authUser.firebaseUid);
		router.replace("/(tabs)");
	}, [authUser, router]);

	return (
		<SafeAreaView
			edges={["top", "left", "right"]}
			style={styles.keyboardContainer}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.keyboardContainer}
			>
				<View style={styles.topRightToggle}>
					<ThemeToggleButton />
				</View>

				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<Animated.View
						entering={FadeInDown.duration(400)}
						style={styles.container}
					>
						<View style={styles.titleRow}>
							<Ionicons
								color={colors.primary}
								name="person-circle-outline"
								size={28}
							/>
							<Text style={styles.title}>{screenTitle}</Text>
						</View>
						<Text style={styles.subtitle}>{screenSubtitle}</Text>

						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Profile Info</Text>
							<View style={styles.requiredHintRow}>
								<Text style={styles.requiredAsterisk}>*</Text>
								<Text style={styles.requiredHintText}>Required fields</Text>
							</View>
							<AvatarPicker
								onChange={(uri) =>
									setUser((previous) => ({ ...previous, avatar: uri }))
								}
								value={user.avatar}
							/>
							<FormInput
								error={userErrors.name}
								label="Full Name"
								required
								onChangeText={(name) =>
									setUser((previous) => ({ ...previous, name }))
								}
								placeholder="Enter your full name"
								value={user.name}
							/>
							<FormInput
								autoCapitalize="none"
								error={userErrors.username}
								label="Username"
								required
								onChangeText={(username) =>
									setUser((previous) => ({ ...previous, username }))
								}
								placeholder="johnrider"
								value={user.username}
							/>
							<FormInput
								autoCapitalize="characters"
								error={userErrors.driverLicenseNumber}
								label="Driver's License Number"
								required={!isEditMode}
								onChangeText={(driverLicenseNumber) =>
									setUser((previous) => ({ ...previous, driverLicenseNumber }))
								}
								placeholder="Enter your license number"
								value={user.driverLicenseNumber}
							/>
							<FormInput
								autoCapitalize="sentences"
								label="Bio"
								multiline
								numberOfLines={3}
								onChangeText={(bio) =>
									setUser((previous) => ({ ...previous, bio }))
								}
								placeholder="Tell your ride story"
								value={user.bio}
							/>
						</View>

						<View style={styles.section}>
							<View
								style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
							>
								<Text style={styles.sectionTitle}>Garage Setup</Text>
								<Text style={styles.optionalText}>(Optional)</Text>
							</View>
							<FormInput
								error={bikeErrors.brand}
								label="Bike Brand"
								onChangeText={(brand) =>
									setBikeForm((previous) => ({ ...previous, brand }))
								}
								placeholder="Yamaha"
								value={bikeForm.brand}
							/>
							<FormInput
								error={bikeErrors.model}
								label="Bike Model"
								onChangeText={(model) =>
									setBikeForm((previous) => ({ ...previous, model }))
								}
								placeholder="R15"
								value={bikeForm.model}
							/>
							<FormInput
								error={bikeErrors.year}
								keyboardType="number-pad"
								label="Year"
								onChangeText={(year) =>
									setBikeForm((previous) => ({ ...previous, year }))
								}
								placeholder="2022"
								value={bikeForm.year}
							/>
							<FormInput
								label="Bike Image URL (Mock)"
								onChangeText={(image) =>
									setBikeForm((previous) => ({ ...previous, image }))
								}
								placeholder="Optional image URL"
								value={bikeForm.image}
							/>
							<PrimaryButton onPress={addBike} title="Add Bike" />
						</View>

						<View style={styles.section}>
							<Text style={styles.sectionTitle}>My Bikes</Text>
							{bikes.length === 0 ? (
								<View style={styles.emptyState}>
									<Text style={styles.emptyTitle}>No bikes yet</Text>
									<Text style={styles.emptyText}>
										Add your first bike to build your garage.
									</Text>
								</View>
							) : (
								<View style={styles.bikeList}>
									{bikes.map((bike) => (
										<BikeCard bike={bike} key={bike.id} />
									))}
								</View>
							)}
						</View>

						<View
							style={
								mode === "edit" || canSkip
									? {
											flexDirection: "row",
											justifyContent: "center",
											gap: metrics.sm,
										}
									: null
							}
						>
							{mode === "edit" && (
								<Pressable
									onPress={() => router.back()}
									style={styles.cancelButton}
								>
									<Text style={styles.cancelButtonText}>Cancel</Text>
								</Pressable>
							)}
							{canSkip && (
								<Pressable onPress={skipForNow} style={styles.cancelButton}>
									<Text style={styles.cancelButtonText}>Skip for now</Text>
								</Pressable>
							)}
							<PrimaryButton
								loading={submitting}
								onPress={completeSetup}
								title={submitTitle}
							/>
						</View>
						{loadError ? (
							<Text
								style={{ color: colors.error, fontSize: typography.sizes.sm }}
							>
								{loadError}
							</Text>
						) : null}
					</Animated.View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
