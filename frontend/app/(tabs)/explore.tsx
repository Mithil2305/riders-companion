import React from "react"
import {
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
import { CommentsSheet } from "../../src/components/comments"
import { FeedPost } from "../../src/components/feed/FeedPost"
import { ShareSheet } from "../../src/components/share"
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
		refreshing,
		searchResults,
		isSearchLoading,
		hasMoreClips,
		isLoadingMore,
		loadMoreClips,
		onRefresh,
	} = useExploreData()
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("explore")
	const [detailVisible, setDetailVisible] = React.useState(false)
	const [selectedPostId, setSelectedPostId] = React.useState<string | null>(
		null,
	)
	const [searchFocused, setSearchFocused] = React.useState(false)
	const [selectedActionPostId, setSelectedActionPostId] = React.useState<
		string | null
	>(null)
	const [isCommentSheetVisible, setIsCommentSheetVisible] = React.useState(false)
	const [isShareSheetVisible, setIsShareSheetVisible] = React.useState(false)
	const [likedPostIds, setLikedPostIds] = React.useState<Record<string, boolean>>(
		{},
	)
	const [likeCountByPostId, setLikeCountByPostId] = React.useState<
		Record<string, number>
	>({})
	const [commentCountByPostId, setCommentCountByPostId] = React.useState<
		Record<string, number>
	>({})

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
		(
			clip: TrendingClip,
			overrides?: {
				likedByMe?: boolean
				likes?: number
				comments?: number
			},
		): FeedPostItem => ({
			id: clip.id,
			user: `@${clip.creatorUsername}`,
			avatar: clip.thumbnail,
			image: clip.thumbnail,
			mediaType: String(
				clip.mediaType ?? (clip.type === "clip" ? "VIDEO" : "IMAGE"),
			).toUpperCase(),
			caption: clip.title,
			likes: overrides?.likes ?? clip.likes,
			comments: overrides?.comments ?? clip.comments,
			time: formatTimeAgo(clip.createdAt),
			likedByMe: overrides?.likedByMe ?? clip.likedByMe,
		}),
		[],
	)

	const normalizePostId = React.useCallback(
		(postId: string) => postId.replace(/^post-/, ""),
		[],
	)

	const openCommentSheet = React.useCallback((postId: string) => {
		setSelectedActionPostId(postId)
		setIsCommentSheetVisible(true)
	}, [])

	const openShareSheet = React.useCallback((postId: string) => {
		setSelectedActionPostId(postId)
		setIsShareSheetVisible(true)
	}, [])

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

	const handleTogglePostLike = React.useCallback(
		async (postId: string) => {
			const post = allPosts.find((item) => item.id === postId)
			if (!post) {
				return
			}

			const currentLiked = likedPostIds[postId] ?? Boolean(post.likedByMe)
			const currentLikeCount = likeCountByPostId[postId] ?? post.likes
			const nextLiked = !currentLiked
			const nextLikeCount = Math.max(
				0,
				currentLikeCount + (nextLiked ? 1 : -1),
			)

			setLikedPostIds((prev) => ({
				...prev,
				[postId]: nextLiked,
			}))
			setLikeCountByPostId((prev) => ({
				...prev,
				[postId]: nextLikeCount,
			}))

			try {
				const normalizedPostId = normalizePostId(postId)
				if (nextLiked) {
					await FeedService.likePost(normalizedPostId)
				} else {
					await FeedService.unlikePost(normalizedPostId)
				}
			} catch {
				setLikedPostIds((prev) => ({
					...prev,
					[postId]: currentLiked,
				}))
				setLikeCountByPostId((prev) => ({
					...prev,
					[postId]: currentLikeCount,
				}))
			}
		},
		[allPosts, likeCountByPostId, likedPostIds, normalizePostId],
	)

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
		({ item, index }: { item: TrendingClip; index: number }) => {
			const liked = likedPostIds[item.id] ?? Boolean(item.likedByMe)
			const likeCount = likeCountByPostId[item.id] ?? item.likes
			const commentCount = commentCountByPostId[item.id] ?? item.comments

			return (
				<FeedPost
					item={mapExplorePostToFeedPost(item, {
						likedByMe: liked,
						likes: likeCount,
						comments: commentCount,
					})}
					index={index}
					liked={liked}
					onToggleLike={(postId) => {
						void handleTogglePostLike(postId)
					}}
					onAddComment={openCommentSheet}
					onShare={openShareSheet}
					scrollY={detailScrollY}
				/>
			)
		},
		[
			commentCountByPostId,
			detailScrollY,
			handleTogglePostLike,
			likeCountByPostId,
			likedPostIds,
			mapExplorePostToFeedPost,
			openCommentSheet,
			openShareSheet,
		],
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

				{searchResults.length > 0 ? (
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
						refreshing={refreshing}
						onRefresh={onRefresh}
						onEndReached={loadMoreClips}
						hasMore={hasMoreClips}
						isLoadingMore={isLoadingMore}
						onSelectClip={openClipDetail}
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

			<CommentsSheet
				contentId={
					selectedActionPostId ? normalizePostId(selectedActionPostId) : null
				}
				contentType="feed"
				visible={isCommentSheetVisible}
				onClose={() => setIsCommentSheetVisible(false)}
				onCommentsCountChange={(newCount) => {
					if (selectedActionPostId) {
						setCommentCountByPostId((prev) => ({
							...prev,
							[selectedActionPostId]: newCount,
						}))
					}
				}}
			/>

			<ShareSheet
				postId={selectedActionPostId ? normalizePostId(selectedActionPostId) : null}
				resourceType="post"
				visible={isShareSheetVisible}
				onClose={() => setIsShareSheetVisible(false)}
			/>
		</SafeAreaView>
	)
}
