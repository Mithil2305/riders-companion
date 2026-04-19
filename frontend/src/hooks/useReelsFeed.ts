import React from "react";
import { ReelItem } from "../types/reels";
import ClipService from "../services/ClipService";

interface UseReelsFeedResult {
	reels: ReelItem[];
	activeIndex: number;
	setActiveIndex: (index: number) => void;
	toggleLike: (reelId: string) => void;
}

const toReelItem = (
	clip: Awaited<ReturnType<typeof ClipService.getClips>>["clips"][number],
): ReelItem => ({
	id: clip.id,
	user: clip.rider?.username ?? clip.rider?.name ?? "rider",
	avatar:
		clip.rider?.profileImageUrl ??
		"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
	media: clip.videoUrl,
	caption: clip.songId ? `Now playing: ${clip.songId}` : "Ride reel",
	likes: Number(clip.likesCount ?? 0),
	comments: Number(clip.commentsCount ?? 0),
	shares: Number(clip.sharesCount ?? 0),
	music: clip.songId ?? "Original audio",
	likedByMe: Boolean(clip.likedByMe),
});

export function useReelsFeed(): UseReelsFeedResult {
	const [activeIndex, setActiveIndex] = React.useState(0);
	const [reels, setReels] = React.useState<ReelItem[]>([]);

	React.useEffect(() => {
		let mounted = true;

		const load = async () => {
			try {
				const data = await ClipService.getClips();
				if (!mounted) {
					return;
				}

				setReels(data.clips.map(toReelItem));
			} catch {
				if (mounted) {
					setReels([]);
				}
			}
		};

		void load();

		return () => {
			mounted = false;
		};
	}, []);

	const toggleLike = React.useCallback((reelId: string) => {
		setReels((current) => {
			const target = current.find((item) => item.id === reelId);
			if (!target) {
				return current;
			}

			const nextLiked = !target.likedByMe;

			void (async () => {
				try {
					const result = nextLiked
						? await ClipService.likeClip(reelId)
						: await ClipService.unlikeClip(reelId);

					setReels((latest) =>
						latest.map((item) =>
							item.id === reelId
								? {
										...item,
										likes: result.likesCount,
										likedByMe: nextLiked,
									}
								: item,
						),
					);
				} catch {
					setReels((latest) =>
						latest.map((item) =>
							item.id === reelId
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
				item.id === reelId
					? {
							...item,
							likedByMe: nextLiked,
						}
					: item,
			);
		});
	}, []);

	return {
		reels,
		activeIndex,
		setActiveIndex,
		toggleLike,
	};
}
