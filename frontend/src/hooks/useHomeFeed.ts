import React from 'react';
import { FeedPostItem, Story } from '../types/feed';
import { mockPosts, mockStories } from '../utils/mocks/feed';

interface UseHomeFeedResult {
  loading: boolean;
  refreshing: boolean;
  posts: FeedPostItem[];
  stories: Story[];
  likedPostIds: Record<string, boolean>;
  onRefresh: () => Promise<void>;
  toggleLike: (postId: string) => void;
}

export function useHomeFeed(): UseHomeFeedResult {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [posts] = React.useState<FeedPostItem[]>(mockPosts);
  const [stories] = React.useState<Story[]>(mockStories);
  const [likedPostIds, setLikedPostIds] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });
    setRefreshing(false);
  }, []);

  const toggleLike = React.useCallback((postId: string) => {
    setLikedPostIds((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  }, []);

  return {
    loading,
    refreshing,
    posts,
    stories,
    likedPostIds,
    onRefresh,
    toggleLike,
  };
}
