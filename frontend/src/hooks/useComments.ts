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

	const loadComments = React.useCallback(async () => {
		if (!enabled || !contentId) {
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
			setComments((current) => [created, ...current]);
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
	]);

	const likeComment = React.useCallback((commentId: string) => {
		setComments((current) =>
			current.map((comment) => {
				if (comment.id !== commentId) {
					return comment;
				}

				const nextLiked = !comment.likedByMe;
				return {
					...comment,
					likedByMe: nextLiked,
					likeCount: Math.max(0, comment.likeCount + (nextLiked ? 1 : -1)),
				};
			}),
		);
	}, []);

	const editComment = React.useCallback(async (commentId: string, newContent: string) => {
		const trimmed = newContent.trim();
		if (trimmed.length === 0) {
			throw new Error("Comment cannot be empty");
		}

		// TODO: Replace with actual API call when endpoints are provided
		// await InteractionService.editComment(contentType, contentId, commentId, trimmed);

		setComments((current) =>
			current.map((comment) => {
				if (comment.id !== commentId) {
					return comment;
				}
				return { ...comment, content: trimmed };
			}),
		);
	}, [contentId, contentType]);

	const deleteComment = React.useCallback(async (commentId: string) => {
		// TODO: Replace with actual API call when endpoints are provided
		// await InteractionService.deleteComment(contentType, contentId, commentId);

		setComments((current) => current.filter((comment) => comment.id !== commentId));
	}, [contentId, contentType]);

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
	};
}
