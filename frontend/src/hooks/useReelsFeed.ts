import React from 'react';
import { ReelItem } from '../types/reels';
import { mockReels } from '../utils/mocks/reels';

interface UseReelsFeedResult {
  reels: ReelItem[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export function useReelsFeed(): UseReelsFeedResult {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return {
    reels: mockReels,
    activeIndex,
    setActiveIndex,
  };
}
