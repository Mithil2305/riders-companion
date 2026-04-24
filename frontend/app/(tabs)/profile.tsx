import React from "react";
import {
	Alert,
	Image,
	Modal,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import Animated, {
	FadeIn,
	FadeInDown,
	FadeInRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { EmptyState, SkeletonBlock } from "../../src/components/common";
import { useProfileDashboardData } from "../../src/hooks/useProfileDashboardData";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import FeedService, { FeedPostPayload } from "../../src/services/FeedService";
import { useTheme } from "../../src/hooks/useTheme";

type ProfileSection = "moments" | "garage";

type AchievementTier = {
	emoji: string;
	label: string;
	thresholdKm: number;
};

const ACHIEVEMENT_TIERS: AchievementTier[] = [
	{ emoji: "🥉", label: "Bronze", thresholdKm: 10000 },
	{ emoji: "🥈", label: "Silver", thresholdKm: 14000 },
	{ emoji: "🥇", label: "Gold", thresholdKm: 19000 },
	{ emoji: "💎", label: "Crystal", thresholdKm: 25000 },
	{ emoji: "👑", label: "Elite", thresholdKm: 30000 },
];

const sectionMap: Record<
	ProfileSection,
	{ label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }
> = {
	moments: { label: "Moments", icon: "grid-outline" },
	garage: { label: "Garage", icon: "car-outline" },
};

function toBadgeProgress(totalKm: number) {
	const tiers = ACHIEVEMENT_TIERS;
	const current =
		[...tiers].reverse().find((tier) => totalKm >= tier.thresholdKm) ?? null;
	const next = tiers.find((tier) => totalKm < tier.thresholdKm) ?? null;

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
					minHeight: metrics.button.md.height,
					borderRadius: 26,
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "row",
					gap: metrics.sm,
					paddingHorizontal: metrics.md,
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
			<Text style={styles.text}>🏆 Achievements</Text>
		</Pressable>
	);
}

function MomentsGrid({
	posts,
	onPressPost,
}: {
	posts: FeedPostPayload[];
	onPressPost: (postId: string) => void;
}) {
	const { colors, metrics } = useTheme();
	const [loadedState, setLoadedState] = React.useState<Record<string, boolean>>(
		{},
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				wrap: {
					flexDirection: "row",
					flexWrap: "wrap",
					marginTop: metrics.sm,
					marginHorizontal: -1,
				},
				tileWrap: {
					width: "33.3333%",
					padding: 1,
				},
				tile: {
					width: "100%",
					aspectRatio: 1,
					borderRadius: 0,
					overflow: "hidden",
					backgroundColor: colors.surface,
				},
				image: {
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
				placeholder: {
					...StyleSheet.absoluteFillObject,
					backgroundColor: colors.surface,
				},
			}),
		[colors, metrics],
	);

	return (
		<View style={styles.wrap}>
			{posts.map((post, index) => {
				const uri = post.mediaUrl || "";
				const key = `${post.id}-${index}`;

				return (
					<View key={key} style={styles.tileWrap}>
						<Pressable onPress={() => onPressPost(post.id)} style={styles.tile}>
							<Image
								onLoadEnd={() =>
									setLoadedState((prev) => ({ ...prev, [key]: true }))
								}
								source={{ uri }}
								style={styles.image}
							/>
							{post.mediaType === "VIDEO" ? (
								<View style={styles.videoPill}>
									<Text style={styles.videoPillText}>VIDEO</Text>
								</View>
							) : null}
							{!loadedState[key] && (
								<Animated.View
									entering={FadeIn.duration(180)}
									style={styles.placeholder}
								/>
							)}
						</Pressable>
					</View>
				);
			})}
		</View>
	);
}

function GarageList({
	bikes,
}: {
	bikes: { id: string; image: string; model: string }[];
}) {
	const { colors, metrics, typography } = useTheme();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				list: {
					gap: metrics.md,
					marginTop: metrics.sm,
				},
				card: {
					borderRadius: 14,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					padding: metrics.md,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.md,
				},
				image: {
					width: 76,
					height: 76,
					borderRadius: 12,
					backgroundColor: colors.surface,
				},
				content: {
					flex: 1,
					gap: metrics.xs,
				},
				model: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<View style={styles.list}>
			{bikes.map((bike) => (
				<View key={bike.id} style={styles.card}>
					<Image source={{ uri: bike.image }} style={styles.image} />
					<View style={styles.content}>
						<Text style={styles.model}>{bike.model}</Text>
					</View>
				</View>
			))}
		</View>
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
			const prev = index === 0 ? 0 : ACHIEVEMENT_TIERS[index - 1].thresholdKm;
			const range = Math.max(1, tier.thresholdKm - prev);
			const fill = Math.max(0, Math.min(1, (totalKm - prev) / range));

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
					backgroundColor: "rgba(0,0,0,0.45)",
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
				emoji: {
					fontSize: typography.sizes.base + 4,
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
					minHeight: metrics.button.md.height,
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
							? `${progress.current.emoji} ${progress.current.label}`
							: "🏁 Start riding"}
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
							? ` • ${progress.remainingKm.toLocaleString()} km to ${progress.next.emoji}`
							: " • Max tier reached"}
					</Text>

					{tierRows.map((tier) => (
						<View key={tier.label} style={styles.listItem}>
							<Text style={styles.emoji}>{tier.emoji}</Text>
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

function PostVideo({ uri }: { uri: string }) {
	const player = useVideoPlayer(uri, (instance) => {
		instance.loop = true;
		instance.play();
	});

	return (
		<VideoView
			contentFit="contain"
			nativeControls
			player={player}
			style={{ width: "100%", height: 320 }}
		/>
	);
}

function PostDetailModal({
	visible,
	post,
	onClose,
	onCreate,
	onDelete,
	onSaveCaption,
	busy,
}: {
	visible: boolean;
	post: FeedPostPayload | null;
	onClose: () => void;
	onCreate: () => void;
	onDelete: (postId: string) => void;
	onSaveCaption: (postId: string, caption: string) => Promise<void>;
	busy: boolean;
}) {
	const { colors, metrics, typography } = useTheme();
	const [isEditing, setIsEditing] = React.useState(false);
	const [captionDraft, setCaptionDraft] = React.useState("");

	React.useEffect(() => {
		if (post) {
			setCaptionDraft(post.caption ?? "");
		}
		setIsEditing(false);
	}, [post]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				backdrop: {
					flex: 1,
					backgroundColor: "rgba(0,0,0,0.62)",
					justifyContent: "center",
					paddingHorizontal: metrics.md,
				},
				card: {
					borderRadius: metrics.radius.lg,
					backgroundColor: colors.card,
					overflow: "hidden",
				},
				mediaWrap: {
					width: "100%",
					height: 320,
					backgroundColor: colors.surface,
				},
				image: {
					width: "100%",
					height: "100%",
				},
				content: {
					padding: metrics.md,
					gap: metrics.sm,
				},
				caption: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
				},
				input: {
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: metrics.radius.md,
					paddingHorizontal: metrics.sm,
					paddingVertical: metrics.sm,
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					minHeight: 78,
					textAlignVertical: "top",
				},
				actionsRow: {
					flexDirection: "row",
					gap: metrics.sm,
					flexWrap: "wrap",
				},
				actionBtn: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.xs + 4,
					borderRadius: metrics.radius.full,
					borderWidth: 1,
					borderColor: colors.border,
				},
				actionBtnPrimary: {
					backgroundColor: colors.primary,
					borderColor: colors.primary,
				},
				actionBtnDanger: {
					backgroundColor: "#c62828",
					borderColor: "#c62828",
				},
				actionText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
				actionTextPrimary: {
					color: colors.textInverse,
				},
			}),
		[colors, metrics, typography],
	);

	if (!post) {
		return null;
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<View style={styles.mediaWrap}>
						{post.mediaType === "VIDEO" ? (
							<PostVideo uri={post.mediaUrl || ""} />
						) : (
							<Image
								source={{ uri: post.mediaUrl || "" }}
								style={styles.image}
							/>
						)}
					</View>
					<View style={styles.content}>
						{isEditing ? (
							<TextInput
								multiline
								placeholder="Edit description"
								placeholderTextColor={colors.textSecondary}
								style={styles.input}
								value={captionDraft}
								onChangeText={setCaptionDraft}
							/>
						) : (
							<Text style={styles.caption}>
								{post.caption || "No description"}
							</Text>
						)}

						<View style={styles.actionsRow}>
							<Pressable
								onPress={onCreate}
								style={[styles.actionBtn, styles.actionBtnPrimary]}
							>
								<Text style={[styles.actionText, styles.actionTextPrimary]}>
									Create
								</Text>
							</Pressable>

							{isEditing ? (
								<Pressable
									disabled={busy}
									onPress={() => void onSaveCaption(post.id, captionDraft)}
									style={[styles.actionBtn, styles.actionBtnPrimary]}
								>
									<Text style={[styles.actionText, styles.actionTextPrimary]}>
										{busy ? "Saving" : "Save"}
									</Text>
								</Pressable>
							) : (
								<Pressable
									onPress={() => setIsEditing(true)}
									style={styles.actionBtn}
								>
									<Text style={styles.actionText}>Edit Description</Text>
								</Pressable>
							)}

							<Pressable
								disabled={busy}
								onPress={() => onDelete(post.id)}
								style={[styles.actionBtn, styles.actionBtnDanger]}
							>
								<Text style={[styles.actionText, styles.actionTextPrimary]}>
									Delete
								</Text>
							</Pressable>

							<Pressable onPress={onClose} style={styles.actionBtn}>
								<Text style={styles.actionText}>Close</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</View>
		</Modal>
	);
}

export default function ProfileScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("profile");
	const {
		loading,
		user,
		bikes,
		moments,
		momentsCount,
		trackersCount,
		trackingCount,
		reloadDashboard,
	} = useProfileDashboardData();

	const [activeSection, setActiveSection] =
		React.useState<ProfileSection>("moments");
	const [showAchievements, setShowAchievements] = React.useState(false);
	const [refreshing, setRefreshing] = React.useState(false);
	const [selectedPostId, setSelectedPostId] = React.useState<string | null>(
		null,
	);
	const [isPostActionBusy, setIsPostActionBusy] = React.useState(false);

	const selectedPost = React.useMemo(
		() => moments.find((post) => post.id === selectedPostId) ?? null,
		[moments, selectedPostId],
	);

	const stats = React.useMemo(
		() => [
			{ key: "moments", label: "Moments", value: momentsCount },
			{ key: "trackers", label: "Trackers", value: trackersCount },
			{ key: "tracking", label: "Tracking", value: trackingCount },
		],
		[momentsCount, trackersCount, trackingCount],
	);

	const handleStatPress = React.useCallback(
		(statKey: string) => {
			if (statKey === "trackers") {
				router.push("/tracking?tab=trackers");
				return;
			}

			if (statKey === "tracking") {
				router.push("/tracking?tab=tracking");
			}
		},
		[router],
	);

	const openPostPage = React.useCallback(
		(postId: string) => {
			router.push(`/post/${postId}`);
		},
		[router],
	);

	const handleSavePostCaption = React.useCallback(
		async (postId: string, caption: string) => {
			setIsPostActionBusy(true);
			try {
				await FeedService.updatePost(postId, { caption });
				await reloadDashboard();
			} catch (error) {
				Alert.alert(
					"Update failed",
					error instanceof Error
						? error.message
						: "Unable to update description.",
				);
			} finally {
				setIsPostActionBusy(false);
			}
		},
		[reloadDashboard],
	);

	const handleDeletePost = React.useCallback(
		(postId: string) => {
			Alert.alert("Delete post", "This will permanently remove this post.", [
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setIsPostActionBusy(true);
						try {
							await FeedService.deletePost(postId);
							setSelectedPostId(null);
							await reloadDashboard();
						} catch (error) {
							Alert.alert(
								"Delete failed",
								error instanceof Error
									? error.message
									: "Unable to delete this post.",
							);
						} finally {
							setIsPostActionBusy(false);
						}
					},
				},
			]);
		},
		[reloadDashboard],
	);

	const onRefresh = React.useCallback(async () => {
		setRefreshing(true);
		try {
			await reloadDashboard();
		} finally {
			setRefreshing(false);
		}
	}, [reloadDashboard]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.md,
					backgroundColor: colors.background,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottomWidth: 1,
					borderBottomColor: colors.borderDark,
				},
				headerLeft: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				headerTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				settingsButton: {
					width: 36,
					height: 36,
					borderRadius: 18,
					alignItems: "center",
					justifyContent: "center",
				},
				scrollContent: {
					paddingBottom: metrics["3xl"],
				},
				coverImage: {
					width: "100%",
					height: 160,
				},
				avatar: {
					width: 102,
					height: 102,
					borderRadius: 51,
					borderWidth: 4,
					borderColor: colors.textInverse,
					alignSelf: "center",
					marginTop: -51,
					backgroundColor: colors.surface,
				},
				content: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
				},
				identityBlock: {
					alignItems: "center",
					gap: metrics.sm,
				},
				name: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
					textAlign: "center",
					marginTop: metrics.md,
				},
				username: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					textAlign: "center",
				},
				bio: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
					lineHeight: typography.sizes.lg * 1.45,
					maxWidth: "88%",
				},
				statsRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					marginTop: metrics.xl,
				},
				statItem: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					minHeight: 56,
					borderRadius: metrics.radius.md,
				},
				statItemPressed: {
					backgroundColor: colors.surface,
				},
				statValue: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				statLabel: {
					marginTop: metrics.xs,
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
				tabsWrap: {
					marginTop: metrics.xl,
					borderBottomWidth: 1,
					borderBottomColor: colors.borderDark,
				},
				tabsRow: {
					flexDirection: "row",
					justifyContent: "space-between",
				},
				tabButton: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: metrics.sm,
					gap: metrics.xs,
					flexDirection: "row",
					borderBottomWidth: 3,
					borderBottomColor: "transparent",
				},
				tabButtonActive: {
					borderBottomColor: colors.primary,
				},
				tabText: {
					fontSize: typography.sizes.sm,
					fontWeight: "500",
					color: colors.textSecondary,
				},
				tabTextActive: {
					color: colors.primary,
					fontWeight: "700",
				},
				sectionContent: {
					marginTop: metrics.lg,
				},
				garageEmpty: {
					borderWidth: 1,
					borderStyle: "dashed",
					borderColor: colors.border,
					borderRadius: metrics.radius.lg,
					paddingVertical: metrics.xl,
					alignItems: "center",
					justifyContent: "center",
					gap: metrics.sm,
				},
				garageEmptyText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
				skeletonCover: {
					width: "100%",
					height: 205,
				},
				skeletonAvatar: {
					width: 104,
					height: 104,
					borderRadius: metrics.radius.full,
					alignSelf: "center",
					marginTop: -52,
				},
				skeletonLine: {
					height: 16,
					borderRadius: metrics.radius.md,
					marginTop: metrics.sm,
				},
			}),
		[colors, metrics, typography],
	);

	if (loading) {
		return (
			<Animated.View
				style={[styles.container, swipeAnimatedStyle]}
				{...swipeHandlers}
			>
				<SafeAreaView edges={["left", "right", "top"]} style={styles.container}>
					<View style={styles.header}>
						<SkeletonBlock
							style={{
								width: 150,
								height: 28,
								borderRadius: metrics.radius.md,
							}}
						/>
						<SkeletonBlock
							style={{
								width: 36,
								height: 36,
								borderRadius: metrics.radius.full,
							}}
						/>
					</View>
					<ScrollView
						contentContainerStyle={styles.scrollContent}
						refreshControl={
							<RefreshControl
								colors={[colors.primary]}
								onRefresh={onRefresh}
								progressBackgroundColor={colors.surface}
								refreshing={refreshing}
								tintColor={colors.primary}
							/>
						}
						style={styles.container}
					>
						<SkeletonBlock style={styles.skeletonCover} />
						<SkeletonBlock style={styles.skeletonAvatar} />
						<View style={styles.content}>
							<SkeletonBlock
								style={[
									styles.skeletonLine,
									{ width: "48%", alignSelf: "center" },
								]}
							/>
							<SkeletonBlock
								style={[
									styles.skeletonLine,
									{ width: "36%", alignSelf: "center" },
								]}
							/>
							<SkeletonBlock
								style={[
									styles.skeletonLine,
									{ width: "72%", alignSelf: "center" },
								]}
							/>
							<SkeletonBlock
								style={{
									height: 44,
									width: "68%",
									alignSelf: "center",
									borderRadius: 24,
								}}
							/>
							<SkeletonBlock
								style={{
									height: 92,
									borderRadius: metrics.radius.xl,
									marginTop: metrics.xl,
								}}
							/>
						</View>
					</ScrollView>
				</SafeAreaView>
			</Animated.View>
		);
	}

	return (
		<Animated.View
			style={[styles.container, swipeAnimatedStyle]}
			{...swipeHandlers}
		>
			<SafeAreaView edges={["left", "right", "top"]} style={styles.container}>
				<View style={styles.header}>
					<View style={styles.headerLeft}>
						<Ionicons
							color={colors.primary}
							name="person-circle-outline"
							size={metrics.icon.md + 4}
						/>
						<Text style={styles.headerTitle}>Profile</Text>
					</View>
					<Pressable
						onPress={() => router.push("/settings")}
						style={styles.settingsButton}
					>
						<Ionicons
							color={colors.textPrimary}
							name="settings-outline"
							size={metrics.icon.md + 2}
						/>
					</Pressable>
				</View>

				<ScrollView
					contentContainerStyle={styles.scrollContent}
					refreshControl={
						<RefreshControl
							colors={[colors.primary]}
							onRefresh={onRefresh}
							progressBackgroundColor={colors.surface}
							refreshing={refreshing}
							tintColor={colors.primary}
						/>
					}
					style={styles.container}
				>
					<Image source={{ uri: user.coverImage }} style={styles.coverImage} />
					<Image source={{ uri: user.avatar }} style={styles.avatar} />

					<View style={styles.content}>
						<View style={styles.identityBlock}>
							<Text style={styles.name}>{user.name}</Text>
							<Text style={styles.username}>@{user.username}</Text>
							<Text style={styles.bio}>{user.bio || "No bio added yet."}</Text>
						</View>

						<View style={{ marginTop: metrics.lg }}>
							<AchievementsButton onPress={() => setShowAchievements(true)} />
						</View>

						<View style={styles.statsRow}>
							{stats.map((item) => (
								<Pressable
									key={item.key}
									disabled={item.key === "moments"}
									onPress={() => handleStatPress(item.key)}
									style={({ pressed }) => [
										styles.statItem,
										pressed && item.key !== "moments" && styles.statItemPressed,
									]}
								>
									<Text style={styles.statValue}>{item.value}</Text>
									<Text style={styles.statLabel}>{item.label}</Text>
								</Pressable>
							))}
						</View>

						<View style={styles.tabsWrap}>
							<View style={styles.tabsRow}>
								{(Object.keys(sectionMap) as ProfileSection[]).map(
									(sectionKey) => (
										<Pressable
											key={sectionKey}
											onPress={() => setActiveSection(sectionKey)}
											style={[
												styles.tabButton,
												activeSection === sectionKey && styles.tabButtonActive,
											]}
										>
											<Ionicons
												color={
													activeSection === sectionKey
														? colors.primary
														: colors.textSecondary
												}
												name={sectionMap[sectionKey].icon}
												size={metrics.icon.md}
											/>
											<Text
												style={[
													styles.tabText,
													activeSection === sectionKey && styles.tabTextActive,
												]}
											>
												{sectionMap[sectionKey].label}
											</Text>
										</Pressable>
									),
								)}
							</View>
						</View>

						<Animated.View
							entering={FadeInDown.duration(220)}
							style={styles.sectionContent}
						>
							{activeSection === "moments" ? (
								moments.length === 0 ? (
									<EmptyState
										icon="images-outline"
										subtitle="Start sharing rides to fill your moments."
										title="No moments yet"
									/>
								) : (
									<Animated.View entering={FadeInRight.duration(240)}>
										<MomentsGrid onPressPost={openPostPage} posts={moments} />
									</Animated.View>
								)
							) : bikes.length === 0 ? (
								<Pressable
									onPress={() => router.push("/setup/profile")}
									style={styles.garageEmpty}
								>
									<Ionicons
										color={colors.primary}
										name="add-circle"
										size={metrics.icon.xl + 12}
									/>
									<Text style={styles.garageEmptyText}>Add bike</Text>
								</Pressable>
							) : (
								<Animated.View entering={FadeInRight.duration(240)}>
									<GarageList
										bikes={bikes.map((bike) => ({
											id: bike.id,
											image: bike.image,
											model: `${bike.brand} ${bike.model} (${bike.year})`,
										}))}
									/>
								</Animated.View>
							)}
						</Animated.View>
					</View>
				</ScrollView>

				<AchievementsModal
					onClose={() => setShowAchievements(false)}
					totalKm={Number(user.miles || 0)}
					visible={showAchievements}
				/>

				<PostDetailModal
					busy={isPostActionBusy}
					onClose={() => setSelectedPostId(null)}
					onCreate={() => router.push("/create")}
					onDelete={handleDeletePost}
					onSaveCaption={handleSavePostCaption}
					post={selectedPost}
					visible={selectedPost != null}
				/>
			</SafeAreaView>
		</Animated.View>
	);
}
