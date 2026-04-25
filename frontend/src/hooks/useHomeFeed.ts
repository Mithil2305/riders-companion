import React from "react";
import { FeedPostItem, Story } from "../types/feed";
import FeedService, { FeedPostPayload } from "../services/FeedService";
import { useUploadManager } from "../contexts/UploadContext";
import { formatCompactTimeAgo } from "../utils/formatters";

interface UseHomeFeedResult {
	loading: boolean;
	refreshing: boolean;
	posts: FeedPostItem[];
	stories: Story[];
	likedPostIds: Record<string, boolean>;
	onRefresh: () => Promise<void>;
	toggleLike: (postId: string) => void;
	addComment: (postId: string, commentText?: string) => void;
	updateCommentCount: (postId: string, count: number) => void;
}

const toFeedPostItem = (post: FeedPostPayload): FeedPostItem | null => {
	if (!post.mediaUrl) {
		return null;
	}

	return {
		id: post.id,
		riderId: post.rider?.id,
		user: post.rider?.username
			? `@${post.rider.username}`
			: (post.rider?.name ?? "rider"),
		avatar:
			post.rider?.profileImageUrl ??
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
		image: post.mediaUrl,
		mediaType: post.mediaType,
		aspectRatio:
			typeof post.width === "number" &&
			typeof post.height === "number" &&
			post.width > 0 &&
			post.height > 0
				? post.width / post.height
				: undefined,
		caption: post.caption ?? "",
		likes: Number(post.likesCount ?? 0),
		comments: Number(post.commentsCount ?? 0),
		time: formatCompactTimeAgo(post.createdAt),
		likedByMe: Boolean(post.likedByMe),
	};
};

export function useHomeFeed(): UseHomeFeedResult {
	const { lastCompletedUploadAt } = useUploadManager();
	const [loading, setLoading] = React.useState(true);
	const [refreshing, setRefreshing] = React.useState(false);
	const [posts, setPosts] = React.useState<FeedPostItem[]>([]);
	const [stories, setStories] = React.useState<Story[]>([]);
	const [likedPostIds, setLikedPostIds] = React.useState<
		Record<string, boolean>
	>({});

	const loadFeed = React.useCallback(async () => {
		const data = await FeedService.getFeed();
		const nextPosts = data.posts
			.map(toFeedPostItem)
			.filter((item): item is FeedPostItem => item != null);

		setPosts(nextPosts);

		const nextStories: Story[] = nextPosts.slice(0, 8).map((item) => ({
			id: item.id,
			name: item.user.replace("@", ""),
			avatar: item.avatar,
		}));
		setStories(nextStories);

		const nextLikedMap: Record<string, boolean> = {};
		nextPosts.forEach((post) => {
			if (post.likedByMe) {
				nextLikedMap[post.id] = true;
			}
		});
		setLikedPostIds(nextLikedMap);
	}, []);

	React.useEffect(() => {
		let mounted = true;

		const run = async () => {
			try {
				await loadFeed();
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		void run();

		return () => {
			mounted = false;
		};
	}, [loadFeed]);

	React.useEffect(() => {
		if (lastCompletedUploadAt <= 0) {
			return;
		}

		void loadFeed();
	}, [lastCompletedUploadAt, loadFeed]);

	const onRefresh = React.useCallback(async () => {
		setRefreshing(true);
		try {
			await loadFeed();
		} finally {
			setRefreshing(false);
		}
	}, [loadFeed]);

	const toggleLike = React.useCallback((postId: string) => {
		setLikedPostIds((prev) => {
			const likedNext = !prev[postId];

			void (async () => {
				try {
					const response = likedNext
						? await FeedService.likePost(postId)
						: await FeedService.unlikePost(postId);

					setPosts((current) =>
						current.map((post) =>
							post.id === postId
								? {
										...post,
										likes: response.likesCount,
										likedByMe: likedNext,
									}
								: post,
						),
					);
				} catch {
					setLikedPostIds((rollback) => ({
						...rollback,
						[postId]: !likedNext,
					}));
				}
			})();

			return {
				...prev,
				[postId]: likedNext,
			};
		});
	}, []);

	const addComment = React.useCallback(
		(postId: string, commentText: string = "Nice ride!") => {
			void (async () => {
				try {
					const response = await FeedService.commentOnPost(postId, commentText);
					setPosts((current) =>
						current.map((post) =>
							post.id === postId
								? {
										...post,
										comments: response.commentsCount,
									}
								: post,
						),
					);
				} catch {
					// no-op: UI stays stable if comment request fails
				}
			})();
		},
		[],
	);

	const updateCommentCount = React.useCallback((postId: string, count: number) => {
		setPosts((current) =>
			current.map((post) => {
				if (post.id !== postId) {
					return post;
				}

				if (post.comments === count) {
					return post;
				}

				return { ...post, comments: count };
			}),
		);
	}, []);

	return {
		loading,
		refreshing,
		posts,
		stories,
		likedPostIds,
		onRefresh,
		toggleLike,
		addComment,
		updateCommentCount,
	};
}
