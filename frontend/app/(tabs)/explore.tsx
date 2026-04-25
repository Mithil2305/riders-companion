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
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ExploreGrid, SearchBar, ExploreSkeleton } from "../../src/components/explore";
import ClipService from "../../src/services/ClipService";
import ProfileService from "../../src/services/ProfileService";
import { useExploreData } from "../../src/hooks/useExploreData";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import { TrendingClip } from "../../src/types/explore";

export default function ExploreScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const {
		query,
		setQuery,
		clips,
		gridSections,
		hasMoreClips,
		isLoadingMore,
		refreshing,
		loadMoreClips,
		onRefresh,
	} = useExploreData();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("explore");
	const [detailVisible, setDetailVisible] = React.useState(false);
	const [selectedClipId, setSelectedClipId] = React.useState<string | null>(
		null,
	);
	const [suggestedUsers, setSuggestedUsers] = React.useState<any[]>([]);

	React.useEffect(() => {
		if (!query.trim()) {
			setSuggestedUsers([]);
			return;
		}

		const delayDebounceFn = setTimeout(() => {
			void ProfileService.searchRiders(query.trim())
				.then((res) => {
					setSuggestedUsers(res.users ?? []);
				})
				.catch(() => {
					setSuggestedUsers([]);
				});
		}, 300);

		return () => clearTimeout(delayDebounceFn);
	}, [query]);

	const selectedIndex = React.useMemo(
		() => clips.findIndex((clip) => clip.id === selectedClipId),
		[clips, selectedClipId],
	);

	const relatedClips = React.useMemo(() => {
		if (selectedIndex < 0) {
			return clips;
		}

		const current = clips[selectedIndex];
		const rest = clips.filter((clip) => clip.id !== current.id);
		return [current, ...rest];
	}, [clips, selectedIndex]);

	const openClipDetail = React.useCallback((clip: TrendingClip) => {
		setSelectedClipId(clip.id);
		setDetailVisible(true);
	}, []);

	const handleClipLongPress = React.useCallback(async (clip: TrendingClip) => {
		Alert.alert("Post actions", "Choose an action for this post.", [
			{
				text: "Like",
				onPress: async () => {
					try {
						if (clip.likedByMe) {
							await ClipService.unlikeClip(clip.id);
						} else {
							await ClipService.likeClip(clip.id);
						}
					} catch {
						Alert.alert("Action failed", "Unable to update like right now.");
					}
				},
			},
			{
				text: "Share to friends",
				onPress: () => {
					Alert.alert(
						"Shared",
						"This post was shared to your platform friends feed.",
					);
				},
			},
			{
				text: "Cancel",
				style: "cancel",
			},
		]);
	}, []);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				searchWrap: {
					paddingHorizontal: metrics.md,
					paddingBottom: metrics.sm,
					zIndex: 10,
				},
				suggestionDropdown: {
					position: "absolute",
					top: 60,
					left: metrics.md,
					right: metrics.md,
					backgroundColor: colors.card,
					borderRadius: metrics.radius.md,
					borderWidth: 1,
					borderColor: colors.borderDark,
					maxHeight: 250,
					zIndex: 20,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.1,
					shadowRadius: 10,
					elevation: 5,
				},
				suggestionItem: {
					flexDirection: "row",
					alignItems: "center",
					padding: metrics.md,
					borderBottomWidth: 1,
					borderBottomColor: colors.borderDark,
					gap: metrics.sm,
				},
				suggestionAvatar: {
					width: 40,
					height: 40,
					borderRadius: 20,
					backgroundColor: colors.surface,
				},
				suggestionName: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "600",
				},
				suggestionUsername: {
					color: colors.textTertiary,
					fontSize: typography.sizes.sm,
				},
				detailBackdrop: {
					flex: 1,
					backgroundColor: colors.background,
					paddingTop: metrics.md,
				},
				detailHeader: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: metrics.md,
					paddingBottom: metrics.sm,
				},
				detailTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				detailList: {
					paddingHorizontal: metrics.md,
					gap: metrics.lg,
					paddingBottom: metrics["3xl"],
				},
				detailCard: {
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					padding: metrics.md,
					gap: metrics.sm,
				},
				media: {
					width: "100%",
					aspectRatio: 1,
					borderRadius: metrics.radius.md,
					backgroundColor: colors.surface,
				},
				creator: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				caption: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					lineHeight: typography.sizes.sm * 1.45,
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<Animated.View
			style={[styles.container, swipeAnimatedStyle]}
			{...swipeHandlers}
		>
			<SafeAreaView edges={["left", "right", "top"]} style={styles.container}>
				<View style={styles.searchWrap}>
					<SearchBar onChangeText={setQuery} value={query} />
					{query.trim().length > 0 && suggestedUsers.length > 0 && (
						<ScrollView style={styles.suggestionDropdown} keyboardShouldPersistTaps="handled">
							{suggestedUsers.map((u) => (
								<Pressable key={u.id} style={styles.suggestionItem} onPress={() => {
									setQuery("");
									setSuggestedUsers([]);
									router.push(`/rider/${u.id}`);
								}}>
									<Image source={{ uri: u.profileImageUrl || "https://i.pravatar.cc/100" }} style={styles.suggestionAvatar} />
									<View>
										<Text style={styles.suggestionName}>{u.name}</Text>
										<Text style={styles.suggestionUsername}>@{u.username}</Text>
									</View>
								</Pressable>
							))}
						</ScrollView>
					)}
				</View>
				{clips.length === 0 && !refreshing ? (
					<ExploreSkeleton />
				) : (
					<ExploreGrid
						sections={gridSections}
						hasMore={hasMoreClips}
						isLoadingMore={isLoadingMore}
						refreshing={refreshing}
						onLongPressClip={handleClipLongPress}
						onSelectClip={openClipDetail}
						onEndReached={loadMoreClips}
						onRefresh={onRefresh}
					/>
				)}

				<Modal
					animationType="slide"
					onRequestClose={() => setDetailVisible(false)}
					visible={detailVisible}
				>
					<SafeAreaView style={styles.detailBackdrop}>
						<View style={styles.detailHeader}>
							<Text style={styles.detailTitle}>Post</Text>
							<Pressable onPress={() => setDetailVisible(false)}>
								<Ionicons
									color={colors.textPrimary}
									name="close"
									size={metrics.icon.md}
								/>
							</Pressable>
						</View>

						<ScrollView
							contentContainerStyle={styles.detailList}
							refreshControl={
								<RefreshControl
									colors={[colors.primary]}
									onRefresh={onRefresh}
									progressBackgroundColor={colors.surface}
									refreshing={refreshing}
									tintColor={colors.primary}
								/>
							}
						>
							{relatedClips.map((clip) => (
								<View key={clip.id} style={styles.detailCard}>
									<Image
										source={{ uri: clip.thumbnail }}
										style={styles.media}
									/>
									<Text style={styles.creator}>@{clip.creatorUsername}</Text>
									<Text style={styles.caption}>{clip.title}</Text>
								</View>
							))}
						</ScrollView>
					</SafeAreaView>
				</Modal>
			</SafeAreaView>
		</Animated.View>
	);
}
