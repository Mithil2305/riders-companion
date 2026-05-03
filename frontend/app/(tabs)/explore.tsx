<<<<<<< HEAD
import React from "react";
=======
<<<<<<< HEAD
import React from "react"
=======
import React from "react";
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
import {
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
<<<<<<< HEAD
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	ExploreGrid,
	SearchBar,
	SearchSuggestions,
} from "../../src/components/explore";
import { ExploreSkeleton } from "../../src/components/explore/ExploreSkeleton";
import { CommentsSheet } from "../../src/components/comments";
import { FeedPost } from "../../src/components/feed/FeedPost";
import { ShareSheet } from "../../src/components/share";
import FeedService from "../../src/services/FeedService";
import { useExploreData } from "../../src/hooks/useExploreData";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import { FeedPostItem } from "../../src/types/feed";
import { TrendingClip } from "../../src/types/explore";

export default function ExploreScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const detailScrollY = useSharedValue(0);
=======
<<<<<<< HEAD
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
=======
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	ExploreGrid,
	SearchBar,
	SearchSuggestions,
} from "../../src/components/explore";
import { ExploreSkeleton } from "../../src/components/explore/ExploreSkeleton";
import { CommentsSheet } from "../../src/components/comments";
import { FeedPost } from "../../src/components/feed/FeedPost";
import { ShareSheet } from "../../src/components/share";
import FeedService from "../../src/services/FeedService";
import { useExploreData } from "../../src/hooks/useExploreData";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import { FeedPostItem } from "../../src/types/feed";
import { TrendingClip } from "../../src/types/explore";

export default function ExploreScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const detailScrollY = useSharedValue(0);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	const {
		query,
		setQuery,
		clips,
		visibleClips,
		clipAspects,
		isInitialLoading,
		refreshing,
		searchResults,
		isSearchLoading,
		hasMoreClips,
		isLoadingMore,
		loadMoreClips,
		onRefresh,
<<<<<<< HEAD
	} = useExploreData();
=======
<<<<<<< HEAD
	} = useExploreData()
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("explore");
	const [detailVisible, setDetailVisible] = React.useState(false);
	const [selectedPostId, setSelectedPostId] = React.useState<string | null>(
		null,
	);
	const [searchFocused, setSearchFocused] = React.useState(false);
	const [selectedActionPostId, setSelectedActionPostId] = React.useState<
		string | null
	>(null);
	const [isCommentSheetVisible, setIsCommentSheetVisible] =
		React.useState(false);
	const [isShareSheetVisible, setIsShareSheetVisible] = React.useState(false);
	const [likedPostIds, setLikedPostIds] = React.useState<
		Record<string, boolean>
	>({});
	const [likeCountByPostId, setLikeCountByPostId] = React.useState<
		Record<string, number>
	>({});
	const [commentCountByPostId, setCommentCountByPostId] = React.useState<
		Record<string, number>
<<<<<<< HEAD
	>({});
=======
	>({})
=======
	} = useExploreData();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("explore");
	const [detailVisible, setDetailVisible] = React.useState(false);
	const [selectedPostId, setSelectedPostId] = React.useState<string | null>(
		null,
	);
	const [searchFocused, setSearchFocused] = React.useState(false);
	const [selectedActionPostId, setSelectedActionPostId] = React.useState<
		string | null
	>(null);
	const [isCommentSheetVisible, setIsCommentSheetVisible] =
		React.useState(false);
	const [isShareSheetVisible, setIsShareSheetVisible] = React.useState(false);
	const [likedPostIds, setLikedPostIds] = React.useState<
		Record<string, boolean>
	>({});
	const [likeCountByPostId, setLikeCountByPostId] = React.useState<
		Record<string, number>
	>({});
	const [commentCountByPostId, setCommentCountByPostId] = React.useState<
		Record<string, number>
	>({});
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const allPosts = React.useMemo(
		() => clips.filter((clip) => clip.type === "post"),
		[clips],
<<<<<<< HEAD
	);
=======
<<<<<<< HEAD
	)
=======
	);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const selectedIndex = React.useMemo(
		() => allPosts.findIndex((clip) => clip.id === selectedPostId),
		[allPosts, selectedPostId],
<<<<<<< HEAD
	);
=======
<<<<<<< HEAD
	)
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const relatedPosts = React.useMemo(() => {
		if (selectedIndex < 0) {
			return allPosts;
		}

<<<<<<< HEAD
=======
		const current = allPosts[selectedIndex]
		const rest = allPosts.filter((clip) => clip.id !== current.id)
		return [current, ...rest]
	}, [allPosts, selectedIndex])
=======
	);

	const relatedPosts = React.useMemo(() => {
		if (selectedIndex < 0) {
			return allPosts;
		}

>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		const current = allPosts[selectedIndex];
		const rest = allPosts.filter((clip) => clip.id !== current.id);
		return [current, ...rest];
	}, [allPosts, selectedIndex]);
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const mapExplorePostToFeedPost = React.useCallback(
		(
			clip: TrendingClip,
			overrides?: {
<<<<<<< HEAD
				likedByMe?: boolean;
				likes?: number;
				comments?: number;
=======
<<<<<<< HEAD
				likedByMe?: boolean
				likes?: number
				comments?: number
=======
				likedByMe?: boolean;
				likes?: number;
				comments?: number;
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
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
<<<<<<< HEAD
			createdAt: clip.createdAt,
			likedByMe: overrides?.likedByMe ?? clip.likedByMe,
		}),
		[],
	);
=======
<<<<<<< HEAD
			time: formatTimeAgo(clip.createdAt),
			likedByMe: overrides?.likedByMe ?? clip.likedByMe,
		}),
		[],
	)
=======
			createdAt: clip.createdAt,
			likedByMe: overrides?.likedByMe ?? clip.likedByMe,
		}),
		[],
	);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const normalizePostId = React.useCallback(
		(postId: string) => postId.replace(/^post-/, ""),
		[],
<<<<<<< HEAD
	);
=======
<<<<<<< HEAD
	)
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const openCommentSheet = React.useCallback((postId: string) => {
		setSelectedActionPostId(postId);
		setIsCommentSheetVisible(true);
	}, []);

	const openShareSheet = React.useCallback((postId: string) => {
<<<<<<< HEAD
		setSelectedActionPostId(postId);
		setIsShareSheetVisible(true);
	}, []);
=======
		setSelectedActionPostId(postId)
		setIsShareSheetVisible(true)
	}, [])
=======
	);

	const openCommentSheet = React.useCallback((postId: string) => {
		setSelectedActionPostId(postId);
		setIsCommentSheetVisible(true);
	}, []);

	const openShareSheet = React.useCallback((postId: string) => {
		setSelectedActionPostId(postId);
		setIsShareSheetVisible(true);
	}, []);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const openClipDetail = React.useCallback(
		(clip: TrendingClip) => {
			if (clip.type === "clip") {
<<<<<<< HEAD
				const clipId = clip.id.replace(/^clip-/, "");
				setDetailVisible(false);
				router.push({ pathname: "/(tabs)/clips", params: { clipId } });
				return;
=======
<<<<<<< HEAD
				const clipId = clip.id.replace(/^clip-/, "")
				setDetailVisible(false)
				router.push({ pathname: "/(tabs)/clips", params: { clipId } })
				return
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
			}

			setSelectedPostId(clip.id);
			setDetailVisible(true);
		},
		[router],
	);

	const handleTogglePostLike = React.useCallback(
		async (postId: string) => {
			const post = allPosts.find((item) => item.id === postId);
			if (!post) {
				return;
			}

			const currentLiked = likedPostIds[postId] ?? Boolean(post.likedByMe);
			const currentLikeCount = likeCountByPostId[postId] ?? post.likes;
			const nextLiked = !currentLiked;
			const nextLikeCount = Math.max(
				0,
				currentLikeCount + (nextLiked ? 1 : -1),
<<<<<<< HEAD
			);
=======
			)
=======
				const clipId = clip.id.replace(/^clip-/, "");
				setDetailVisible(false);
				router.push({ pathname: "/(tabs)/clips", params: { clipId } });
				return;
			}

			setSelectedPostId(clip.id);
			setDetailVisible(true);
		},
		[router],
	);

	const handleTogglePostLike = React.useCallback(
		async (postId: string) => {
			const post = allPosts.find((item) => item.id === postId);
			if (!post) {
				return;
			}

			const currentLiked = likedPostIds[postId] ?? Boolean(post.likedByMe);
			const currentLikeCount = likeCountByPostId[postId] ?? post.likes;
			const nextLiked = !currentLiked;
			const nextLikeCount = Math.max(
				0,
				currentLikeCount + (nextLiked ? 1 : -1),
			);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

			setLikedPostIds((prev) => ({
				...prev,
				[postId]: nextLiked,
<<<<<<< HEAD
			}));
=======
<<<<<<< HEAD
			}))
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
			setLikeCountByPostId((prev) => ({
				...prev,
				[postId]: nextLikeCount,
			}));

			try {
				const normalizedPostId = normalizePostId(postId);
				if (nextLiked) {
					await FeedService.likePost(normalizedPostId);
				} else {
<<<<<<< HEAD
					await FeedService.unlikePost(normalizedPostId);
=======
					await FeedService.unlikePost(normalizedPostId)
=======
			}));
			setLikeCountByPostId((prev) => ({
				...prev,
				[postId]: nextLikeCount,
			}));

			try {
				const normalizedPostId = normalizePostId(postId);
				if (nextLiked) {
					await FeedService.likePost(normalizedPostId);
				} else {
					await FeedService.unlikePost(normalizedPostId);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
				}
			} catch {
				setLikedPostIds((prev) => ({
					...prev,
					[postId]: currentLiked,
<<<<<<< HEAD
				}));
=======
<<<<<<< HEAD
				}))
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
				setLikeCountByPostId((prev) => ({
					...prev,
					[postId]: currentLikeCount,
				}));
			}
		},
		[allPosts, likeCountByPostId, likedPostIds, normalizePostId],
<<<<<<< HEAD
	);
=======
	)
=======
				}));
				setLikeCountByPostId((prev) => ({
					...prev,
					[postId]: currentLikeCount,
				}));
			}
		},
		[allPosts, likeCountByPostId, likedPostIds, normalizePostId],
	);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

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
<<<<<<< HEAD
	);
=======
<<<<<<< HEAD
	)
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const showSuggestions = query.length > 0 || searchFocused;
	const shouldShowSkeleton = !showSuggestions && isInitialLoading;

	const renderDetailPost = React.useCallback(
		({ item, index }: { item: TrendingClip; index: number }) => {
<<<<<<< HEAD
			const liked = likedPostIds[item.id] ?? Boolean(item.likedByMe);
			const likeCount = likeCountByPostId[item.id] ?? item.likes;
			const commentCount = commentCountByPostId[item.id] ?? item.comments;
=======
			const liked = likedPostIds[item.id] ?? Boolean(item.likedByMe)
			const likeCount = likeCountByPostId[item.id] ?? item.likes
			const commentCount = commentCountByPostId[item.id] ?? item.comments
=======
	);

	const showSuggestions = query.length > 0 || searchFocused;
	const shouldShowSkeleton = !showSuggestions && isInitialLoading;

	const renderDetailPost = React.useCallback(
		({ item, index }: { item: TrendingClip; index: number }) => {
			const liked = likedPostIds[item.id] ?? Boolean(item.likedByMe);
			const likeCount = likeCountByPostId[item.id] ?? item.likes;
			const commentCount = commentCountByPostId[item.id] ?? item.comments;
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

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
<<<<<<< HEAD
						void handleTogglePostLike(postId);
=======
<<<<<<< HEAD
						void handleTogglePostLike(postId)
=======
						void handleTogglePostLike(postId);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
					}}
					onAddComment={openCommentSheet}
					onShare={openShareSheet}
					scrollY={detailScrollY}
				/>
<<<<<<< HEAD
			);
=======
<<<<<<< HEAD
			)
=======
			);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
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
<<<<<<< HEAD
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
=======
<<<<<<< HEAD
	)

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<Animated.View style={[styles.container, swipeAnimatedStyle]} {...swipeHandlers}>
=======
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
			<Animated.View
				style={[styles.container, swipeAnimatedStyle]}
				{...swipeHandlers}
			>
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
				<View style={styles.searchWrap}>
					<SearchBar
						value={query}
						onChangeText={setQuery}
						onFocus={() => setSearchFocused(true)}
						onBlur={() => {
<<<<<<< HEAD
							setTimeout(() => setSearchFocused(false), 150);
=======
<<<<<<< HEAD
							setTimeout(() => setSearchFocused(false), 150)
=======
							setTimeout(() => setSearchFocused(false), 150);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
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
<<<<<<< HEAD
								setSearchFocused(false);
=======
<<<<<<< HEAD
								setSearchFocused(false)
=======
								setSearchFocused(false);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
							}}
						/>
					</View>
				) : shouldShowSkeleton ? (
					<ExploreSkeleton />
				) : (
					<ExploreGrid
						clips={visibleClips}
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
<<<<<<< HEAD
							detailScrollY.value = event.nativeEvent.contentOffset.y;
=======
<<<<<<< HEAD
							detailScrollY.value = event.nativeEvent.contentOffset.y
=======
							detailScrollY.value = event.nativeEvent.contentOffset.y;
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
						}}
						renderItem={renderDetailPost}
						scrollEventThrottle={16}
						showsVerticalScrollIndicator={false}
<<<<<<< HEAD
						ItemSeparatorComponent={() => (
							<View style={styles.detailSeparator} />
						)}
=======
<<<<<<< HEAD
						ItemSeparatorComponent={() => <View style={styles.detailSeparator} />}
=======
						ItemSeparatorComponent={() => (
							<View style={styles.detailSeparator} />
						)}
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
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
<<<<<<< HEAD
						}));
=======
<<<<<<< HEAD
						}))
=======
						}));
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
					}
				}}
			/>

			{(() => {
<<<<<<< HEAD
				const selectedPost = allPosts.find(
					(p) => p.id === selectedActionPostId,
				);
				return (
					<ShareSheet
=======
<<<<<<< HEAD
				const selectedPost = allPosts.find((p) => p.id === selectedActionPostId);
				return (
					<ShareSheet
						postId={selectedActionPostId ? normalizePostId(selectedActionPostId) : null}
=======
				const selectedPost = allPosts.find(
					(p) => p.id === selectedActionPostId,
				);
				return (
					<ShareSheet
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
						postId={
							selectedActionPostId
								? normalizePostId(selectedActionPostId)
								: null
						}
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
						resourceType="post"
						visible={isShareSheetVisible}
						onClose={() => setIsShareSheetVisible(false)}
						caption={selectedPost?.title ?? undefined}
						thumbnailUrl={selectedPost?.thumbnail ?? undefined}
					/>
				);
			})()}
		</SafeAreaView>
<<<<<<< HEAD
	);
=======
<<<<<<< HEAD
	)
=======
	);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}
