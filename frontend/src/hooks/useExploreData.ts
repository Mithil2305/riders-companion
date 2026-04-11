import React from 'react';
import { SuggestedRoom, SuggestedUser, TrendingClip } from '../types/explore';
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
  setQuery: (value: string) => void;
}

export function useExploreData(): UseExploreDataResult {
  const [query, setQuery] = React.useState('');

  const normalizedQuery = query.trim().toLowerCase();

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
      return mockTrendingClips;
    }

    return mockTrendingClips.filter((clip) =>
      clip.title.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  return {
    query,
    users,
    rooms,
    clips,
    setQuery,
  };
}
