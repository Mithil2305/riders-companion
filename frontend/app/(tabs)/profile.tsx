import React from "react";
import {
	Image,
	Modal,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { EmptyState, SkeletonBlock } from "../../src/components/common";
import { useProfileDashboardData } from "../../src/hooks/useProfileDashboardData";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import { FeedPostPayload } from "../../src/services/FeedService";

type ProfileSection = "moments" | "garage";

type AchievementTier = {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	label: string;
	thresholdKm: number;
};

const ACHIEVEMENT_TIERS: AchievementTier[] = [
	{ icon: "medal-outline", label: "Bronze", thresholdKm: 10000 },
	{ icon: "ribbon-outline", label: "Silver", thresholdKm: 14000 },
	{ icon: "trophy-outline", label: "Gold", thresholdKm: 19000 },
	{ icon: "diamond-outline", label: "Crystal", thresholdKm: 25000 },
	{ icon: "shield-checkmark-outline", label: "Elite", thresholdKm: 30000 },
];

const sectionMap: Record<
	ProfileSection,
	{ icon: React.ComponentProps<typeof Ionicons>["name"] }
> = {
	moments: { icon: "grid-outline" },
	garage: { icon: "car-outline" },
};

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

function MomentsGrid({
	posts,
	onPressPost,
}: {
	posts: FeedPostPayload[];
	onPressPost: (postId: string) => void;
}) {
	const { colors } = useTheme();
	const [loadedState, setLoadedState] = React.useState<Record<string, boolean>>(
		{},
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				wrap: {
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
		[colors],
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
							{!loadedState[key] ? (
								<Animated.View
									entering={FadeIn.duration(180)}
									style={styles.placeholder}
								/>
							) : null}
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
				},
				card: {
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					padding: metrics.md,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.md,
				},
				image: {
					width: 78,
					height: 78,
					borderRadius: metrics.radius.md,
					backgroundColor: colors.surface,
				},
				content: {
					flex: 1,
					gap: 4,
				},
				model: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
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
					paddingTop: metrics.md,
					paddingBottom: metrics.sm,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				headerTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				settingsButton: {
					width: 36,
					height: 36,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
				},
				scrollContent: {
					paddingBottom: metrics["3xl"],
				},
				coverImage: {
					width: "100%",
					height: 150,
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
				achievementButtonWrap: {
					marginTop: metrics.lg,
				},
				statsRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					marginTop: metrics.lg,
				},
				statItem: {
					flex: 1,
					alignItems: "center",
					minHeight: 52,
					borderRadius: metrics.radius.md,
					justifyContent: "center",
				},
				statItemPressed: {
					backgroundColor: colors.surface,
				},
				statValue: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				statLabel: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "500",
					marginTop: 2,
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
								style={[styles.skeletonLine, { width: "48%", alignSelf: "center" }]}
							/>
							<SkeletonBlock
								style={[styles.skeletonLine, { width: "36%", alignSelf: "center" }]}
							/>
							<SkeletonBlock
								style={[styles.skeletonLine, { width: "72%", alignSelf: "center" }]}
							/>
							<SkeletonBlock
								style={{
									height: 44,
									width: "52%",
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
					<Text style={styles.headerTitle}>Profile</Text>
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

						<View style={styles.achievementButtonWrap}>
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
								{(Object.keys(sectionMap) as ProfileSection[]).map((sectionKey) => (
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
									</Pressable>
								))}
							</View>
						</View>

						<Animated.View entering={FadeInDown.duration(220)} style={styles.section}>
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
			</SafeAreaView>
		</Animated.View>
	);
}
