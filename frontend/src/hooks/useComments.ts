import React from "react";
import InteractionService from "../services/InteractionService";
import { CommentModel, InteractionContentType } from "../types/interactions";

type UseCommentsOptions = {
	currentUsername?: string;
	currentUserAvatarUrl?: string;
	contentType?: InteractionContentType;
	enabled?: boolean;
};

export function useComments(contentId: string, options: UseCommentsOptions = {}) {
	const {
		currentUsername,
		currentUserAvatarUrl,
		contentType = "feed",
		enabled = true,
	} = options;

	const [comments, setComments] = React.useState<CommentModel[]>([]);
	const [draft, setDraft] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [replyingTo, setReplyingTo] = React.useState<CommentModel | null>(null);

	const loadComments = React.useCallback(async () => {
		if (!enabled || !contentId) {
			setComments([]);
			return;
		}

		setIsLoading(true);
		try {
			const data = await InteractionService.getComments(contentType, contentId);
			setComments(data);
		} catch {
			setComments([]);
		} finally {
			setIsLoading(false);
		}
	}, [contentId, contentType, enabled]);

	React.useEffect(() => {
		void loadComments();
	}, [loadComments]);

	const addComment = React.useCallback(async () => {
		if (isSubmitting || draft.trim().length === 0) {
			return;
		}

		setIsSubmitting(true);
		try {
			const created = await InteractionService.addComment(
				contentType,
				contentId,
				draft,
				currentUsername,
				currentUserAvatarUrl,
			);

			if (replyingTo) {
				// Add as reply to parent comment
				const replyWithParent = { ...created, parentId: replyingTo.id };
				setComments((current) =>
					current.map((comment) => {
						if (comment.id === replyingTo.id) {
							return {
								...comment,
								replies: [...(comment.replies || []), replyWithParent],
								replyCount: (comment.replyCount || 0) + 1,
							};
						}
						return comment;
					}),
				);
				setReplyingTo(null);
			} else {
				setComments((current) => [created, ...current]);
			}
			setDraft("");
		} finally {
			setIsSubmitting(false);
		}
	}, [
		contentId,
		contentType,
		currentUserAvatarUrl,
		currentUsername,
		draft,
		isSubmitting,
		replyingTo,
	]);

	const likeComment = React.useCallback((commentId: string) => {
		const targetComment = comments.find((comment) => comment.id === commentId);
		if (!targetComment) {
			return;
		}

		const nextLiked = !targetComment.likedByMe;
		const previousLikeCount = targetComment.likeCount;
		const previousLiked = targetComment.likedByMe;

		setComments((current) =>
			current.map((comment) =>
				comment.id === commentId
					? {
							...comment,
							likedByMe: nextLiked,
							likeCount: Math.max(
								0,
								comment.likeCount + (nextLiked ? 1 : -1),
							),
						}
					: comment,
			),
		);

		void (async () => {
			try {
				const result = await InteractionService.toggleCommentLike(
					contentType,
					contentId,
					commentId,
					nextLiked,
				);
				if (!result) {
					return;
				}

				setComments((current) =>
					current.map((comment) =>
						comment.id === commentId
							? {
									...comment,
									likedByMe: result.likedByMe,
									likeCount: result.likeCount,
								}
							: comment,
					),
				);
			} catch {
				setComments((current) =>
					current.map((comment) =>
						comment.id === commentId
							? {
									...comment,
									likedByMe: previousLiked,
									likeCount: previousLikeCount,
								}
							: comment,
					),
				);
			}
		})();
	}, [comments, contentId, contentType]);

	const editComment = React.useCallback(
		async (commentId: string, newContent: string) => {
			const updatedComment = await InteractionService.editComment(
				contentType,
				contentId,
				commentId,
				newContent,
			);

			setComments((current) =>
				current.map((comment) =>
					comment.id === commentId ? updatedComment : comment,
				),
			);
		},
		[contentId, contentType],
	);

	const deleteComment = React.useCallback(
		async (commentId: string) => {
			await InteractionService.deleteComment(contentType, contentId, commentId);
			setComments((current) => current.filter((comment) => comment.id !== commentId));
		},
		[contentId, contentType],
	);

	const addReply = React.useCallback((parentComment: CommentModel) => {
		setReplyingTo(parentComment);
		setDraft(`@${parentComment.author.username} `);
	}, []);

	const cancelReply = React.useCallback(() => {
		setReplyingTo(null);
		setDraft("");
	}, []);

	return {
		comments,
		draft,
		setDraft,
		isLoading,
		isSubmitting,
		addComment,
		likeComment,
		editComment,
		deleteComment,
		reload: loadComments,
		replyingTo,
		addReply,
		cancelReply,
	};
}
