import React from 'react';
import { ExploreGridSection, SuggestedRoom, SuggestedUser, TrendingClip } from '../types/explore';
import {
  mockSuggestedRooms,
  mockSuggestedUsers,
  mockTrendingClips,
} from '../utils/mocks/explore';

interface UseExploreDataResult {
  query: string;
  users: SuggestedUser[];
  rooms: SuggestedRoom[];
  clips: TrendingClip[];
  visibleClips: TrendingClip[];
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
  const [query, setQuery] = React.useState('');
  const [visibleClipCount, setVisibleClipCount] = React.useState(INITIAL_CLIPS);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const clipPool = React.useMemo(() => mockTrendingClips, []);

  const users = React.useMemo(() => {
    if (!normalizedQuery) {
      return mockSuggestedUsers;
    }

    return mockSuggestedUsers.filter((user) =>
      user.name.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const rooms = React.useMemo(() => {
    if (!normalizedQuery) {
      return mockSuggestedRooms;
    }

    return mockSuggestedRooms.filter((room) =>
      room.name.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const filteredClips = React.useMemo(() => {
    if (!normalizedQuery) {
      return clipPool;
    }

    return clipPool.filter((clip) =>
      clip.title.toLowerCase().includes(normalizedQuery),
    );
  }, [clipPool, normalizedQuery]);

  const clips = React.useMemo(
    () => shuffleArray(filteredClips),
    [filteredClips],
  );

  const visibleClips = React.useMemo(
    () => clips.slice(0, visibleClipCount),
    [clips, visibleClipCount],
  );

  const gridSections = React.useMemo<ExploreGridSection[]>(() => {
    if (visibleClips.length === 0) {
      return [];
    }

    const maxSectionsFromResults = Math.ceil(visibleClips.length / CLIPS_PER_SECTION);
    const sectionCount = maxSectionsFromResults;

    return Array.from({ length: sectionCount }, (_, index) => {
      const sectionStart = index * CLIPS_PER_SECTION;
      const first = visibleClips[sectionStart];
      const second = visibleClips[sectionStart + 1] ?? visibleClips[sectionStart];
      const third = visibleClips[sectionStart + 2] ?? visibleClips[sectionStart + 1] ?? visibleClips[sectionStart];
      const fourth = visibleClips[sectionStart + 3];

      return {
        id: `section-${index}-${normalizedQuery || 'all'}`,
        layout: Math.random() > 0.5 ? 'large-small-large' : 'small-large-small',
        heroTop: first,
        smallLeft: second,
        smallRight: third,
        heroBottom: fourth,
      };
    });
  }, [normalizedQuery, visibleClips]);

  const hasMoreClips = visibleClipCount < clips.length;

  const loadMoreClips = React.useCallback(() => {
    if (isLoadingMore || !hasMoreClips) {
      return;
    }

    setIsLoadingMore(true);

    requestAnimationFrame(() => {
      setVisibleClipCount((current) => Math.min(current + CLIPS_PER_PAGE, clips.length));
      setIsLoadingMore(false);
    });
  }, [clips.length, hasMoreClips, isLoadingMore]);

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
    setVisibleClipCount(INITIAL_CLIPS);
    setIsLoadingMore(false);
  }, [normalizedQuery]);

  return {
    query,
    users,
    rooms,
    clips,
    visibleClips,
    gridSections,
    hasMoreClips,
    isLoadingMore,
    isSearching,
    loadMoreClips,
    setQuery,
  };
}
