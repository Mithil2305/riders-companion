import React from "react";
import { Image } from "react-native";
import {
	ExploreGridSection,
	SuggestedRoom,
	SuggestedUser,
	TrendingClip,
} from "../types/explore";
import ClipService from "../services/ClipService";
import FeedService from "../services/FeedService";
import ProfileService from "../services/ProfileService";

interface UseExploreDataResult {
	query: string;
	users: SuggestedUser[];
	searchResults: SuggestedUser[];
	rooms: SuggestedRoom[];
	clips: TrendingClip[];
	visibleClips: TrendingClip[];
	isInitialLoading: boolean;
	gridSections: ExploreGridSection[];
	clipAspects: Map<string, number>;
	hasMoreClips: boolean;
	isLoadingMore: boolean;
	refreshing: boolean;
	isSearching: boolean;
	isSearchLoading: boolean;
	loadMoreClips: () => void;
	onRefresh: () => Promise<void>;
	setQuery: (value: string) => void;
	clearSearch: () => void;
}

const INITIAL_SECTIONS = 2;
const SECTIONS_PER_PAGE = 2;
const CLIPS_PER_SECTION = 4;
const SEARCH_DEBOUNCE_MS = 80;
const DEFAULT_CLIP_ASPECT = 0.75;
const DEFAULT_POST_ASPECT = 1;
const PREFETCH_MEDIA_COUNT = 18;
const ASPECT_PROBE_COUNT = 30;

let exploreCache:
	| {
			clipPool: TrendingClip[];
			clipAspects: Map<string, number>;
	  }
	| null = null;

const toSuggestedUser = (user: {
	id: string;
	username?: string;
	name?: string;
	avatar?: string;
	followersCount?: number;
}) => ({
	id: user.id,
	username: user.username ?? user.name ?? "rider",
	name: user.name ?? user.username ?? "Rider",
	avatar: user.avatar ?? "",
	followersCount: user.followersCount,
	isVerified: false,
});

const getDefaultAspect = (clip: TrendingClip) => {
	if (
		typeof clip.aspectRatio === "number" &&
		Number.isFinite(clip.aspectRatio) &&
		clip.aspectRatio > 0
	) {
		return clip.aspectRatio;
	}

	return clip.type === "clip" ? DEFAULT_CLIP_ASPECT : DEFAULT_POST_ASPECT;
};

const buildAspectMap = (clips: TrendingClip[]) =>
	new Map(clips.map((clip) => [clip.id, getDefaultAspect(clip)]));

const rankUserMatch = (user: SuggestedUser, query: string) => {
	const normalizedQuery = query.trim().replace(/^@/, "").toLowerCase();
	if (!normalizedQuery) {
		return 0;
	}

	const username = user.username.toLowerCase();
	const name = user.name.toLowerCase();

	if (username === normalizedQuery) {
		return 0;
	}
	if (username.startsWith(normalizedQuery)) {
		return 1;
	}
	if (name.startsWith(normalizedQuery)) {
		return 2;
	}
	if (username.includes(normalizedQuery)) {
		return 3;
	}
	if (name.includes(normalizedQuery)) {
		return 4;
	}

	return Number.POSITIVE_INFINITY;
};

const sortUsersByQuery = (users: SuggestedUser[], query: string) =>
	[...users].sort((left, right) => {
		const leftRank = rankUserMatch(left, query);
		const rightRank = rankUserMatch(right, query);
		if (leftRank !== rightRank) {
			return leftRank - rightRank;
		}

		const followerDelta =
			(right.followersCount ?? 0) - (left.followersCount ?? 0);
		if (followerDelta !== 0) {
			return followerDelta;
		}

		return left.username.localeCompare(right.username);
	});

const prefetchExploreMedia = (clips: TrendingClip[]) => {
	clips.slice(0, PREFETCH_MEDIA_COUNT).forEach((clip) => {
		if (clip.thumbnail) {
			void Image.prefetch(clip.thumbnail);
		}
	});
};

const hydrateClipAspects = async (clips: TrendingClip[]) => {
	const nextAspects = buildAspectMap(clips);

	await Promise.all(
		clips.slice(0, ASPECT_PROBE_COUNT).map(
			(clip) =>
				new Promise<void>((resolve) => {
					if (!clip.thumbnail || clip.type === "clip") {
						resolve();
						return;
					}

					Image.getSize(
						clip.thumbnail,
						(width, height) => {
							if (width > 0 && height > 0) {
								nextAspects.set(clip.id, width / height);
							}
							resolve();
						},
						() => resolve(),
					);
				}),
		),
	);

	return nextAspects;
};

export function useExploreData(): UseExploreDataResult {
	const cachedState = React.useMemo(() => exploreCache, []);
	const [query, setQuery] = React.useState("");
	const [isInitialLoading, setIsInitialLoading] = React.useState(
		!cachedState || cachedState.clipPool.length === 0,
	);
	const [visibleSections, setVisibleSections] =
		React.useState(INITIAL_SECTIONS);
	const [isLoadingMore, setIsLoadingMore] = React.useState(false);
	const [refreshing, setRefreshing] = React.useState(false);
	const [isSearching, setIsSearching] = React.useState(false);
	const [isSearchLoading, setIsSearchLoading] = React.useState(false);
	const [clipPool, setClipPool] = React.useState<TrendingClip[]>(
		cachedState?.clipPool ?? [],
	);
	const [remoteSearchResults, setRemoteSearchResults] = React.useState<
		SuggestedUser[]
	>([]);
	const [clipAspects, setClipAspects] = React.useState<Map<string, number>>(
		cachedState?.clipAspects ?? new Map(),
	);
	const hasCachedClipPoolRef = React.useRef(
		(cachedState?.clipPool.length ?? 0) > 0,
	);
	const mountedRef = React.useRef(true);
	const searchAbortRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const searchRequestIdRef = React.useRef(0);

	const normalizedQuery = query.trim().toLowerCase();

	const clearSearch = React.useCallback(() => {
		setQuery("");
		setRemoteSearchResults([]);
		setIsSearchLoading(false);
		if (searchAbortRef.current) {
			clearTimeout(searchAbortRef.current);
			searchAbortRef.current = null;
		}
	}, []);

	const loadClips = React.useCallback(async () => {
		if (mountedRef.current && !hasCachedClipPoolRef.current) {
			setIsInitialLoading(true);
		}

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
				aspectRatio:
					typeof post.width === "number" &&
					typeof post.height === "number" &&
					post.width > 0 &&
					post.height > 0
						? post.width / post.height
						: undefined,
			}));

			const clips: TrendingClip[] = (clipsData.clips ?? []).map((clip) => ({
				id: `clip-${clip.id}`,
				title: clip.songId ?? "Ride Clip",
				creatorName: clip.rider?.name ?? "Rider",
				creatorUsername: clip.rider?.username ?? "rider",
				thumbnail: clip.thumbnailUrl ?? clip.videoUrl,
				likes: Number(clip.likesCount ?? 0),
				comments: Number(clip.commentsCount ?? 0),
				shares: Number(clip.sharesCount ?? 0),
				createdAt: clip.createdAt,
				likedByMe: Boolean(clip.likedByMe),
				type: "clip" as const,
				mediaType: "video",
				aspectRatio: DEFAULT_CLIP_ASPECT,
			}));

			const merged = [...posts, ...clips].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime(),
			);

			const baseAspects = buildAspectMap(merged);
			prefetchExploreMedia(merged);

			React.startTransition(() => {
				setClipPool(merged);
				setClipAspects(baseAspects);
			});
			hasCachedClipPoolRef.current = merged.length > 0;
			exploreCache = { clipPool: merged, clipAspects: baseAspects };

			void hydrateClipAspects(merged).then((resolvedAspects) => {
				if (!mountedRef.current) {
					return;
				}

				setClipAspects(resolvedAspects);
				exploreCache = { clipPool: merged, clipAspects: resolvedAspects };
			});
		} catch {
			if (mountedRef.current) {
				setClipPool([]);
				setClipAspects(new Map());
			}
		} finally {
			if (mountedRef.current) {
				setIsInitialLoading(false);
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
		const byId = new Map<string, SuggestedUser>();

		clipPool.forEach((clip) => {
			const key = clip.creatorUsername || clip.creatorName;
			if (!key || byId.has(key)) {
				return;
			}

			byId.set(
				key,
				toSuggestedUser({
					id: key,
					username: clip.creatorUsername,
					name: clip.creatorName,
					avatar: clip.thumbnail,
				}),
			);
		});

		const list = Array.from(byId.values());
		if (!normalizedQuery) {
			return sortUsersByQuery(list, "").slice(0, 12);
		}

		return sortUsersByQuery(
			list.filter((user) => rankUserMatch(user, normalizedQuery) !== Infinity),
			normalizedQuery,
		).slice(0, 12);
	}, [clipPool, normalizedQuery]);

	React.useEffect(() => {
		if (!normalizedQuery) {
			setRemoteSearchResults([]);
			setIsSearchLoading(false);
			return;
		}

		setIsSearchLoading(true);
		searchRequestIdRef.current += 1;
		const requestId = searchRequestIdRef.current;

		if (searchAbortRef.current) {
			clearTimeout(searchAbortRef.current);
		}

		searchAbortRef.current = setTimeout(() => {
			ProfileService.searchRiders(normalizedQuery)
				.then((res) => {
					if (!mountedRef.current || requestId !== searchRequestIdRef.current) {
						return;
					}

					setRemoteSearchResults(
						(res.users ?? []).map((user) =>
							toSuggestedUser({
								id: user.id,
								username: user.username,
								name: user.name,
								avatar: user.profileImageUrl ?? "",
								followersCount: user.followersCount ?? 0,
							}),
						),
					);
				})
				.catch(() => {
					if (mountedRef.current && requestId === searchRequestIdRef.current) {
						setRemoteSearchResults([]);
					}
				})
				.finally(() => {
					if (mountedRef.current && requestId === searchRequestIdRef.current) {
						setIsSearchLoading(false);
					}
				});
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			if (searchAbortRef.current) {
				clearTimeout(searchAbortRef.current);
			}
		};
	}, [normalizedQuery]);

	const searchResults = React.useMemo(() => {
		if (!normalizedQuery) {
			return users;
		}

		const merged = new Map<string, SuggestedUser>();
		[...users, ...remoteSearchResults].forEach((user) => {
			const key = user.id || user.username;
			if (!key) {
				return;
			}

			if (!merged.has(key)) {
				merged.set(key, user);
			}
		});

		return sortUsersByQuery(
			Array.from(merged.values()).filter(
				(user) => rankUserMatch(user, normalizedQuery) !== Infinity,
			),
			normalizedQuery,
		).slice(0, 20);
	}, [normalizedQuery, remoteSearchResults, users]);

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

		return clipPool.filter((clip) => {
			const text = [
				clip.title,
				clip.creatorName,
				clip.creatorUsername,
			]
				.join(" ")
				.toLowerCase();
			return text.includes(normalizedQuery);
		});
	}, [clipPool, normalizedQuery]);

	const visibleClips = React.useMemo(
		() => clips.slice(0, visibleSections * CLIPS_PER_SECTION),
		[clips, visibleSections],
	);

	const gridSections = React.useMemo(() => {
		if (visibleClips.length === 0) {
			return [];
		}

		const sectionCount = Math.ceil(visibleClips.length / CLIPS_PER_SECTION);

		return Array.from({ length: sectionCount }, (_, index) => {
			const sectionStart = index * CLIPS_PER_SECTION;
			const first = visibleClips[sectionStart];
			const second = visibleClips[sectionStart + 1] ?? visibleClips[sectionStart];
			const third =
				visibleClips[sectionStart + 2] ??
				visibleClips[sectionStart + 1] ??
				visibleClips[sectionStart];
			const fourth = visibleClips[sectionStart + 3];
			const layout: ExploreGridSection["layout"] = normalizedQuery
				? index % 2 === 0
					? "large-small-large"
					: "small-large-small"
				: "large-small-large";

			return {
				id: `section-${index}-${normalizedQuery || "all"}`,
				layout,
				heroTop: first,
				smallLeft: second,
				smallRight: third,
				heroBottom: fourth,
			};
		});
	}, [normalizedQuery, visibleClips]);

	const totalSections = Math.ceil(clips.length / CLIPS_PER_SECTION);
	const hasMoreClips = visibleClips.length < clips.length;

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
		}, 120);

		return () => clearTimeout(timer);
	}, [normalizedQuery]);

	React.useEffect(() => {
		setVisibleSections(INITIAL_SECTIONS);
		setIsLoadingMore(false);
	}, [normalizedQuery]);

	return {
		query,
		users,
		searchResults,
		rooms,
		clips,
		visibleClips,
		isInitialLoading,
		gridSections,
		clipAspects,
		hasMoreClips,
		isLoadingMore,
		refreshing,
		isSearching,
		isSearchLoading,
		loadMoreClips,
		onRefresh,
		setQuery,
		clearSearch,
	};
}
