import React from "react";
import {
	Button,
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
import { goBack } from "expo-router/build/global-state/routing";

interface UserProfile {
	name: string;
	username: string;
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
	bio: "",
	avatar: "",
};

const initialBikes: Bike[] = [
	{
		id: "1",
		brand: "Yamaha",
		model: "R15",
		year: "2022",
		image: "placeholder",
	},
];

const emptyBikeForm: BikeForm = {
	brand: "",
	model: "",
	year: "",
	image: "",
};

export default function ProfileSetupScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
	const [user, setUser] = React.useState<UserProfile>(initialUser);
	const [bikes, setBikes] = React.useState<Bike[]>(initialBikes);
	const [bikeForm, setBikeForm] = React.useState<BikeForm>(emptyBikeForm);
	const [submitting, setSubmitting] = React.useState(false);

	const [userErrors, setUserErrors] = React.useState<{
		name?: string;
		username?: string;
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
				id: `${Date.now()}`,
				brand: bikeForm.brand.trim(),
				model: bikeForm.model.trim(),
				year: bikeForm.year.trim(),
				image: bikeForm.image,
			},
		]);
		setBikeForm(emptyBikeForm);
		setBikeErrors({});
	};

	const completeSetup = () => {
		const nextErrors: { name?: string; username?: string } = {};
		if (user.name.trim().length === 0) {
			nextErrors.name = "Name is required";
		}
		if (user.username.trim().length === 0) {
			nextErrors.username = "Username is required";
		}

		setUserErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) {
			return;
		}

		setSubmitting(true);
		setTimeout(() => {
			console.log("Ready for Home");
			setSubmitting(false);
			router.replace("/(tabs)");
		}, 800);
	};

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
								mode === "edit"
									? {
											flexDirection: "row",
											justifyContent: "center",
											gap: metrics.sm,
										}
									: null
							}
						>
							{mode === "edit" && (
								<Pressable onPress={goBack} style={styles.cancelButton}>
									<Text style={styles.cancelButtonText}>Cancel</Text>
								</Pressable>
							)}
							<PrimaryButton
								loading={submitting}
								onPress={completeSetup}
								title={submitTitle}
							/>
						</View>
					</Animated.View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
