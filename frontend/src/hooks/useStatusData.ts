import React from 'react';
import { StatusEntry } from '../types/status';

const myStatus: StatusEntry = {
  id: 'mine',
  name: 'My Status',
  time: '2 hours ago',
  avatar: 'https://i.pravatar.cc/200?img=12',
  ringType: 'none',
};

const recentUpdates: StatusEntry[] = [
  {
    id: 'recent-1',
    name: 'Alex Johnson',
    time: '30 minutes ago',
    avatar: 'https://i.pravatar.cc/200?img=17',
    ringType: 'new',
  },
];

const viewedUpdates: StatusEntry[] = [
  {
    id: 'viewed-1',
    name: 'Riya Kapoor',
    time: '3 hours ago',
    avatar: 'https://i.pravatar.cc/200?img=25',
    ringType: 'viewed',
  },
];

const mutedUpdates: StatusEntry[] = [
  {
    id: 'muted-1',
    name: 'Night Riders',
    time: 'Yesterday',
    avatar: 'https://i.pravatar.cc/200?img=35',
    ringType: 'muted',
  },
];

export function useStatusData() {
  const [isViewedCollapsed, setViewedCollapsed] = React.useState(true);
  const [isMutedCollapsed, setMutedCollapsed] = React.useState(true);

  const toggleViewed = React.useCallback(() => {
    setViewedCollapsed((prev) => !prev);
  }, []);

  const toggleMuted = React.useCallback(() => {
    setMutedCollapsed((prev) => !prev);
  }, []);

  return {
    myStatus,
    recentUpdates,
    viewedUpdates,
    mutedUpdates,
    isViewedCollapsed,
    isMutedCollapsed,
    toggleViewed,
    toggleMuted,
  };
}
