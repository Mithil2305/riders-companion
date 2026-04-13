import { useMemo } from 'react';
import { communityMockData } from '../utils/mocks/community';

export function useCommunityData() {
  return useMemo(() => communityMockData, []);
}
