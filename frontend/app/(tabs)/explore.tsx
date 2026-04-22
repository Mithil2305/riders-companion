import React from "react";
import {
	Alert,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommentsSheet } from "../../src/components/comments";
import { ExploreGrid, SearchBar } from "../../src/components/explore";
import { ShareSheet } from "../../src/components/share";
import ClipService from "../../src/services/ClipService";
import { useExploreData } from "../../src/hooks/useExploreData";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import { TrendingClip } from "../../src/types/explore";

export default function ExploreScreen() {
	const { colors, metrics, typography } = useTheme();
	const {
		query,
		setQuery,
		clips,
		gridSections,
		hasMoreClips,
		isLoadingMore,
		loadMoreClips,
	} = useExploreData();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("explore");
	const [detailVisible, setDetailVisible] = React.useState(false);
	const [selectedClipId, setSelectedClipId] = React.useState<string | null>(
		null,
	);
	const [activeCommentsClipId, setActiveCommentsClipId] = React.useState<
		string | null
	>(null);
	const [activeShareClipId, setActiveShareClipId] = React.useState<string | null>(
		null,
	);

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
				detailActions: {
					marginTop: metrics.xs,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.md,
				},
				actionButton: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.xs,
				},
				actionText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
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
					<SearchBar query={query} setQuery={setQuery} />
				</View>
				<ExploreGrid
					sections={gridSections}
					hasMore={hasMoreClips}
					isLoadingMore={isLoadingMore}
					onLongPressClip={handleClipLongPress}
					onSelectClip={openClipDetail}
					onEndReached={loadMoreClips}
				/>

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

						<ScrollView contentContainerStyle={styles.detailList}>
							{relatedClips.map((clip) => (
								<View key={clip.id} style={styles.detailCard}>
									<Image
										source={{ uri: clip.thumbnail }}
										style={styles.media}
									/>
									<Text style={styles.creator}>@{clip.creatorUsername}</Text>
									<Text style={styles.caption}>{clip.title}</Text>
									<View style={styles.detailActions}>
										<Pressable
											onPress={() => setActiveCommentsClipId(clip.id)}
											style={styles.actionButton}
										>
											<Ionicons
												color={colors.textPrimary}
												name="chatbubble-outline"
												size={metrics.icon.sm}
											/>
											<Text style={styles.actionText}>{clip.comments}</Text>
										</Pressable>

										<Pressable
											onPress={() => setActiveShareClipId(clip.id)}
											style={styles.actionButton}
										>
											<Ionicons
												color={colors.textPrimary}
												name="paper-plane-outline"
												size={metrics.icon.sm}
											/>
											<Text style={styles.actionText}>{clip.shares}</Text>
										</Pressable>
									</View>
								</View>
							))}
						</ScrollView>
					</SafeAreaView>
				</Modal>

				{activeCommentsClipId ? (
					<CommentsSheet
						contentType="clip"
						onClose={() => setActiveCommentsClipId(null)}
						postId={activeCommentsClipId}
						visible={Boolean(activeCommentsClipId)}
					/>
				) : null}

				{activeShareClipId ? (
					<ShareSheet
						onClose={() => setActiveShareClipId(null)}
						postId={activeShareClipId}
						visible={Boolean(activeShareClipId)}
					/>
				) : null}
			</SafeAreaView>
		</Animated.View>
	);
}
