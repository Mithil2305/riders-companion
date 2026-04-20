import React from "react";
import { FeedPostItem, Story } from "../types/feed";
import FeedService, { FeedPostPayload } from "../services/FeedService";

interface UseHomeFeedResult {
	loading: boolean;
	refreshing: boolean;
	posts: FeedPostItem[];
	stories: Story[];
	likedPostIds: Record<string, boolean>;
	onRefresh: () => Promise<void>;
	toggleLike: (postId: string) => void;
	addComment: (postId: string, commentText?: string) => void;
}

const formatRelativeTime = (isoDate: string) => {
	const created = new Date(isoDate).getTime();
	if (Number.isNaN(created)) {
		return "now";
	}

	const diffMs = Date.now() - created;
	const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
	if (diffMinutes < 60) {
		return `${diffMinutes}m ago`;
	}

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}

	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays}d ago`;
};

const toFeedPostItem = (post: FeedPostPayload): FeedPostItem | null => {
	if (!post.mediaUrl) {
		return null;
	}

	return {
		id: post.id,
		user: post.rider?.username
			? `@${post.rider.username}`
			: (post.rider?.name ?? "rider"),
		avatar:
			post.rider?.profileImageUrl ??
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
		image: post.mediaUrl,
		caption: post.caption ?? "",
		likes: Number(post.likesCount ?? 0),
		comments: Number(post.commentsCount ?? 0),
		time: formatRelativeTime(post.createdAt),
		likedByMe: Boolean(post.likedByMe),
	};
};

export function useHomeFeed(): UseHomeFeedResult {
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

	return {
		loading,
		refreshing,
		posts,
		stories,
		likedPostIds,
		onRefresh,
		toggleLike,
		addComment,
	};
}
