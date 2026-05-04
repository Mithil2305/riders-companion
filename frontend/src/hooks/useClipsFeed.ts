import React from "react";
import { ClipItem } from "../types/clips";
import ClipService from "../services/ClipService";
import { useUploadManager } from "../contexts/UploadContext";
import FeedService from "../services/FeedService";

interface UseClipsFeedResult {
	clips: ClipItem[];
	activeIndex: number;
	refreshing: boolean;
	setActiveIndex: (index: number) => void;
	bumpClip: (clipId: string) => void;
	toggleLike: (clipId: string) => void;
	updateCommentCount: (clipId: string, count: number) => void;
	incrementShareCount: (clipId: string) => void;
	onRefresh: () => Promise<void>;
}

let clipsFeedCache: ClipItem[] | null = null;

const mergeClips = (liveClips: ClipItem[], legacyClips: ClipItem[]) => {
	const clipByKey = new Map<string, ClipItem>();
	for (const clip of liveClips) {
		clipByKey.set(`clip:${clip.id}`, clip);
	}

	for (const clip of legacyClips) {
		const dedupeKey = `post:${clip.sourcePostId ?? clip.id}`;
		if (!clipByKey.has(dedupeKey)) {
			clipByKey.set(dedupeKey, clip);
		}
	}

	return [...clipByKey.values()].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
};

const toClipItem = (
	clip: Awaited<ReturnType<typeof ClipService.getClips>>["clips"][number],
): ClipItem => ({
	id: clip.id,
	riderId: clip.rider?.id,
	user: clip.rider?.username ?? clip.rider?.name ?? "rider",
	avatar:
		clip.rider?.profileImageUrl ??
		"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
	media: clip.videoUrl,
	createdAt: clip.createdAt,
	caption: clip.caption?.trim().length
		? clip.caption
		: clip.songId
			? `Now playing: ${clip.songId}`
			: "Ride clip",
	likes: Number(clip.likesCount ?? 0),
	comments: Number(clip.commentsCount ?? 0),
	shares: Number(clip.sharesCount ?? 0),
	music: clip.songId ?? "Original audio",
	likedByMe: Boolean(clip.likedByMe),
});

const toLegacyClipItem = (
	post: Awaited<ReturnType<typeof FeedService.getFeed>>["posts"][number],
): ClipItem => ({
	id: `post-${post.id}`,
	riderId: post.rider?.id,
	user: post.rider?.username ?? post.rider?.name ?? "rider",
	avatar:
		post.rider?.profileImageUrl ??
		"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
	media: post.mediaUrl ?? "",
	createdAt: post.createdAt,
	caption: post.caption?.trim().length ? post.caption : "Ride clip",
	likes: Number(post.likesCount ?? 0),
	comments: Number(post.commentsCount ?? 0),
	shares: 0,
	music: "Original audio",
	likedByMe: Boolean(post.likedByMe),
	sourcePostId: post.id,
});

export function useClipsFeed(): UseClipsFeedResult {
	const { lastCompletedUploadAt } = useUploadManager();
	const [activeIndex, setActiveIndex] = React.useState(0);
	const [clips, setClips] = React.useState<ClipItem[]>(clipsFeedCache ?? []);
	const [refreshing, setRefreshing] = React.useState(false);
	const mountedRef = React.useRef(true);

	const loadClips = React.useCallback(async () => {
		try {
			const [liveClips, legacyClips] = await Promise.all([
				ClipService.getClips()
					.then((clipsData) =>
						clipsData.clips
							.filter(
								(clip) =>
									typeof clip.videoUrl === "string" && clip.videoUrl.length > 0,
							)
							.map(toClipItem),
					)
					.catch(() => [] as ClipItem[]),
				FeedService.getFeed()
					.then((feedData) =>
						feedData.posts
							.filter(
								(post) =>
									post.mediaType === "VIDEO" &&
									typeof post.mediaUrl === "string" &&
									post.mediaUrl.length > 0,
							)
							.map(toLegacyClipItem),
					)
					.catch(() => [] as ClipItem[]),
			]);
			if (!mountedRef.current) {
				return;
			}

			const mergedClips = mergeClips(liveClips, legacyClips);
			clipsFeedCache = mergedClips;
			setClips(mergedClips);
		} catch {
			if (mountedRef.current) {
				clipsFeedCache = [];
				setClips([]);
			}
		}
	}, []);

	React.useEffect(() => {
		mountedRef.current = true;
		void loadClips();

		return () => {
			mountedRef.current = false;
		};
	}, [loadClips]);

	React.useEffect(() => {
		if (lastCompletedUploadAt <= 0) {
			return;
		}

		ClipService.clearClipsCache();
		FeedService.clearFeedCache();
		void loadClips();
	}, [lastCompletedUploadAt, loadClips]);

	const onRefresh = React.useCallback(async () => {
		setRefreshing(true);
		try {
			await loadClips();
		} finally {
			if (mountedRef.current) {
				setRefreshing(false);
			}
		}
	}, [loadClips]);

	const updateClipLike = React.useCallback(
		(clipId: string, forceLiked?: boolean) => {
			setClips((current) => {
				const target = current.find((item) => item.id === clipId);
				if (!target) {
					return current;
				}

				const nextLiked =
					typeof forceLiked === "boolean" ? forceLiked : !target.likedByMe;
				if (target.likedByMe === nextLiked) {
					return current;
				}
				const previousLikes = target.likes;

				void (async () => {
					try {
						const result = target.sourcePostId
							? nextLiked
								? await FeedService.likePost(target.sourcePostId)
								: await FeedService.unlikePost(target.sourcePostId)
							: nextLiked
								? await ClipService.likeClip(clipId)
								: await ClipService.unlikeClip(clipId);

						setClips((latest) => {
							const next = latest.map((item) =>
								item.id === clipId
									? {
											...item,
											likes: result.likesCount,
											likedByMe: nextLiked,
										}
									: item,
							);
							clipsFeedCache = next;
							return next;
						});
					} catch {
						setClips((latest) => {
							const next = latest.map((item) =>
								item.id === clipId
									? {
											...item,
											likes: previousLikes,
											likedByMe: !nextLiked,
										}
									: item,
							);
							clipsFeedCache = next;
							return next;
						});
					}
				})();

				const next = current.map((item) =>
					item.id === clipId
						? {
								...item,
								likedByMe: nextLiked,
								likes: Math.max(0, item.likes + (nextLiked ? 1 : -1)),
							}
						: item,
				);
				clipsFeedCache = next;
				return next;
			});
		},
		[],
	);

	const toggleLike = React.useCallback(
		(clipId: string) => {
			updateClipLike(clipId);
		},
		[updateClipLike],
	);

	const bumpClip = React.useCallback(
		(clipId: string) => {
			updateClipLike(clipId, true);
		},
		[updateClipLike],
	);

	const updateCommentCount = React.useCallback(
		(clipId: string, count: number) => {
			setClips((current) => {
				const next = current.map((clip) =>
					clip.id === clipId ? { ...clip, comments: count } : clip,
				);
				clipsFeedCache = next;
				return next;
			});
		},
		[],
	);

	const incrementShareCount = React.useCallback((clipId: string) => {
		setClips((current) => {
			const next = current.map((clip) =>
				clip.id === clipId
					? { ...clip, shares: Math.max(0, clip.shares + 1) }
					: clip,
			);
			clipsFeedCache = next;
			return next;
		});
	}, []);

	return {
		clips,
		activeIndex,
		refreshing,
		setActiveIndex,
		bumpClip,
		toggleLike,
		updateCommentCount,
		incrementShareCount,
		onRefresh,
	};
}
