import React from "react";
import {
	ExploreGridSection,
	SuggestedRoom,
	SuggestedUser,
	TrendingClip,
} from "../types/explore";
import ClipService from "../services/ClipService";

interface UseExploreDataResult {
	query: string;
	users: SuggestedUser[];
	rooms: SuggestedRoom[];
	clips: TrendingClip[];
	gridSections: ExploreGridSection[];
	hasMoreClips: boolean;
	isLoadingMore: boolean;
	isSearching: boolean;
	loadMoreClips: () => void;
	setQuery: (value: string) => void;
}

const INITIAL_CLIPS = 18;
const CLIPS_PER_PAGE = 12;
const CLIPS_PER_SECTION = 4;

function shuffleArray<T>(input: T[]): T[] {
  const items = [...input];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

export function useExploreData(): UseExploreDataResult {
	const [query, setQuery] = React.useState("");
	const [visibleSections, setVisibleSections] =
		React.useState(INITIAL_SECTIONS);
	const [isLoadingMore, setIsLoadingMore] = React.useState(false);
	const [isSearching, setIsSearching] = React.useState(false);
	const [clipPool, setClipPool] = React.useState<TrendingClip[]>([]);

	const normalizedQuery = query.trim().toLowerCase();

	React.useEffect(() => {
		let mounted = true;

		const load = async () => {
			try {
				const data = await ClipService.getClips();
				if (!mounted) {
					return;
				}

				setClipPool(
					data.clips.map((clip) => ({
						id: clip.id,
						title: clip.songId ?? "Ride Clip",
						creatorName: clip.rider?.name ?? "Rider",
						creatorUsername: clip.rider?.username ?? "rider",
						thumbnail: clip.videoUrl,
						likes: Number(clip.likesCount ?? 0),
						comments: Number(clip.commentsCount ?? 0),
						shares: Number(clip.sharesCount ?? 0),
						createdAt: clip.createdAt,
						likedByMe: Boolean(clip.likedByMe),
					})),
				);
			} catch {
				if (mounted) {
					setClipPool([]);
				}
			}
		};

		void load();

		return () => {
			mounted = false;
		};
	}, []);

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
		isSearching,
		loadMoreClips,
		setQuery,
	};
}
