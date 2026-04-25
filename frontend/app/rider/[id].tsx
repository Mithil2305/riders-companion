import React from "react";
import {
	ActivityIndicator,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ClipService, { ClipPayload } from "../../src/services/ClipService";
import { ClipThumbnail } from "../../src/components/clips/ClipThumbnail";
import FeedService, { FeedPostPayload } from "../../src/services/FeedService";
import ProfileService from "../../src/services/ProfileService";
import TrackerService from "../../src/services/TrackerService";
import { useTheme } from "../../src/hooks/useTheme";

type RiderProfile = {
	id: string;
	name: string;
	username: string;
	bio: string | null;
	profileImageUrl: string | null;
	totalMiles: number;
	followersCount: number;
	followingCount: number;
	isFollowing: boolean;
	isMe: boolean;
};

type GarageBike = {
	id: string;
	brand: string;
	model: string;
	year: number;
	bikeImageUrl: string | null;
	isPrimary: boolean;
};

type PublicSection = "moments" | "clips" | "garage";

type PublicClipItem = Pick<ClipPayload, "id" | "videoUrl"> & {
	sourcePostId?: string;
};

const FALLBACK_PROFILE: RiderProfile = {
	id: "",
	name: "Rider",
	username: "rider",
	bio: null,
	profileImageUrl: null,
	totalMiles: 0,
	followersCount: 0,
	followingCount: 0,
	isFollowing: false,
	isMe: false,
};

const ACHIEVEMENT_TIERS = [
	{ icon: "medal-outline", label: "Bronze", thresholdKm: 10000 },
	{ icon: "ribbon-outline", label: "Silver", thresholdKm: 14000 },
	{ icon: "trophy-outline", label: "Gold", thresholdKm: 19000 },
	{ icon: "diamond-outline", label: "Crystal", thresholdKm: 25000 },
	{ icon: "shield-checkmark-outline", label: "Elite", thresholdKm: 30000 },
] as const;

function toBadgeProgress(totalKm: number) {
	const current =
		[...ACHIEVEMENT_TIERS]
			.reverse()
			.find((tier) => totalKm >= tier.thresholdKm) ?? null;
	const next = ACHIEVEMENT_TIERS.find((tier) => totalKm < tier.thresholdKm) ?? null;

	return {
		current,
		next,
		remainingKm: next ? Math.max(0, next.thresholdKm - totalKm) : 0,
	};
}

function AchievementsButton({ onPress }: { onPress: () => void }) {
	const { colors, metrics, typography } = useTheme();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				button: {
					minHeight: 46,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "row",
					gap: metrics.sm,
					paddingHorizontal: metrics.lg,
					alignSelf: "center",
					backgroundColor: colors.primary,
				},
				text: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<Pressable onPress={onPress} style={styles.button}>
			<Ionicons color={colors.textInverse} name="trophy-outline" size={18} />
			<Text style={styles.text}>Achievements</Text>
		</Pressable>
	);
}

function ProfileActionButton({
	label,
	icon,
	onPress,
	variant = "secondary",
	disabled = false,
	loading = false,
}: {
	label: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	onPress: () => void;
	variant?: "primary" | "secondary";
	disabled?: boolean;
	loading?: boolean;
}) {
	const { colors, metrics, typography } = useTheme();
	const isPrimary = variant === "primary";

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				button: {
					flex: 1,
					minHeight: 46,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "row",
					gap: metrics.xs,
					paddingHorizontal: metrics.sm,
					backgroundColor: isPrimary ? colors.primary : colors.card,
					borderWidth: 1,
					borderColor: isPrimary ? colors.primary : colors.border,
					opacity: disabled ? 0.6 : 1,
				},
				text: {
					color: isPrimary ? colors.textInverse : colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
			}),
		[colors, disabled, isPrimary, metrics, typography],
	);

	return (
		<Pressable disabled={disabled} onPress={onPress} style={styles.button}>
			{loading ? (
				<ActivityIndicator
					color={isPrimary ? colors.textInverse : colors.primary}
					size="small"
				/>
			) : (
				<>
					<Ionicons
						color={isPrimary ? colors.textInverse : colors.textPrimary}
						name={icon}
						size={16}
					/>
					<Text numberOfLines={1} style={styles.text}>
						{label}
					</Text>
				</>
			)}
		</Pressable>
	);
}

function AchievementsModal({
	visible,
	onClose,
	totalKm,
}: {
	visible: boolean;
	onClose: () => void;
	totalKm: number;
}) {
	const { colors, metrics, typography } = useTheme();
	const progress = React.useMemo(() => toBadgeProgress(totalKm), [totalKm]);
	const maxKm = ACHIEVEMENT_TIERS[ACHIEVEMENT_TIERS.length - 1].thresholdKm;
	const overallPercent = Math.max(0, Math.min(1, totalKm / maxKm));

	const tierRows = React.useMemo(() => {
		return ACHIEVEMENT_TIERS.map((tier, index) => {
			const previous =
				index === 0 ? 0 : ACHIEVEMENT_TIERS[index - 1].thresholdKm;
			const range = Math.max(1, tier.thresholdKm - previous);
			const fill = Math.max(0, Math.min(1, (totalKm - previous) / range));

			return {
				...tier,
				fill,
				done: totalKm >= tier.thresholdKm,
			};
		});
	}, [totalKm]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				backdrop: {
					flex: 1,
					backgroundColor: colors.overlay,
					justifyContent: "center",
					paddingHorizontal: metrics.lg,
				},
				card: {
					borderRadius: metrics.radius.xl,
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.border,
					padding: metrics.lg,
					gap: metrics.sm,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
				},
				overallTrack: {
					height: 10,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.surface,
					overflow: "hidden",
					marginTop: metrics.xs,
				},
				overallFill: {
					height: "100%",
					backgroundColor: colors.primary,
				},
				listItem: {
					flexDirection: "row",
					alignItems: "center",
					paddingVertical: metrics.xs + 2,
					gap: metrics.sm,
				},
				rowMiddle: {
					flex: 1,
					gap: 4,
				},
				badgeName: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
				tierTrack: {
					height: 8,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.surface,
					overflow: "hidden",
				},
				tierFill: {
					height: "100%",
					backgroundColor: colors.primary,
				},
				badgeMeta: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
				},
				closeButton: {
					marginTop: metrics.sm,
					minHeight: 46,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.primary,
				},
				closeText: {
					color: colors.textInverse,
					fontWeight: "700",
					fontSize: typography.sizes.sm,
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<Modal
			animationType="fade"
			onRequestClose={onClose}
			transparent
			visible={visible}
		>
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.title}>Achievements</Text>
					<Text style={styles.subtitle}>
						{progress.current
							? `${progress.current.label} tier unlocked`
							: "Start riding to unlock the first tier"}
					</Text>
					<View style={styles.overallTrack}>
						<View
							style={[
								styles.overallFill,
								{ width: `${overallPercent * 100}%` },
							]}
						/>
					</View>
					<Text style={styles.subtitle}>
						{Math.round(totalKm).toLocaleString()} km
						{progress.next
							? ` - ${progress.remainingKm.toLocaleString()} km to ${progress.next.label}`
							: " - Max tier reached"}
					</Text>

					{tierRows.map((tier) => (
						<View key={tier.label} style={styles.listItem}>
							<Ionicons
								color={tier.done ? colors.primary : colors.textSecondary}
								name={tier.icon}
								size={20}
							/>
							<View style={styles.rowMiddle}>
								<Text style={styles.badgeName}>{tier.label}</Text>
								<View style={styles.tierTrack}>
									<View
										style={[styles.tierFill, { width: `${tier.fill * 100}%` }]}
									/>
								</View>
							</View>
							<Text style={styles.badgeMeta}>
								{tier.done ? "Done" : `${tier.thresholdKm.toLocaleString()} km`}
							</Text>
						</View>
					))}

					<Pressable onPress={onClose} style={styles.closeButton}>
						<Text style={styles.closeText}>Close</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}

export default function RiderProfileScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams();
	const riderId = typeof params.id === "string" ? params.id : "";
	const [profile, setProfile] = React.useState<RiderProfile>(FALLBACK_PROFILE);
	const [moments, setMoments] = React.useState<FeedPostPayload[]>([]);
	const [clips, setClips] = React.useState<PublicClipItem[]>([]);
	const [garage, setGarage] = React.useState<GarageBike[]>([]);
	const [activeSection, setActiveSection] =
		React.useState<PublicSection>("moments");
	const [isLoading, setIsLoading] = React.useState(true);
	const [isFollowBusy, setIsFollowBusy] = React.useState(false);
	const [showAchievements, setShowAchievements] = React.useState(false);

	React.useEffect(() => {
		let active = true;

		if (!riderId) {
			setIsLoading(false);
			return () => {
				active = false;
			};
		}

		const loadProfile = async () => {
			try {
				const [profileResponse, feedResponse, clipsResponse] =
					await Promise.all([
						ProfileService.getRiderProfile(riderId),
						FeedService.getFeed(),
						ClipService.getClips(),
					]);

				if (!active) {
					return;
				}

				const nextProfile: RiderProfile = {
					id: profileResponse.profile.id,
					name: profileResponse.profile.name,
					username: profileResponse.profile.username,
					bio: profileResponse.profile.bio,
					profileImageUrl: profileResponse.profile.profileImageUrl,
					totalMiles: Number(profileResponse.profile.totalMiles ?? 0),
					followersCount: Number(profileResponse.profile.followersCount ?? 0),
					followingCount: Number(profileResponse.profile.followingCount ?? 0),
					isFollowing: Boolean(profileResponse.profile.isFollowing),
					isMe: Boolean(profileResponse.profile.isMe),
				};

				setProfile(nextProfile);
				const riderPosts = feedResponse.posts.filter(
					(post) => post.rider?.id === nextProfile.id && post.mediaUrl,
				);
				const riderMoments = riderPosts.filter(
					(post) => post.mediaType !== "VIDEO",
				);
				const legacyVideoClips = riderPosts
					.filter((post) => post.mediaType === "VIDEO" && post.mediaUrl)
					.map((post) => ({
						id: `post-${post.id}`,
						videoUrl: post.mediaUrl ?? "",
						sourcePostId: post.id,
					}));
				const riderClips = clipsResponse.clips
					.filter((clip) => clip.rider?.id === nextProfile.id && clip.videoUrl)
					.map((clip) => ({
						id: clip.id,
						videoUrl: clip.videoUrl,
					}));

				setMoments(riderMoments);
				setClips([...riderClips, ...legacyVideoClips]);
				setGarage(profileResponse.bikes ?? []);
			} catch {
				if (active) {
					setProfile({ ...FALLBACK_PROFILE, id: riderId });
					setMoments([]);
					setClips([]);
					setGarage([]);
				}
			} finally {
				if (active) {
					setIsLoading(false);
				}
			}
		};

		void loadProfile();

		return () => {
			active = false;
		};
	}, [riderId]);

	const avatarUri =
		profile.profileImageUrl && profile.profileImageUrl.trim().length > 0
			? profile.profileImageUrl
			: `https://ui-avatars.com/api/?name=${encodeURIComponent(
					profile.name || "Rider",
				)}&background=212121&color=FFFFFF`;

	const achievementRows = React.useMemo(() => {
		return ACHIEVEMENT_TIERS.map((tier, index) => {
			const previous =
				index === 0 ? 0 : ACHIEVEMENT_TIERS[index - 1].thresholdKm;
			const range = Math.max(1, tier.thresholdKm - previous);
			const progress = Math.max(
				0,
				Math.min(1, (profile.totalMiles - previous) / range),
			);

			return {
				...tier,
				progress,
				done: profile.totalMiles >= tier.thresholdKm,
			};
		});
	}, [profile.totalMiles]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				headerRow: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
					paddingBottom: metrics.sm,
				},
				backTap: {
					width: 36,
					height: 36,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
					marginLeft: metrics.sm,
				},
				scrollContent: {
					paddingBottom: metrics["3xl"],
				},
				cover: {
					width: "100%",
					height: 150,
					backgroundColor: colors.surface,
				},
				avatar: {
					width: 104,
					height: 104,
					borderRadius: 52,
					borderWidth: 4,
					borderColor: colors.textInverse,
					alignSelf: "center",
					marginTop: -52,
					backgroundColor: colors.surface,
				},
				content: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
				},
				identityBlock: {
					alignItems: "center",
					gap: metrics.xs,
				},
				name: {
					color: colors.textPrimary,
					fontSize: typography.sizes.xl,
					fontWeight: "700",
					textAlign: "center",
				},
				username: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					fontWeight: "500",
					textAlign: "center",
				},
				bio: {
					marginTop: metrics.xs,
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
					lineHeight: typography.sizes.lg * 1.35,
				},
				statsRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					marginTop: metrics.lg,
				},
				stat: {
					flex: 1,
					alignItems: "center",
				},
				statValue: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				statLabel: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					marginTop: 2,
				},
				actionRow: {
					marginTop: metrics.lg,
					flexDirection: "row",
					gap: metrics.sm,
				},
				actionHalf: {
					flex: 1,
				},
				actionFullRow: {
					marginTop: metrics.sm,
				},
				achievementCard: {
					display: "none",
				},
				achievementSummary: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				achievementRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
					paddingVertical: metrics.xs,
				},
				achievementBody: {
					flex: 1,
					gap: 5,
				},
				achievementName: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				progressTrack: {
					height: 8,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.surface,
					overflow: "hidden",
				},
				progressFill: {
					height: "100%",
					backgroundColor: colors.primary,
				},
				achievementMeta: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					minWidth: 78,
					textAlign: "right",
				},
				tabsWrap: {
					marginTop: metrics.xl,
					borderBottomWidth: 1,
					borderBottomColor: colors.borderDark,
				},
				tabsRow: {
					flexDirection: "row",
				},
				tabButton: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: metrics.md,
					borderBottomWidth: 3,
					borderBottomColor: "transparent",
				},
				tabButtonActive: {
					borderBottomColor: colors.primary,
				},
				section: {
					marginTop: metrics.lg,
				},
				grid: {
					flexDirection: "row",
					flexWrap: "wrap",
					marginHorizontal: -1,
				},
				tileWrap: {
					width: "33.3333%",
					padding: 1,
				},
				tile: {
					width: "100%",
					aspectRatio: 1,
					backgroundColor: colors.surface,
					overflow: "hidden",
				},
				tileImage: {
					width: "100%",
					height: "100%",
				},
				videoPill: {
					position: "absolute",
					top: 6,
					right: 6,
					paddingHorizontal: 6,
					paddingVertical: 2,
					backgroundColor: colors.overlay,
				},
				videoPillText: {
					color: colors.textInverse,
					fontSize: 10,
					fontWeight: "700",
				},
				emptyText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
					paddingVertical: metrics.xl,
				},
				garageList: {
					gap: metrics.md,
				},
				garageCard: {
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					padding: metrics.md,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.md,
				},
				garageImage: {
					width: 78,
					height: 78,
					borderRadius: metrics.radius.md,
					backgroundColor: colors.surface,
				},
				garageInfo: {
					flex: 1,
					gap: 4,
				},
				garageTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				garageMeta: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
				},
				loading: {
					marginTop: metrics.lg,
					color: colors.textTertiary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
					textAlign: "center",
				},
			}),
		[colors, metrics, typography],
	);

	const toggleFollow = React.useCallback(async () => {
		if (!profile.id || profile.isMe || isFollowBusy) {
			return;
		}

		const nextFollowing = !profile.isFollowing;
		setIsFollowBusy(true);
		setProfile((prev) => ({
			...prev,
			isFollowing: nextFollowing,
			followersCount: nextFollowing
				? prev.followersCount + 1
				: Math.max(0, prev.followersCount - 1),
		}));

		try {
			if (nextFollowing) {
				await TrackerService.followRider(profile.id);
			} else {
				await TrackerService.unfollowRider(profile.id);
			}
		} catch {
			setProfile((prev) => ({
				...prev,
				isFollowing: !nextFollowing,
				followersCount: nextFollowing
					? Math.max(0, prev.followersCount - 1)
					: prev.followersCount + 1,
			}));
		} finally {
			setIsFollowBusy(false);
		}
	}, [isFollowBusy, profile.id, profile.isFollowing, profile.isMe]);

	const openMessage = React.useCallback(() => {
		if (!profile.id || profile.isMe) {
			return;
		}

		router.push({
			pathname: "/chats",
			params: {
				autoOpen: "1",
				riderId: profile.id,
				name: profile.name || "Rider",
				avatar: avatarUri,
				username: profile.username || "rider",
			},
		});
	}, [avatarUri, profile.id, profile.isMe, profile.name, profile.username, router]);

	const renderSection = () => {
		if (activeSection === "moments") {
			if (moments.length === 0) {
				return <Text style={styles.emptyText}>No moments yet.</Text>;
			}

			return (
				<View style={styles.grid}>
					{moments.map((post) => (
						<View key={post.id} style={styles.tileWrap}>
							<Pressable
								onPress={() => router.push(`/post/${post.id}`)}
								style={styles.tile}
							>
								<Image
									source={{ uri: post.mediaUrl || avatarUri }}
									style={styles.tileImage}
								/>
								{post.mediaType === "VIDEO" ? (
									<View style={styles.videoPill}>
										<Text style={styles.videoPillText}>VIDEO</Text>
									</View>
								) : null}
							</Pressable>
						</View>
					))}
				</View>
			);
		}

		if (activeSection === "clips") {
			if (clips.length === 0) {
				return <Text style={styles.emptyText}>No clips yet.</Text>;
			}

			return (
				<View style={styles.grid}>
					{clips.map((clip) => (
						<View key={clip.id} style={styles.tileWrap}>
							<Pressable
								onPress={() =>
									router.push({
										pathname: "/(tabs)/clips",
										params: { clipId: clip.id },
									})
								}
								style={styles.tile}
							>
								<ClipThumbnail
									style={styles.tileImage}
									uri={clip.videoUrl}
								/>
								<View style={styles.videoPill}>
									<Text style={styles.videoPillText}>CLIP</Text>
								</View>
							</Pressable>
						</View>
					))}
				</View>
			);
		}

		if (garage.length === 0) {
			return <Text style={styles.emptyText}>No garage bikes yet.</Text>;
		}

		return (
			<View style={styles.garageList}>
				{garage.map((bike) => (
					<View key={bike.id} style={styles.garageCard}>
						<Image
							source={{
								uri:
									bike.bikeImageUrl ||
									`https://ui-avatars.com/api/?name=${encodeURIComponent(
										`${bike.brand} ${bike.model}`,
									)}&background=212121&color=FFFFFF`,
							}}
							style={styles.garageImage}
						/>
						<View style={styles.garageInfo}>
							<Text style={styles.garageTitle}>
								{bike.brand} {bike.model}
							</Text>
							<Text style={styles.garageMeta}>
								{bike.year}
								{bike.isPrimary ? " • Primary" : ""}
							</Text>
						</View>
					</View>
				))}
			</View>
		);
	};

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<View style={styles.headerRow}>
				<Pressable onPress={() => router.back()} style={styles.backTap}>
					<Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
				</Pressable>
				<Text style={styles.title}>Rider Profile</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<Image source={{ uri: avatarUri }} style={styles.cover} />
				<Image source={{ uri: avatarUri }} style={styles.avatar} />

				<View style={styles.content}>
					<View style={styles.identityBlock}>
						<Text numberOfLines={1} style={styles.name}>
							{profile.name}
						</Text>
						<Text numberOfLines={1} style={styles.username}>
							@{profile.username || "rider"}
						</Text>
						<Text style={styles.bio}>{profile.bio || "No bio added yet."}</Text>
					</View>

					<View style={styles.statsRow}>
						<View style={styles.stat}>
							<Text style={styles.statValue}>{moments.length}</Text>
							<Text style={styles.statLabel}>Moments</Text>
						</View>
						<View style={styles.stat}>
							<Text style={styles.statValue}>{clips.length}</Text>
							<Text style={styles.statLabel}>Clips</Text>
						</View>
						<View style={styles.stat}>
							<Text style={styles.statValue}>{garage.length}</Text>
							<Text style={styles.statLabel}>Garage</Text>
						</View>
						<View style={styles.stat}>
							<Text style={styles.statValue}>{profile.followersCount}</Text>
							<Text style={styles.statLabel}>Trackers</Text>
						</View>
						<View style={styles.stat}>
							<Text style={styles.statValue}>{profile.followingCount}</Text>
							<Text style={styles.statLabel}>Tracking</Text>
						</View>
					</View>

					{!profile.isMe ? (
						<>
							<View style={styles.actionRow}>
								<View style={styles.actionHalf}>
									<ProfileActionButton
										disabled={isFollowBusy || isLoading}
										icon={profile.isFollowing ? "person-remove-outline" : "person-add-outline"}
										label={profile.isFollowing ? "Unfollow" : "Follow"}
										loading={isFollowBusy}
										onPress={() => void toggleFollow()}
										variant={profile.isFollowing ? "secondary" : "primary"}
									/>
								</View>
								<View style={styles.actionHalf}>
									<ProfileActionButton
										disabled={isLoading || !profile.id}
										icon="chatbubble-ellipses-outline"
										label="Message"
										onPress={openMessage}
									/>
								</View>
							</View>
							<View style={styles.actionFullRow}>
								<ProfileActionButton
									disabled={isLoading}
									icon="trophy-outline"
									label="Achievements"
									onPress={() => setShowAchievements(true)}
								/>
							</View>
						</>
					) : null}

					<View style={styles.achievementCard}>
						<Text style={styles.achievementSummary}>
							Achievements • {Math.round(profile.totalMiles).toLocaleString()} km
						</Text>
						{achievementRows.map((tier) => (
							<View key={tier.label} style={styles.achievementRow}>
								<View style={styles.achievementBody}>
									<Text style={styles.achievementName}>{tier.label}</Text>
									<View style={styles.progressTrack}>
										<View
											style={[
												styles.progressFill,
												{ width: `${tier.progress * 100}%` },
											]}
										/>
									</View>
								</View>
								<Text style={styles.achievementMeta}>
									{tier.done ? "Done" : `${tier.thresholdKm.toLocaleString()} km`}
								</Text>
							</View>
						))}
					</View>

					<View style={{ display: "none" }}>
						<AchievementsButton onPress={() => setShowAchievements(true)} />
					</View>

					<View style={styles.tabsWrap}>
						<View style={styles.tabsRow}>
							{(["moments", "clips", "garage"] as PublicSection[]).map(
								(section) => {
									const active = activeSection === section;
									const icon =
										section === "moments"
											? "grid-outline"
											: section === "clips"
												? "videocam-outline"
												: "car-outline";

									return (
										<Pressable
											key={section}
											accessibilityLabel={
												section === "moments"
													? "Moments"
													: section === "clips"
														? "Clips"
														: "Garage"
											}
											onPress={() => setActiveSection(section)}
											style={[
												styles.tabButton,
												active ? styles.tabButtonActive : null,
											]}
										>
											<Ionicons
												color={active ? colors.primary : colors.textSecondary}
												name={icon}
												size={metrics.icon.md}
											/>
										</Pressable>
									);
								},
							)}
						</View>
					</View>

					<View style={styles.section}>
						{isLoading ? (
							<Text style={styles.loading}>Loading rider details...</Text>
						) : (
							renderSection()
						)}
					</View>
				</View>
			</ScrollView>

			<AchievementsModal
				onClose={() => setShowAchievements(false)}
				totalKm={profile.totalMiles}
				visible={showAchievements}
			/>
		</SafeAreaView>
	);
}
