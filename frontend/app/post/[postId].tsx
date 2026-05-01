import React from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSharedValue } from "react-native-reanimated";
import FeedService, { FeedPostPayload } from "../../src/services/FeedService";
import ProfileService from "../../src/services/ProfileService";
import { useTheme } from "../../src/hooks/useTheme";
import { FeedPost } from "../../src/components/feed/FeedPost";
import { CommentsSheet } from "../../src/components/comments";
import { ShareSheet } from "../../src/components/share";
import type { FeedPostItem } from "../../src/types/feed";

const FALLBACK_AVATAR =
	"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80";

function isSameAuthor(candidate: FeedPostPayload, selected: FeedPostPayload) {
	if (candidate.id === selected.id) {
		return false;
	}

	if (candidate.rider?.id && selected.rider?.id) {
		return candidate.rider.id === selected.rider.id;
	}

	if (candidate.rider?.username && selected.rider?.username) {
		return candidate.rider.username === selected.rider.username;
	}

	return false;
}

function toFeedPostItem(post: FeedPostPayload): FeedPostItem {
	return {
		id: post.id,
		riderId: post.rider?.id,
		user: post.rider?.username
			? `@${post.rider.username}`
			: (post.rider?.name ?? "rider"),
		avatar: post.rider?.profileImageUrl ?? FALLBACK_AVATAR,
		image: post.mediaUrl ?? "",
		mediaType: post.mediaType,
		aspectRatio:
			post.width && post.height && post.width > 0 && post.height > 0
				? post.width / post.height
				: undefined,
		caption: post.caption ?? "",
		likes: post.likesCount ?? 0,
		comments: post.commentsCount ?? 0,
		createdAt: post.createdAt,
		likedByMe: post.likedByMe,
	};
}

export default function PostDetailsPage() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams<{ postId?: string }>();
	const postId = typeof params.postId === "string" ? params.postId : "";

	const [loading, setLoading] = React.useState(true);
	const [deleting, setDeleting] = React.useState(false);
	const [posts, setPosts] = React.useState<FeedPostPayload[]>([]);
	const [myRiderId, setMyRiderId] = React.useState<string | null>(null);
	const [likedPostIds, setLikedPostIds] = React.useState<
		Record<string, boolean>
	>({});
	const [likeCounts, setLikeCounts] = React.useState<Record<string, number>>(
		{},
	);
	const [commentCounts, setCommentCounts] = React.useState<
		Record<string, number>
	>({});
	const [isCommentSheetVisible, setIsCommentSheetVisible] =
		React.useState(false);
	const [isShareSheetVisible, setIsShareSheetVisible] = React.useState(false);
	const [selectedActionPostId, setSelectedActionPostId] = React.useState<
		string | null
	>(null);

	const scrollY = useSharedValue(0);

	const selectedPost = posts[0] ?? null;
	const relatedPosts = posts.slice(1);
	const isOwner =
		selectedPost?.rider?.id != null && selectedPost.rider.id === myRiderId;

	React.useEffect(() => {
		let mounted = true;

		const load = async () => {
			if (!postId) {
				if (mounted) {
					setLoading(false);
				}
				return;
			}

			try {
				const [postData, profileData, feedData] = await Promise.all([
					FeedService.getPostById(postId),
					ProfileService.getMyProfile(),
					FeedService.getFeed(),
				]);

				if (!mounted) {
					return;
				}

				const primaryPost = postData.post;
				const sameAuthorPosts = feedData.posts.filter(
					(candidate) =>
						Boolean(candidate.mediaUrl) && isSameAuthor(candidate, primaryPost),
				);

				const allPosts = [primaryPost, ...sameAuthorPosts];
				setPosts(allPosts);
				setMyRiderId(profileData.profile.id);

				const initialLikes: Record<string, boolean> = {};
				const initialCounts: Record<string, number> = {};
				const initialComments: Record<string, number> = {};
				for (const p of allPosts) {
					initialLikes[p.id] = p.likedByMe ?? false;
					initialCounts[p.id] = p.likesCount ?? 0;
					initialComments[p.id] = p.commentsCount ?? 0;
				}
				setLikedPostIds(initialLikes);
				setLikeCounts(initialCounts);
				setCommentCounts(initialComments);
			} catch (error) {
				if (!mounted) {
					return;
				}
				Alert.alert(
					"Unable to open post",
					error instanceof Error ? error.message : "Post could not be loaded.",
				);
				router.back();
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		void load();

		return () => {
			mounted = false;
		};
	}, [postId, router]);

	const handleToggleLike = React.useCallback(
		async (targetPostId: string) => {
			const currentlyLiked = likedPostIds[targetPostId] ?? false;
			const currentCount = likeCounts[targetPostId] ?? 0;
			setLikedPostIds((prev) => ({ ...prev, [targetPostId]: !currentlyLiked }));
			setLikeCounts((prev) => ({
				...prev,
				[targetPostId]: currentlyLiked
					? Math.max(0, currentCount - 1)
					: currentCount + 1,
			}));
			try {
				if (currentlyLiked) {
					await FeedService.unlikePost(targetPostId);
				} else {
					await FeedService.likePost(targetPostId);
				}
			} catch {
				setLikedPostIds((prev) => ({
					...prev,
					[targetPostId]: currentlyLiked,
				}));
				setLikeCounts((prev) => ({ ...prev, [targetPostId]: currentCount }));
			}
		},
		[likedPostIds, likeCounts],
	);

	const openCommentSheet = React.useCallback((targetPostId: string) => {
		setSelectedActionPostId(targetPostId);
		setIsCommentSheetVisible(true);
	}, []);

	const openShareSheet = React.useCallback((targetPostId: string) => {
		setSelectedActionPostId(targetPostId);
		setIsShareSheetVisible(true);
	}, []);

	const handleCommentsCountChange = React.useCallback(
		(targetPostId: string, newCount: number) => {
			setCommentCounts((prev) => ({ ...prev, [targetPostId]: newCount }));
		},
		[],
	);

	const onPressEdit = React.useCallback(() => {
		if (!selectedPost) {
			return;
		}
		router.push({
			pathname: "/create",
			params: {
				editPostId: selectedPost.id,
				editCaption: selectedPost.caption ?? "",
				editMediaUrl: selectedPost.mediaUrl ?? "",
				editMediaType: selectedPost.mediaType ?? "IMAGE",
			},
		});
	}, [router, selectedPost]);

	const onPressDelete = React.useCallback(() => {
		if (!selectedPost) {
			return;
		}
		Alert.alert("Delete post", "Delete this post permanently?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					setDeleting(true);
					try {
						await FeedService.deletePost(selectedPost.id);
						router.replace("/(tabs)/profile");
					} catch (error) {
						Alert.alert(
							"Delete failed",
							error instanceof Error
								? error.message
								: "Unable to delete this post right now.",
						);
					} finally {
						setDeleting(false);
					}
				},
			},
		]);
	}, [router, selectedPost]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					height: 56,
					paddingHorizontal: metrics.md,
					borderBottomWidth: 1,
					borderBottomColor: colors.borderDark,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				headerTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				spacer: {
					width: 24,
					height: 24,
				},
				loadingWrap: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
				},
				scrollContent: {
					paddingBottom: metrics.xl,
				},
				divider: {
					height: 10,
					backgroundColor: colors.background,
				},
				relatedHeader: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.md,
					gap: metrics.xs,
				},
				relatedTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				relatedSubtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
				},
				notFoundText: {
					color: colors.textSecondary,
				},
				ownerActions: {
					flexDirection: "row",
					gap: metrics.sm,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.md,
				},
				ownerBtn: {
					flex: 1,
					minHeight: 44,
					borderRadius: metrics.radius.md,
					alignItems: "center",
					justifyContent: "center",
				},
				editBtn: {
					backgroundColor: colors.primary,
				},
				deleteBtn: {
					backgroundColor: colors.danger ?? colors.warning,
				},
				ownerBtnText: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
			}),
		[colors, metrics, typography],
	);

	if (loading) {
		return (
			<SafeAreaView
				edges={["left", "right", "top", "bottom"]}
				style={styles.container}
			>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()}>
						<Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
					</Pressable>
					<Text style={styles.headerTitle}>Post</Text>
					<View style={styles.spacer} />
				</View>
				<View style={styles.loadingWrap}>
					<ActivityIndicator color={colors.primary} size="small" />
				</View>
			</SafeAreaView>
		);
	}

	if (!selectedPost || !selectedPost.mediaUrl) {
		return (
			<SafeAreaView
				edges={["left", "right", "top", "bottom"]}
				style={styles.container}
			>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()}>
						<Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
					</Pressable>
					<Text style={styles.headerTitle}>Post</Text>
					<View style={styles.spacer} />
				</View>
				<View style={styles.loadingWrap}>
					<Text style={styles.notFoundText}>Post not found.</Text>
				</View>
			</SafeAreaView>
		);
	}

	const selectedFeedItem = toFeedPostItem(selectedPost);
	const selectedFeedItemWithCounts: FeedPostItem = {
		...selectedFeedItem,
		likes: likeCounts[selectedPost.id] ?? selectedPost.likesCount ?? 0,
		comments: commentCounts[selectedPost.id] ?? selectedPost.commentsCount ?? 0,
		likedByMe: likedPostIds[selectedPost.id] ?? selectedPost.likedByMe ?? false,
	};

	return (
		<SafeAreaView
			edges={["left", "right", "top", "bottom"]}
			style={styles.container}
		>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()}>
					<Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
				</Pressable>
				<Text style={styles.headerTitle}>Post</Text>
				<View style={styles.spacer} />
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<FeedPost
					index={0}
					item={selectedFeedItemWithCounts}
					liked={selectedFeedItemWithCounts.likedByMe ?? false}
					onAddComment={openCommentSheet}
					onOpenProfile={(riderId) => router.push(`/rider/${riderId}`)}
					onShare={openShareSheet}
					onToggleLike={handleToggleLike}
					scrollY={scrollY}
				/>

				{isOwner ? (
					<View style={styles.ownerActions}>
						<Pressable
							onPress={onPressEdit}
							style={[styles.ownerBtn, styles.editBtn]}
						>
							<Text style={styles.ownerBtnText}>Edit Post</Text>
						</Pressable>
						<Pressable
							disabled={deleting}
							onPress={onPressDelete}
							style={[styles.ownerBtn, styles.deleteBtn]}
						>
							<Text style={styles.ownerBtnText}>
								{deleting ? "Deleting..." : "Delete Post"}
							</Text>
						</Pressable>
					</View>
				) : null}

				{relatedPosts.length > 0 ? (
					<>
						<View style={styles.divider} />
						<View style={styles.relatedHeader}>
							<Text style={styles.relatedTitle}>
								More from{" "}
								{selectedPost.rider?.username
									? `@${selectedPost.rider.username}`
									: (selectedPost.rider?.name ?? "this rider")}
							</Text>
							<Text style={styles.relatedSubtitle}>
								Scroll to keep browsing posts from the same profile.
							</Text>
						</View>

						{relatedPosts.map((item, index) => {
							const feedItem = toFeedPostItem(item);
							const feedItemWithCounts: FeedPostItem = {
								...feedItem,
								likes: likeCounts[item.id] ?? item.likesCount ?? 0,
								comments: commentCounts[item.id] ?? item.commentsCount ?? 0,
								likedByMe: likedPostIds[item.id] ?? item.likedByMe ?? false,
							};
							return (
								<React.Fragment key={item.id}>
									<FeedPost
										index={index + 1}
										item={feedItemWithCounts}
										liked={feedItemWithCounts.likedByMe ?? false}
										onAddComment={openCommentSheet}
										onOpenProfile={(riderId) =>
											router.push(`/rider/${riderId}`)
										}
										onShare={openShareSheet}
										onToggleLike={handleToggleLike}
										scrollY={scrollY}
									/>
									<View style={styles.divider} />
								</React.Fragment>
							);
						})}
					</>
				) : null}
			</ScrollView>

			<CommentsSheet
				contentId={selectedActionPostId}
				contentType="feed"
				visible={isCommentSheetVisible}
				onClose={() => setIsCommentSheetVisible(false)}
				onCommentsCountChange={(newCount) => {
					if (selectedActionPostId) {
						handleCommentsCountChange(selectedActionPostId, newCount);
					}
				}}
			/>

			{(() => {
				const targetPost = posts.find((p) => p.id === selectedActionPostId);
				return (
					<ShareSheet
						postId={selectedActionPostId}
						resourceType="post"
						visible={isShareSheetVisible}
						onClose={() => setIsShareSheetVisible(false)}
						caption={targetPost?.caption ?? undefined}
						thumbnailUrl={targetPost?.mediaUrl ?? undefined}
					/>
				);
			})()}
		</SafeAreaView>
	);
}
