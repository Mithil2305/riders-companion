import React from "react"
import {
	Alert,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import Animated, { useSharedValue } from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { ExploreGrid, SearchBar, SearchSuggestions } from "../../src/components/explore"
import { ExploreSkeleton } from "../../src/components/explore/ExploreSkeleton"
import { FeedPost } from "../../src/components/feed/FeedPost"
import ClipService from "../../src/services/ClipService"
import FeedService from "../../src/services/FeedService"
import { useExploreData } from "../../src/hooks/useExploreData"
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation"
import { useTheme } from "../../src/hooks/useTheme"
import { FeedPostItem } from "../../src/types/feed"
import { TrendingClip } from "../../src/types/explore"
import { formatTimeAgo } from "../../src/utils/formatters"

export default function ExploreScreen() {
	const { colors, metrics, typography } = useTheme()
	const router = useRouter()
	const detailScrollY = useSharedValue(0)
	const {
		query,
		setQuery,
		clips,
		clipAspects,
		isInitialLoading,
		searchResults,
		isSearchLoading,
		hasMoreClips,
		isLoadingMore,
		loadMoreClips,
	} = useExploreData()
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("explore")
	const [detailVisible, setDetailVisible] = React.useState(false)
	const [selectedPostId, setSelectedPostId] = React.useState<string | null>(
		null,
	)
	const [searchFocused, setSearchFocused] = React.useState(false)

	const allPosts = React.useMemo(
		() => clips.filter((clip) => clip.type === "post"),
		[clips],
	)

	const selectedIndex = React.useMemo(
		() => allPosts.findIndex((clip) => clip.id === selectedPostId),
		[allPosts, selectedPostId],
	)

	const relatedPosts = React.useMemo(() => {
		if (selectedIndex < 0) {
			return allPosts
		}

		const current = allPosts[selectedIndex]
		const rest = allPosts.filter((clip) => clip.id !== current.id)
		return [current, ...rest]
	}, [allPosts, selectedIndex])

	const mapExplorePostToFeedPost = React.useCallback(
		(clip: TrendingClip): FeedPostItem => ({
			id: clip.id,
			user: `@${clip.creatorUsername}`,
			avatar: clip.thumbnail,
			image: clip.thumbnail,
			mediaType: String(
				clip.mediaType ?? (clip.type === "clip" ? "VIDEO" : "IMAGE"),
			).toUpperCase(),
			caption: clip.title,
			likes: clip.likes,
			comments: clip.comments,
			time: formatTimeAgo(clip.createdAt),
			likedByMe: clip.likedByMe,
		}),
		[],
	)

	const openClipDetail = React.useCallback(
		(clip: TrendingClip) => {
			if (clip.type === "clip") {
				const clipId = clip.id.replace(/^clip-/, "")
				setDetailVisible(false)
				router.push({ pathname: "/(tabs)/clips", params: { clipId } })
				return
			}

			setSelectedPostId(clip.id)
			setDetailVisible(true)
		},
		[router],
	)

	const handleClipLongPress = React.useCallback(async (clip: TrendingClip) => {
		const realId = clip.id.replace(/^(post-|clip-)/, "")
		Alert.alert("Post actions", "Choose an action for this post.", [
			{
				text: "Like",
				onPress: async () => {
					try {
						if (clip.likedByMe) {
							if (clip.type === "post") {
								await FeedService.unlikePost(realId)
							} else {
								await ClipService.unlikeClip(realId)
							}
						} else {
							if (clip.type === "post") {
								await FeedService.likePost(realId)
							} else {
								await ClipService.likeClip(realId)
							}
						}
					} catch {
						Alert.alert("Action failed", "Unable to update like right now.")
					}
				},
			},
			{
				text: "Share to friends",
				onPress: () => {
					Alert.alert(
						"Shared",
						"This post was shared to your platform friends feed.",
					)
				},
			},
			{
				text: "Cancel",
				style: "cancel",
			},
		])
	}, [])

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
				suggestionsWrap: {
					flex: 1,
					backgroundColor: colors.background,
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
					paddingTop: metrics.sm,
					paddingBottom: metrics["3xl"],
				},
				detailSeparator: {
					height: metrics.sm,
				},
				emptyTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
					textAlign: "center",
					paddingTop: metrics.xl,
				},
				emptyHint: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
					paddingTop: metrics.xs,
				},
			}),
		[colors, metrics, typography],
	)

	const showSuggestions = query.length > 0 || searchFocused
	const shouldShowSkeleton = !showSuggestions && isInitialLoading

	const renderDetailPost = React.useCallback(
		({ item, index }: { item: TrendingClip; index: number }) => (
			<FeedPost
				item={mapExplorePostToFeedPost(item)}
				index={index}
				liked={Boolean(item.likedByMe)}
				onToggleLike={() => {
					void handleClipLongPress(item)
				}}
				onAddComment={() => {
					Alert.alert("Comments", "Comments are available in feed and clips tabs.")
				}}
				onShare={() => {
					Alert.alert("Shared", "Post shared to your friends.")
				}}
				scrollY={detailScrollY}
			/>
		),
		[detailScrollY, handleClipLongPress, mapExplorePostToFeedPost],
	)

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<Animated.View style={[styles.container, swipeAnimatedStyle]} {...swipeHandlers}>
				<View style={styles.searchWrap}>
					<SearchBar
						value={query}
						onChangeText={setQuery}
						onFocus={() => setSearchFocused(true)}
						onBlur={() => {
							setTimeout(() => setSearchFocused(false), 150)
						}}
					/>
				</View>

				{showSuggestions ? (
					<View style={styles.suggestionsWrap}>
						<SearchSuggestions
							results={searchResults}
							isLoading={isSearchLoading}
							query={query}
							onClose={() => {
								setSearchFocused(false)
							}}
						/>
					</View>
				) : shouldShowSkeleton ? (
					<ExploreSkeleton />
				) : (
					<ExploreGrid
						clips={clips}
						clipAspects={clipAspects}
						onEndReached={loadMoreClips}
						hasMore={hasMoreClips}
						isLoadingMore={isLoadingMore}
						onSelectClip={openClipDetail}
						onLongPressClip={handleClipLongPress}
					/>
				)}
			</Animated.View>

			<Modal
				animationType="slide"
				onRequestClose={() => setDetailVisible(false)}
				visible={detailVisible}
			>
				<View style={styles.detailBackdrop}>
					<Pressable
						style={styles.detailHeader}
						onPress={() => setDetailVisible(false)}
					>
						<Ionicons
							name="chevron-back"
							size={28}
							color={colors.textPrimary}
						/>
						<Text style={styles.detailTitle}>Post</Text>
						<View style={{ width: 28 }} />
					</Pressable>

					<FlatList
						contentContainerStyle={styles.detailList}
						data={relatedPosts}
						keyExtractor={(item) => item.id}
						ListEmptyComponent={
							<View>
								<Text style={styles.emptyTitle}>No posts available</Text>
								<Text style={styles.emptyHint}>
									Explore more content to discover posts.
								</Text>
							</View>
						}
						onScroll={(event) => {
							detailScrollY.value = event.nativeEvent.contentOffset.y
						}}
						renderItem={renderDetailPost}
						scrollEventThrottle={16}
						showsVerticalScrollIndicator={false}
						ItemSeparatorComponent={() => <View style={styles.detailSeparator} />}
					/>
				</View>
			</Modal>
		</SafeAreaView>
	)
}
