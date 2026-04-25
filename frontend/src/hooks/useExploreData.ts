import React from "react";
import {
	ExploreGridSection,
	SuggestedRoom,
	SuggestedUser,
	TrendingClip,
} from "../types/explore";
import ClipService from "../services/ClipService";
import FeedService from "../services/FeedService";

interface UseExploreDataResult {
	query: string;
	users: SuggestedUser[];
	rooms: SuggestedRoom[];
	clips: TrendingClip[];
	gridSections: ExploreGridSection[];
	hasMoreClips: boolean;
	isLoadingMore: boolean;
	refreshing: boolean;
	isSearching: boolean;
	loadMoreClips: () => void;
	onRefresh: () => Promise<void>;
	setQuery: (value: string) => void;
}

const INITIAL_SECTIONS = 2;
const SECTIONS_PER_PAGE = 2;
const CLIPS_PER_SECTION = 4;

export function useExploreData(): UseExploreDataResult {
	const [query, setQuery] = React.useState("");
	const [visibleSections, setVisibleSections] =
		React.useState(INITIAL_SECTIONS);
	const [isLoadingMore, setIsLoadingMore] = React.useState(false);
	const [refreshing, setRefreshing] = React.useState(false);
	const [isSearching, setIsSearching] = React.useState(false);
	const [clipPool, setClipPool] = React.useState<TrendingClip[]>([]);
	const mountedRef = React.useRef(true);

	const normalizedQuery = query.trim().toLowerCase();

	const loadClips = React.useCallback(async () => {
		try {
			const [feedData, clipsData] = await Promise.all([
				FeedService.getFeed(),
				ClipService.getClips(),
			]);
			if (!mountedRef.current) {
				return;
			}

			const posts: TrendingClip[] = (feedData.posts ?? []).map((post) => ({
				id: `post-${post.id}`,
				title: post.caption ?? "Post",
				creatorName: post.rider?.name ?? "Rider",
				creatorUsername: post.rider?.username ?? "rider",
				thumbnail: post.mediaUrl ?? "",
				likes: Number(post.likesCount ?? 0),
				comments: Number(post.commentsCount ?? 0),
				shares: 0,
				createdAt: post.createdAt,
				likedByMe: Boolean(post.likedByMe),
				type: "post" as const,
				mediaType: post.mediaType,
			}));

			const clips: TrendingClip[] = (clipsData.clips ?? []).map((clip) => ({
				id: `clip-${clip.id}`,
				title: clip.songId ?? "Ride Clip",
				creatorName: clip.rider?.name ?? "Rider",
				creatorUsername: clip.rider?.username ?? "rider",
				thumbnail: clip.videoUrl,
				likes: Number(clip.likesCount ?? 0),
				comments: Number(clip.commentsCount ?? 0),
				shares: Number(clip.sharesCount ?? 0),
				createdAt: clip.createdAt,
				likedByMe: Boolean(clip.likedByMe),
				type: "clip" as const,
				mediaType: "video",
			}));

			const merged = [...posts, ...clips].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime(),
			);

			setClipPool(merged);
		} catch {
			if (mountedRef.current) {
				setClipPool([]);
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

	const users = React.useMemo(() => {
		const map = new Map<string, SuggestedUser>();
		clipPool.forEach((clip) => {
			const key = clip.creatorUsername;
			if (!key || map.has(key)) {
				return;
			}

			map.set(key, {
				id: key,
				name: clip.creatorName,
				avatar: clip.thumbnail,
			});
		});

		const list = Array.from(map.values());
		if (!normalizedQuery) {
			return list;
		}

		return list.filter((user) =>
			user.name.toLowerCase().includes(normalizedQuery),
		);
	}, [clipPool, normalizedQuery]);

	const rooms = React.useMemo(() => {
		const derivedRooms: SuggestedRoom[] = [
			{
				id: "all-rides",
				name: "All Rides",
				members: clipPool.length,
			},
			{
				id: "trending",
				name: "Trending Clips",
				members: clipPool.filter((clip) => clip.likes > 0).length,
			},
		];

		if (!normalizedQuery) {
			return derivedRooms;
		}

		return derivedRooms.filter((room) =>
			room.name.toLowerCase().includes(normalizedQuery),
		);
	}, [clipPool, normalizedQuery]);

	const clips = React.useMemo(() => {
		if (!normalizedQuery) {
			return clipPool;
		}

		return clipPool.filter((clip) =>
			clip.title.toLowerCase().includes(normalizedQuery),
		);
	}, [clipPool, normalizedQuery]);

	const gridSections = React.useMemo<ExploreGridSection[]>(() => {
		if (clips.length === 0) {
			return [];
		}

		const maxSectionsFromResults = Math.ceil(clips.length / CLIPS_PER_SECTION);
		const sectionCount = Math.min(visibleSections, maxSectionsFromResults);

		return Array.from({ length: sectionCount }, (_, index) => {
			const sectionStart = index * CLIPS_PER_SECTION;
			const first = clips[sectionStart];
			const second = clips[sectionStart + 1] ?? clips[sectionStart];
			const third =
				clips[sectionStart + 2] ??
				clips[sectionStart + 1] ??
				clips[sectionStart];
			const fourth = clips[sectionStart + 3];

			return {
				id: `section-${index}-${normalizedQuery || "all"}`,
				layout: normalizedQuery
					? index % 2 === 0
						? "large-small-large"
						: "small-large-small"
					: "large-small-large",
				heroTop: first,
				smallLeft: second,
				smallRight: third,
				heroBottom: fourth,
			};
		});
	}, [clips, normalizedQuery, visibleSections]);

	const totalSections = Math.ceil(clips.length / CLIPS_PER_SECTION);
	const hasMoreClips = gridSections.length < totalSections;

	const loadMoreClips = React.useCallback(() => {
		if (isLoadingMore || !hasMoreClips) {
			return;
		}

		setIsLoadingMore(true);

		requestAnimationFrame(() => {
			setVisibleSections((current) =>
				Math.min(current + SECTIONS_PER_PAGE, totalSections),
			);
			setIsLoadingMore(false);
		});
	}, [hasMoreClips, isLoadingMore, totalSections]);

	React.useEffect(() => {
		if (!normalizedQuery) {
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		const timer = setTimeout(() => {
			setIsSearching(false);
		}, 180);

		return () => clearTimeout(timer);
	}, [normalizedQuery]);

	React.useEffect(() => {
		setVisibleSections(INITIAL_SECTIONS);
		setIsLoadingMore(false);
	}, [normalizedQuery]);

	return {
		query,
		users,
		rooms,
		clips,
		gridSections,
		hasMoreClips,
		isLoadingMore,
		refreshing,
		isSearching,
		loadMoreClips,
		onRefresh,
		setQuery,
	};
}
