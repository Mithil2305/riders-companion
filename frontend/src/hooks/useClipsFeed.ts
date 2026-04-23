import React from "react";
import { ClipItem } from "../types/clips";
import ClipService from "../services/ClipService";

interface UseClipsFeedResult {
	clips: ClipItem[];
	activeIndex: number;
	refreshing: boolean;
	setActiveIndex: (index: number) => void;
	toggleLike: (clipId: string) => void;
	onRefresh: () => Promise<void>;
}

const toClipItem = (
	clip: Awaited<ReturnType<typeof ClipService.getClips>>["clips"][number],
): ClipItem => ({
	id: clip.id,
	user: clip.rider?.username ?? clip.rider?.name ?? "rider",
	avatar:
		clip.rider?.profileImageUrl ??
		"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
	media: clip.videoUrl,
	caption: clip.songId ? `Now playing: ${clip.songId}` : "Ride clip",
	likes: Number(clip.likesCount ?? 0),
	comments: Number(clip.commentsCount ?? 0),
	shares: Number(clip.sharesCount ?? 0),
	music: clip.songId ?? "Original audio",
	likedByMe: Boolean(clip.likedByMe),
});

export function useClipsFeed(): UseClipsFeedResult {
	const [activeIndex, setActiveIndex] = React.useState(0);
	const [clips, setClips] = React.useState<ClipItem[]>([]);
	const [refreshing, setRefreshing] = React.useState(false);
	const mountedRef = React.useRef(true);

	const loadClips = React.useCallback(async () => {
		try {
			const data = await ClipService.getClips();
			if (!mountedRef.current) {
				return;
			}

			setClips(data.clips.map(toClipItem));
		} catch {
			if (mountedRef.current) {
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

	const toggleLike = React.useCallback((clipId: string) => {
		setClips((current) => {
			const target = current.find((item) => item.id === clipId);
			if (!target) {
				return current;
			}

			const nextLiked = !target.likedByMe;

			void (async () => {
				try {
					const result = nextLiked
						? await ClipService.likeClip(clipId)
						: await ClipService.unlikeClip(clipId);

					setClips((latest) =>
						latest.map((item) =>
							item.id === clipId
								? {
										...item,
										likes: result.likesCount,
										likedByMe: nextLiked,
									}
								: item,
						),
					);
				} catch {
					setClips((latest) =>
						latest.map((item) =>
							item.id === clipId
								? {
										...item,
										likes: item.likes,
										likedByMe: !nextLiked,
									}
								: item,
						),
					);
				}
			})();

			return current.map((item) =>
				item.id === clipId
					? {
							...item,
							likedByMe: nextLiked,
						}
					: item,
			);
		});
	}, []);

	return {
		clips,
		activeIndex,
		refreshing,
		setActiveIndex,
		toggleLike,
		onRefresh,
	};
}
