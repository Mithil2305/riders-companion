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
  gridSections: ExploreGridSection[];
  hasMoreClips: boolean;
  isLoadingMore: boolean;
  isSearching: boolean;
  loadMoreClips: () => void;
  setQuery: (value: string) => void;
}

const INITIAL_SECTIONS = 2;
const SECTIONS_PER_PAGE = 2;
const CLIPS_PER_SECTION = 4;

export function useExploreData(): UseExploreDataResult {
  const [query, setQuery] = React.useState('');
  const [visibleSections, setVisibleSections] = React.useState(INITIAL_SECTIONS);
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
      const third = clips[sectionStart + 2] ?? clips[sectionStart + 1] ?? clips[sectionStart];
      const fourth = clips[sectionStart + 3];

      return {
        id: `section-${index}-${normalizedQuery || 'all'}`,
        layout: normalizedQuery ? (index % 2 === 0 ? 'large-small-large' : 'small-large-small') : 'large-small-large',
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
      setVisibleSections((current) => Math.min(current + SECTIONS_PER_PAGE, totalSections));
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
