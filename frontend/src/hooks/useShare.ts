import React from 'react';
import { Platform, Share } from 'react-native';
import ShareService from '../services/ShareService';
import { ShareTargetType, ShareUser } from '../types/interactions';

const FALLBACK_USERS: ShareUser[] = [
  { id: 'u1', name: 'Cameron W.', username: 'cameron_w', avatarUrl: 'https://i.pravatar.cc/120?img=21' },
  { id: 'u2', name: 'Annette Black', username: 'annette.black', avatarUrl: 'https://i.pravatar.cc/120?img=47' },
  { id: 'u3', name: 'Marvin Mc.', username: 'marvin_mckinney', avatarUrl: 'https://i.pravatar.cc/120?img=14' },
  { id: 'u4', name: 'Brooklyn S.', username: 'brooklyn.s', avatarUrl: 'https://i.pravatar.cc/120?img=63' },
  { id: 'u5', name: 'Devon Lane', username: 'devon_lane', avatarUrl: 'https://i.pravatar.cc/120?img=8' },
  { id: 'u6', name: 'Robert Fox', username: 'robert.fox', avatarUrl: 'https://i.pravatar.cc/120?img=56' },
  { id: 'u7', name: 'Jenny Wilson', username: 'jenny_wilson', avatarUrl: 'https://i.pravatar.cc/120?img=48' },
];

export function useShare(postId: string, postUrl?: string) {
  const [query, setQuery] = React.useState('');
  const [users, setUsers] = React.useState<ShareUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSharing, setIsSharing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getShareUsers = React.useCallback(async (searchValue = query) => {
    setIsLoading(true);
    setError(null);

    try {
      const serverUsers = await ShareService.fetchUsers(searchValue);
      setUsers(serverUsers);
    } catch {
      const normalizedQuery = searchValue.trim().toLowerCase();
      const filteredFallback = normalizedQuery.length
        ? FALLBACK_USERS.filter(
            (item) =>
              item.name.toLowerCase().includes(normalizedQuery) ||
              item.username.toLowerCase().includes(normalizedQuery),
          )
        : FALLBACK_USERS;

      setUsers(filteredFallback);
      setError('Unable to load share users from service. Showing sample users.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const shareToUser = React.useCallback(async (userId: string) => {
    setIsSharing(true);
    setError(null);

    try {
      await ShareService.sharePost({
        postId,
        targetType: 'user',
        targetId: userId,
      });
      return true;
    } catch {
      setError('Could not share post to selected user.');
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [postId]);

  const shareToAction = React.useCallback(async (targetType: ShareTargetType) => {
    setIsSharing(true);
    setError(null);

    try {
      await ShareService.sharePost({ postId, targetType });
      return true;
    } catch {
      setError('Could not complete share action.');
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [postId]);

  const copyLink = React.useCallback(async () => {
    const normalizedPostUrl = postUrl ?? `https://riderscompanion.app/posts/${postId}`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(normalizedPostUrl);
      return true;
    }

    await Share.share({ message: normalizedPostUrl });
    return false;
  }, [postId, postUrl]);

  React.useEffect(() => {
    void getShareUsers('');
  }, [getShareUsers]);

  return {
    query,
    setQuery,
    users,
    isLoading,
    isSharing,
    error,
    getShareUsers,
    shareToUser,
    shareToAction,
    copyLink,
  };
}
