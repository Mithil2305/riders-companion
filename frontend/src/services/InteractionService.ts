import { Alert, Platform, Share } from "react-native";
import FeedService from "./FeedService";
import ClipService from "./ClipService";
import { apiRequest } from "./api";
import {
	CommentModel,
	InteractionContentType,
	ShareTargetType,
	ShareUser,
} from "../types/interactions";

type FeedCommentPayload = {
	id: string;
	commentText: string;
	createdAt: string;
	rider?: {
		id?: string;
		name?: string;
		username?: string;
		profileImageUrl?: string;
	};
};

type ClipCommentPayload = {
	id: string;
	commentText: string;
	createdAt: string;
	rider?: {
		id?: string;
		name?: string;
		username?: string;
		profileImageUrl?: string;
	};
};

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=11";

const formatRelativeTime = (isoDate: string): string => {
	const time = new Date(isoDate).getTime();
	if (Number.isNaN(time)) {
		return "now";
	}

	const diffMinutes = Math.max(1, Math.floor((Date.now() - time) / 60000));
	if (diffMinutes < 60) {
		return `${diffMinutes}m`;
	}

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return `${diffHours}h`;
	}

	return `${Math.floor(diffHours / 24)}d`;
};

const toCommentModel = (item: FeedCommentPayload | ClipCommentPayload): CommentModel => {
	const username = item.rider?.username ?? item.rider?.name ?? "rider";
	return {
		id: item.id,
		content: item.commentText,
		timeLabel: formatRelativeTime(item.createdAt),
		likedByMe: false,
		likeCount: 0,
		author: {
			id: item.rider?.id ?? username,
			name: item.rider?.name ?? username,
			username,
			avatarUrl: item.rider?.profileImageUrl ?? DEFAULT_AVATAR,
		},
	};
};

class InteractionService {
	async getComments(contentType: InteractionContentType, contentId: string) {
		if (contentType === "feed") {
			const data = await apiRequest<{ comments: FeedCommentPayload[] }>(
				`/feed/${contentId}/comments`,
			);
			return data.comments.map(toCommentModel);
		}

		const data = await apiRequest<{ comments: ClipCommentPayload[] }>(
			`/clips/${contentId}/comments`,
		);
		return data.comments.map(toCommentModel);
	}

	async addComment(
		contentType: InteractionContentType,
		contentId: string,
		commentText: string,
		currentUsername?: string,
		currentUserAvatarUrl?: string,
	) {
		const trimmed = commentText.trim();
		if (trimmed.length === 0) {
			throw new Error("Comment cannot be empty");
		}

		if (contentType === "feed") {
			await FeedService.commentOnPost(contentId, trimmed);
		} else {
			await apiRequest(`/clips/${contentId}/comments`, {
				method: "POST",
				body: { commentText: trimmed },
			});
		}

		const username = currentUsername?.trim() || "you";

		return {
			id: `${contentType}-${contentId}-${Date.now()}`,
			content: trimmed,
			timeLabel: "now",
			likeCount: 0,
			likedByMe: false,
			author: {
				id: "me",
				name: username,
				username,
				avatarUrl: currentUserAvatarUrl ?? DEFAULT_AVATAR,
			},
		} satisfies CommentModel;
	}

	async getShareUsers(query: string = ""): Promise<ShareUser[]> {
		const [feedData, clipsData] = await Promise.allSettled([
			FeedService.getFeed(),
			ClipService.getClips(),
		]);

		const users = new Map<string, ShareUser>();

		if (feedData.status === "fulfilled") {
			feedData.value.posts.forEach((post) => {
				const username = post.rider?.username ?? post.rider?.name;
				if (!username || users.has(username)) {
					return;
				}

				users.set(username, {
					id: username,
					name: post.rider?.name ?? username,
					username: `@${username}`,
					avatarUrl: post.rider?.profileImageUrl ?? DEFAULT_AVATAR,
				});
			});
		}

		if (clipsData.status === "fulfilled") {
			clipsData.value.clips.forEach((clip) => {
				const username = clip.rider?.username ?? clip.rider?.name;
				if (!username || users.has(username)) {
					return;
				}

				users.set(username, {
					id: username,
					name: clip.rider?.name ?? username,
					username: `@${username}`,
					avatarUrl: clip.rider?.profileImageUrl ?? DEFAULT_AVATAR,
				});
			});
		}

		const items = Array.from(users.values());
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) {
			return items.slice(0, 24);
		}

		return items
			.filter(
				(user) =>
					user.name.toLowerCase().includes(normalizedQuery) ||
					user.username.toLowerCase().includes(normalizedQuery),
			)
			.slice(0, 24);
	}

	async shareToUser(userId: string) {
		Alert.alert("Shared", `Post sent to @${userId}`);
	}

	async shareToAction(target: ShareTargetType, postUrl?: string) {
		const url = postUrl ?? "https://riders-companion.app/post";
		if (target === "message") {
			await Share.share({ message: `Check this out: ${url}` });
			return;
		}

		if (target === "story") {
			await Share.share({ message: `Adding to story: ${url}` });
			return;
		}

		if (target === "facebook") {
			await Share.share({ message: `Sharing to Facebook: ${url}` });
			return;
		}

		if (target === "twitter") {
			await Share.share({ message: `Sharing to Twitter: ${url}` });
			return;
		}

		if (target === "whatsapp") {
			await Share.share({ message: `Sharing to WhatsApp: ${url}` });
		}
	}

	async copyLink(postUrl?: string) {
		const url = postUrl ?? "https://riders-companion.app/post";

		if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
			await navigator.clipboard.writeText(url);
			Alert.alert("Copied", "Post link copied to clipboard.");
			return;
		}

		await Share.share({ message: url });
	}
}

export default new InteractionService();
