import React from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
<<<<<<< HEAD
=======
	Linking,
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
<<<<<<< HEAD
import { SettingsDrawer } from "../src/components/settings";
=======
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
import ProfileService from "../src/services/ProfileService";
import AuthService from "../src/services/AuthService";
import { usePlaybackSettings } from "../src/hooks/usePlaybackSettings";
import { useTheme } from "../src/hooks/useTheme";

const FALLBACK_AVATAR =
	"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80";

type ProfileDraft = {
	name: string;
	username: string;
	bio: string;
	mobileNumber: string;
	driverLicenseNumber: string;
	profileImageUrl: string;
	bannerImageUrl: string;
	profileImageData?: string;
	profileImageMimeType?: string;
	bannerImageData?: string;
	bannerImageMimeType?: string;
};

const blobToDataUrl = async (uri: string) => {
	const response = await fetch(uri);
	const blob = await response.blob();

	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error("Failed to prepare image upload."));
		reader.onloadend = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}

			reject(new Error("Failed to read selected image."));
		};

		reader.readAsDataURL(blob);
	});
};

export default function SettingsScreen() {
	const router = useRouter();
	const { colors, metrics, typography } = useTheme();
<<<<<<< HEAD
	const { dataSaverEnabled, setDataSaverEnabled } = usePlaybackSettings();
=======
	const insets = useSafeAreaInsets();
	const { dataSaverEnabled } = usePlaybackSettings();
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [isEditorOpen, setIsEditorOpen] = React.useState(false);
	const [draft, setDraft] = React.useState<ProfileDraft | null>(null);

	const loadProfile = React.useCallback(async () => {
		setLoading(true);
		try {
			const data = await ProfileService.getMyProfile();
			setDraft({
				name: data.profile.name ?? "",
				username: data.profile.username ?? "",
				bio: data.profile.bio ?? "",
				mobileNumber: data.profile.mobileNumber ?? "",
				driverLicenseNumber: data.profile.driverLicenseNumber ?? "",
				profileImageUrl: data.profile.profileImageUrl ?? FALLBACK_AVATAR,
				bannerImageUrl:
					data.profile.bannerImageUrl ??
					data.profile.profileImageUrl ??
					FALLBACK_AVATAR,
			});
		} catch (error) {
			Alert.alert(
				"Unable to load settings",
				error instanceof Error
					? error.message
					: "Failed to fetch profile data.",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void loadProfile();
	}, [loadProfile]);

	const pickImage = React.useCallback(async (target: "profile" | "banner") => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				"Permission needed",
				"Allow gallery access to update images.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			quality: 0.85,
		});

		if (result.canceled || result.assets.length === 0) {
			return;
		}

		const asset = result.assets[0];
		const dataUrl = await blobToDataUrl(asset.uri);
		const mimeType = asset.mimeType || "image/jpeg";

		setDraft((prev) => {
			if (!prev) {
				return prev;
			}

			if (target === "profile") {
				return {
					...prev,
					profileImageUrl: asset.uri,
					profileImageData: dataUrl,
					profileImageMimeType: mimeType,
				};
			}

			return {
				...prev,
				bannerImageUrl: asset.uri,
				bannerImageData: dataUrl,
				bannerImageMimeType: mimeType,
			};
		});
	}, []);

	const saveProfile = React.useCallback(async () => {
		if (!draft) {
			return;
		}

		setSaving(true);
		try {
			await ProfileService.updateMyProfile({
				name: draft.name.trim(),
				username: draft.username.trim(),
				bio: draft.bio,
				mobileNumber: draft.mobileNumber,
				driverLicenseNumber: draft.driverLicenseNumber,
				profileImageUrl: draft.profileImageData
					? undefined
					: draft.profileImageUrl,
				profileImageData: draft.profileImageData,
				profileImageMimeType: draft.profileImageMimeType,
				bannerImageUrl: draft.bannerImageData
					? undefined
					: draft.bannerImageUrl,
				bannerImageData: draft.bannerImageData,
				bannerImageMimeType: draft.bannerImageMimeType,
			});

			Alert.alert("Updated", "Profile settings saved.");
			setIsEditorOpen(false);
			await loadProfile();
		} catch (error) {
			Alert.alert(
				"Save failed",
				error instanceof Error ? error.message : "Could not update profile.",
			);
		} finally {
			setSaving(false);
		}
	}, [draft, loadProfile]);

	const handleSignOut = React.useCallback(async () => {
		try {
			await AuthService.logout();
			router.replace("/auth/login");
		} catch (error) {
			Alert.alert(
				"Sign out failed",
				error instanceof Error ? error.message : "Please try again.",
			);
		}
	}, [router]);

<<<<<<< HEAD
	const styles = React.useMemo(
		() =>
			StyleSheet.create({
=======
	const openHelp = React.useCallback(() => {
		void Linking.openURL("https://riderscompanion.com/delete-account.html");
	}, []);

	const openPrivacy = React.useCallback(() => {
		void Linking.openURL("https://riderscompanion.com/privacy.html");
	}, []);

	const openAppearance = React.useCallback(() => {
		router.push("/settings/appearance");
	}, [router]);

	const openDataSaver = React.useCallback(() => {
		router.push("/settings/data-saver");
	}, [router]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					height: 64,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: metrics.md,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				},
				headerTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				content: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
					paddingBottom: metrics["3xl"] + insets.bottom,
					gap: metrics.lg,
				},
				profileCard: {
					borderRadius: metrics.radius.xl,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					padding: metrics.md,
					gap: metrics.sm,
				},
				profileRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				profileAvatar: {
					width: 64,
					height: 64,
					borderRadius: 32,
					backgroundColor: colors.surface,
				},
				profileName: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				profileMeta: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					marginTop: 2,
				},
				profileButton: {
					alignSelf: "flex-start",
					marginTop: metrics.sm,
					borderRadius: metrics.radius.full,
					paddingHorizontal: metrics.lg,
					paddingVertical: metrics.xs + 6,
					borderWidth: 1,
					borderColor: colors.primary,
				},
				profileButtonText: {
					color: colors.primary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				sectionTitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.6,
					marginBottom: metrics.sm,
				},
				listCard: {
					borderRadius: metrics.radius.xl,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					overflow: "hidden",
				},
				itemRow: {
					minHeight: 72,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
				},
				itemIcon: {
					width: 44,
					height: 44,
					borderRadius: 14,
					backgroundColor: colors.surface,
					alignItems: "center",
					justifyContent: "center",
					borderWidth: 1,
					borderColor: colors.border,
				},
				itemBody: {
					flex: 1,
				},
				itemTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				itemSubtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					marginTop: 2,
				},
				divider: {
					height: 1,
					backgroundColor: colors.border,
					marginHorizontal: metrics.md,
				},
				signOutButton: {
					height: metrics.button.md.height,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "row",
					gap: metrics.sm,
				},
				signOutText: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
				editorBackdrop: {
					flex: 1,
					backgroundColor: colors.overlay,
					justifyContent: "center",
					paddingHorizontal: metrics.md,
				},
				editorCard: {
					maxHeight: "90%",
					borderRadius: metrics.radius.xl,
					backgroundColor: colors.card,
					padding: metrics.md,
					gap: metrics.md,
				},
<<<<<<< HEAD
				header: {
=======
				editorHeader: {
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				fieldWrap: {
					gap: metrics.xs,
				},
				label: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.3,
				},
				input: {
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: metrics.radius.md,
					paddingHorizontal: metrics.sm,
					paddingVertical: metrics.sm,
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
				},
				textarea: {
					minHeight: 82,
					textAlignVertical: "top",
				},
				imageRow: {
					flexDirection: "row",
					gap: metrics.sm,
				},
				imageCard: {
					flex: 1,
					gap: metrics.xs,
				},
				imagePreview: {
					width: "100%",
					height: 88,
					borderRadius: metrics.radius.md,
					backgroundColor: colors.surface,
				},
				pickButton: {
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: metrics.xs + 4,
					borderRadius: metrics.radius.full,
					borderWidth: 1,
					borderColor: colors.primary,
				},
				pickButtonText: {
					color: colors.primary,
					fontWeight: "700",
					fontSize: typography.sizes.sm,
				},
				saveButton: {
					marginTop: metrics.sm,
					height: metrics.button.md.height,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
				},
				saveButtonText: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
			}),
<<<<<<< HEAD
		[colors, metrics, typography],
=======
		[colors, insets.bottom, metrics, typography],
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	);

	if (loading || !draft) {
		return (
<<<<<<< HEAD
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator color={colors.primary} size="small" />
=======
			<View style={styles.container}>
				<SafeAreaView
					edges={["top", "left", "right", "bottom"]}
					style={styles.container}
				>
					<View style={styles.header}>
						<Pressable onPress={() => router.back()} hitSlop={8}>
							<Ionicons
								color={colors.textPrimary}
								name="arrow-back"
								size={22}
							/>
						</Pressable>
						<Text style={styles.headerTitle}>Settings</Text>
						<View style={{ width: 22 }} />
					</View>
					<View
						style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
					>
						<ActivityIndicator color={colors.primary} size="small" />
					</View>
				</SafeAreaView>
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
			</View>
		);
	}

	const displayName = draft.name.trim().length > 0 ? draft.name : "Rider";
<<<<<<< HEAD
	const avatarLetter = (displayName[0] || "R").toUpperCase();

	return (
		<>
			<SettingsDrawer
				onClose={() => router.back()}
				onHelpPress={() => Alert.alert("Help", "Support chat is coming soon.")}
				onNotificationsPress={() => router.push("/notifications")}
				onPrivacyPress={() =>
					Alert.alert("Privacy", "Advanced privacy controls are coming soon.")
				}
				onProfilePress={() => setIsEditorOpen(true)}
				onSignOutPress={() => void handleSignOut()}
				dataSaverEnabled={dataSaverEnabled}
				onToggleDataSaver={() => void setDataSaverEnabled(!dataSaverEnabled)}
				username={displayName}
				avatarLetter={avatarLetter}
			/>
=======

	return (
		<>
			<View style={styles.container}>
				<SafeAreaView
					edges={["top", "left", "right", "bottom"]}
					style={styles.container}
				>
					<View style={styles.header}>
						<Pressable onPress={() => router.back()} hitSlop={8}>
							<Ionicons
								color={colors.textPrimary}
								name="arrow-back"
								size={22}
							/>
						</Pressable>
						<Text style={styles.headerTitle}>Settings</Text>
						<View style={{ width: 22 }} />
					</View>

					<ScrollView
						contentContainerStyle={styles.content}
						showsVerticalScrollIndicator={false}
					>
						<View style={styles.profileCard}>
							<View style={styles.profileRow}>
								<Image
									source={{ uri: draft.profileImageUrl }}
									style={styles.profileAvatar}
								/>
								<View style={{ flex: 1 }}>
									<Text style={styles.profileName}>{displayName}</Text>
									<Text style={styles.profileMeta}>
										@{draft.username || "rider"}
									</Text>
									<Text style={styles.profileMeta} numberOfLines={2}>
										{draft.bio || "Update your profile details and ride info."}
									</Text>
								</View>
							</View>
							<Pressable
								onPress={() => setIsEditorOpen(true)}
								style={styles.profileButton}
							>
								<Text style={styles.profileButtonText}>Edit Profile</Text>
							</Pressable>
						</View>

						<View>
							<Text style={styles.sectionTitle}>PREFERENCES</Text>
							<View style={styles.listCard}>
								<Pressable
									onPress={openAppearance}
									style={({ pressed }) => [
										styles.itemRow,
										pressed && { backgroundColor: colors.surfaceMuted },
									]}
								>
									<View style={styles.itemIcon}>
										<Ionicons
											color={colors.primary}
											name="color-palette-outline"
											size={metrics.icon.md}
										/>
									</View>
									<View style={styles.itemBody}>
										<Text style={styles.itemTitle}>Appearance</Text>
										<Text style={styles.itemSubtitle}>
											Theme and display options
										</Text>
									</View>
									<Ionicons
										color={colors.textSecondary}
										name="chevron-forward"
										size={metrics.icon.md}
									/>
								</Pressable>
								<View style={styles.divider} />
								<Pressable
									onPress={openDataSaver}
									style={({ pressed }) => [
										styles.itemRow,
										pressed && { backgroundColor: colors.surfaceMuted },
									]}
								>
									<View style={styles.itemIcon}>
										<Ionicons
											color={colors.primary}
											name="cellular-outline"
											size={metrics.icon.md}
										/>
									</View>
									<View style={styles.itemBody}>
										<Text style={styles.itemTitle}>Data Saver</Text>
										<Text style={styles.itemSubtitle}>
											{dataSaverEnabled
												? "Enabled for lighter playback"
												: "Preload nearby clips for speed"}
										</Text>
									</View>
									<Ionicons
										color={colors.textSecondary}
										name="chevron-forward"
										size={metrics.icon.md}
									/>
								</Pressable>
							</View>
						</View>

						<View>
							<Text style={styles.sectionTitle}>ACCOUNT</Text>
							<View style={styles.listCard}>
								<Pressable
									onPress={() => router.push("/notifications")}
									style={({ pressed }) => [
										styles.itemRow,
										pressed && { backgroundColor: colors.surfaceMuted },
									]}
								>
									<View style={styles.itemIcon}>
										<Ionicons
											color={colors.primary}
											name="notifications-outline"
											size={metrics.icon.md}
										/>
									</View>
									<View style={styles.itemBody}>
										<Text style={styles.itemTitle}>Notifications</Text>
										<Text style={styles.itemSubtitle}>
											Configure alerts and updates
										</Text>
									</View>
									<Ionicons
										color={colors.textSecondary}
										name="chevron-forward"
										size={metrics.icon.md}
									/>
								</Pressable>
							</View>
						</View>

						<View>
							<Text style={styles.sectionTitle}>SUPPORT</Text>
							<View style={styles.listCard}>
								<Pressable
									onPress={openHelp}
									style={({ pressed }) => [
										styles.itemRow,
										pressed && { backgroundColor: colors.surfaceMuted },
									]}
								>
									<View style={styles.itemIcon}>
										<Ionicons
											color={colors.primary}
											name="help-circle-outline"
											size={metrics.icon.md}
										/>
									</View>
									<View style={styles.itemBody}>
										<Text style={styles.itemTitle}>Help & Support</Text>
										<Text style={styles.itemSubtitle}>
											Account help and data requests
										</Text>
									</View>
									<Ionicons
										color={colors.textSecondary}
										name="open-outline"
										size={metrics.icon.md}
									/>
								</Pressable>
								<View style={styles.divider} />
								<Pressable
									onPress={openPrivacy}
									style={({ pressed }) => [
										styles.itemRow,
										pressed && { backgroundColor: colors.surfaceMuted },
									]}
								>
									<View style={styles.itemIcon}>
										<Ionicons
											color={colors.primary}
											name="shield-outline"
											size={metrics.icon.md}
										/>
									</View>
									<View style={styles.itemBody}>
										<Text style={styles.itemTitle}>Privacy</Text>
										<Text style={styles.itemSubtitle}>
											Read our privacy policy
										</Text>
									</View>
									<Ionicons
										color={colors.textSecondary}
										name="open-outline"
										size={metrics.icon.md}
									/>
								</Pressable>
							</View>
						</View>

						<Pressable
							onPress={() => void handleSignOut()}
							style={styles.signOutButton}
						>
							<Ionicons
								color={colors.textInverse}
								name="log-out-outline"
								size={metrics.icon.md}
							/>
							<Text style={styles.signOutText}>Sign Out</Text>
						</Pressable>
					</ScrollView>
				</SafeAreaView>
			</View>
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0

			<Modal
				visible={isEditorOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setIsEditorOpen(false)}
			>
				<View style={styles.editorBackdrop}>
					<View style={styles.editorCard}>
<<<<<<< HEAD
						<View style={styles.header}>
=======
						<View style={styles.editorHeader}>
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
							<Text style={styles.title}>Edit Profile</Text>
							<Pressable onPress={() => setIsEditorOpen(false)}>
								<Ionicons color={colors.textPrimary} name="close" size={22} />
							</Pressable>
						</View>

						<ScrollView showsVerticalScrollIndicator={false}>
							<View style={styles.imageRow}>
								<View style={styles.imageCard}>
									<Text style={styles.label}>PROFILE PHOTO</Text>
									<Image
										source={{ uri: draft.profileImageUrl }}
										style={styles.imagePreview}
									/>
									<Pressable
										onPress={() => void pickImage("profile")}
										style={styles.pickButton}
									>
										<Text style={styles.pickButtonText}>Change</Text>
									</Pressable>
								</View>
								<View style={styles.imageCard}>
									<Text style={styles.label}>BANNER PHOTO</Text>
									<Image
										source={{ uri: draft.bannerImageUrl }}
										style={styles.imagePreview}
									/>
									<Pressable
										onPress={() => void pickImage("banner")}
										style={styles.pickButton}
									>
										<Text style={styles.pickButtonText}>Change</Text>
									</Pressable>
								</View>
							</View>

							<View style={styles.fieldWrap}>
								<Text style={styles.label}>NAME</Text>
								<TextInput
									value={draft.name}
									onChangeText={(name) =>
										setDraft((prev) => (prev ? { ...prev, name } : prev))
									}
									style={styles.input}
								/>
							</View>

							<View style={styles.fieldWrap}>
								<Text style={styles.label}>USERNAME</Text>
								<TextInput
									value={draft.username}
									autoCapitalize="none"
									onChangeText={(username) =>
										setDraft((prev) => (prev ? { ...prev, username } : prev))
									}
									style={styles.input}
								/>
							</View>

							<View style={styles.fieldWrap}>
								<Text style={styles.label}>BIO</Text>
								<TextInput
									value={draft.bio}
									multiline
									onChangeText={(bio) =>
										setDraft((prev) => (prev ? { ...prev, bio } : prev))
									}
									style={[styles.input, styles.textarea]}
								/>
							</View>

							<View style={styles.fieldWrap}>
								<Text style={styles.label}>MOBILE</Text>
								<TextInput
									value={draft.mobileNumber}
									onChangeText={(mobileNumber) =>
										setDraft((prev) =>
											prev ? { ...prev, mobileNumber } : prev,
										)
									}
									style={styles.input}
								/>
							</View>

							<View style={styles.fieldWrap}>
								<Text style={styles.label}>LICENSE</Text>
								<TextInput
									value={draft.driverLicenseNumber}
									onChangeText={(driverLicenseNumber) =>
										setDraft((prev) =>
											prev ? { ...prev, driverLicenseNumber } : prev,
										)
									}
									style={styles.input}
								/>
							</View>

							<Pressable
								onPress={() => void saveProfile()}
								disabled={saving}
								style={styles.saveButton}
							>
								{saving ? (
									<ActivityIndicator color={colors.textInverse} size="small" />
								) : (
									<Text style={styles.saveButtonText}>Save</Text>
								)}
							</Pressable>
						</ScrollView>
					</View>
				</View>
			</Modal>
		</>
	);
}
