import React from 'react';
import CommentService from '../services/CommentService';
import { CommentModel } from '../types/interactions';

type UseCommentsOptions = {
  currentUsername?: string;
  currentUserAvatarUrl?: string;
};

const createFallbackComments = (postId: string): CommentModel[] => [
  {
    id: `${postId}-1`,
    postId,
    author: {
      id: 'alex-rider',
      username: 'alex_rider',
      avatarUrl: 'https://i.pravatar.cc/120?img=12',
    },
    content: 'Amazing shot! Where is this place?',
    timeLabel: '2h',
    likeCount: 12,
    likedByMe: false,
  },
  {
    id: `${postId}-2`,
    postId,
    author: {
      id: 'sarah-moto',
      username: 'sarah_moto',
      avatarUrl: 'https://i.pravatar.cc/120?img=5',
    },
    content: 'Love the view! 🏔️',
    timeLabel: '1h',
    likeCount: 8,
    likedByMe: true,
  },
  {
    id: `${postId}-3`,
    postId,
    author: {
      id: 'mike-tours',
      username: 'mike_tours',
      avatarUrl: 'https://i.pravatar.cc/120?img=15',
    },
    content: 'Perfect weather for riding!',
    timeLabel: '45m',
    likeCount: 5,
    likedByMe: false,
  },
];

export function useComments(postId: string, options: UseCommentsOptions = {}) {
  const [comments, setComments] = React.useState<CommentModel[]>([]);
  const [draft, setDraft] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const currentUsername = options.currentUsername ?? 'you';
  const currentUserAvatarUrl =
    options.currentUserAvatarUrl ?? 'https://i.pravatar.cc/120?img=32';

  const fetchComments = React.useCallback(
    async (targetPostId = postId) => {
      setIsLoading(true);
      setError(null);

      try {
        const serverComments = await CommentService.getComments(targetPostId);
        setComments(serverComments);
      } catch {
        setComments(createFallbackComments(targetPostId));
        setError('Unable to reach comments service. Showing sample comments.');
      } finally {
        setIsLoading(false);
      }
    },
    [postId],
  );

  const addComment = React.useCallback(async () => {
    const content = draft.trim();
    if (content.length === 0 || isSubmitting) {
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    const optimisticComment: CommentModel = {
      id: `local-${Date.now()}`,
      postId,
      author: {
        id: 'current-user',
        username: currentUsername,
        avatarUrl: currentUserAvatarUrl,
      },
      content,
      timeLabel: 'now',
      likeCount: 0,
      likedByMe: false,
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setDraft('');

    try {
      const created = await CommentService.postComment({ postId, content });
      setComments((prev) => prev.map((item) => (item.id === optimisticComment.id ? created : item)));
      return true;
    } catch {
      setComments((prev) => prev.filter((item) => item.id !== optimisticComment.id));
      setDraft(content);
      setError('Could not post comment. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUserAvatarUrl, currentUsername, draft, isSubmitting, postId]);

  const likeComment = React.useCallback(async (commentId: string) => {
    let previousComment: CommentModel | null = null;

    setComments((prev) =>
      prev.map((item) => {
        if (item.id !== commentId) {
          return item;
        }

        previousComment = item;
        const nextLikedByMe = !item.likedByMe;
        const delta = nextLikedByMe ? 1 : -1;

        return {
          ...item,
          likedByMe: nextLikedByMe,
          likeCount: Math.max(0, item.likeCount + delta),
        };
      }),
    );

    try {
      const updated = await CommentService.likeComment(commentId);
      setComments((prev) => prev.map((item) => (item.id === commentId ? updated : item)));
    } catch {
      const snapshot = previousComment;
      if (snapshot) {
        setComments((prev) => prev.map((item) => (item.id === commentId ? snapshot : item)));
      }
      setError('Could not update comment reaction.');
    }
  }, []);

  React.useEffect(() => {
    void fetchComments(postId);
  }, [fetchComments, postId]);

  return {
    comments,
    draft,
    setDraft,
    isLoading,
    isSubmitting,
    error,
    fetchComments,
    addComment,
    likeComment,
  };
}
