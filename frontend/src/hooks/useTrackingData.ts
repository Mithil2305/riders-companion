import React from 'react';
import { TrackerUser } from '../types/profile';
import { mockFollowers, mockFollowing } from '../utils/mocks/tracking';

export type TrackingTabKey = 'followers' | 'following';

interface UseTrackingDataResult {
  loading: boolean;
  activeTab: TrackingTabKey;
  followers: TrackerUser[];
  following: TrackerUser[];
  setActiveTab: (nextTab: TrackingTabKey) => void;
  toggleFollowState: (userId: string) => void;
}

export function useTrackingData(initialTab: TrackingTabKey): UseTrackingDataResult {
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TrackingTabKey>(initialTab);
  const [followers, setFollowers] = React.useState<TrackerUser[]>(mockFollowers);
  const [following, setFollowing] = React.useState<TrackerUser[]>(mockFollowing);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const toggleFollowState = React.useCallback((userId: string) => {
    setFollowers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user,
      ),
    );

    setFollowing((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user,
      ),
    );
  }, []);

  return {
    loading,
    activeTab,
    followers,
    following,
    setActiveTab,
    toggleFollowState,
  };
}
