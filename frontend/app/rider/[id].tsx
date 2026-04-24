import React from "react";
import {
	ActivityIndicator,
	Image,
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
	{ label: "Bronze", thresholdKm: 10000 },
	{ label: "Silver", thresholdKm: 14000 },
	{ label: "Gold", thresholdKm: 19000 },
	{ label: "Crystal", thresholdKm: 25000 },
	{ label: "Elite", thresholdKm: 30000 },
];

export default function RiderProfileScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams();
	const riderId = typeof params.id === "string" ? params.id : "";
	const [profile, setProfile] = React.useState<RiderProfile>(FALLBACK_PROFILE);
	const [moments, setMoments] = React.useState<FeedPostPayload[]>([]);
	const [clips, setClips] = React.useState<ClipPayload[]>([]);
	const [garage, setGarage] = React.useState<GarageBike[]>([]);
	const [activeSection, setActiveSection] =
		React.useState<PublicSection>("moments");
	const [isLoading, setIsLoading] = React.useState(true);
	const [isFollowBusy, setIsFollowBusy] = React.useState(false);

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
				setMoments(
					feedResponse.posts.filter(
						(post) => post.rider?.id === nextProfile.id && post.mediaUrl,
					),
				);
				setClips(
					clipsResponse.clips.filter(
						(clip) => clip.rider?.id === nextProfile.id && clip.videoUrl,
					),
				);
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
				)}&background=0D8ABC&color=fff`;

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
				achievementCard: {
					marginTop: metrics.lg,
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					padding: metrics.md,
					gap: metrics.sm,
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
				followButton: {
					marginTop: metrics.lg,
					minHeight: 46,
					minWidth: 154,
					borderRadius: metrics.radius.full,
					alignSelf: "center",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: profile.isFollowing ? colors.surface : colors.primary,
					borderWidth: 1,
					borderColor: profile.isFollowing ? colors.border : colors.primary,
				},
				followText: {
					color: profile.isFollowing ? colors.textPrimary : colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
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
					backgroundColor: "rgba(0,0,0,0.58)",
				},
				videoPillText: {
					color: "#fff",
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
		[colors, metrics, profile.isFollowing, typography],
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
							<View style={styles.tile}>
								<Image
									source={{ uri: clip.videoUrl || avatarUri }}
									style={styles.tileImage}
								/>
								<View style={styles.videoPill}>
									<Text style={styles.videoPillText}>CLIP</Text>
								</View>
							</View>
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
									)}&background=111827&color=fff`,
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
						<Pressable
							disabled={isFollowBusy || isLoading}
							onPress={() => void toggleFollow()}
							style={styles.followButton}
						>
							{isFollowBusy ? (
								<ActivityIndicator color={colors.primary} size="small" />
							) : (
								<Text style={styles.followText}>
									{profile.isFollowing ? "Unfollow" : "Follow"}
								</Text>
							)}
						</Pressable>
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
		</SafeAreaView>
	);
}
