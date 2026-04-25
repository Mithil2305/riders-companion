import { Alert, Linking, Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import FeedService from "./FeedService";
import ClipService from "./ClipService";
import ProfileService from "./ProfileService";
import TrackerService from "./TrackerService";
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
	likesCount?: number;
	likedByMe?: boolean;
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
	likesCount?: number;
	likedByMe?: boolean;
	rider?: {
		id?: string;
		name?: string;
		username?: string;
		profileImageUrl?: string;
	};
};

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=11";

type TrackerUserRecord = {
	id?: unknown;
	name?: unknown;
	username?: unknown;
	avatar?: unknown;
	profileImageUrl?: unknown;
};

const normalizeUsername = (value: string) => value.trim().replace(/^@+/, "");

const getShareUrl = (postUrl: string | undefined, resourceId?: string | null) => {
	if (postUrl && postUrl.trim().length > 0) {
		return postUrl;
	}

	if (resourceId && resourceId.trim().length > 0) {
		return `https://riders-companion.app/share/${resourceId}`;
	}

	return "https://riders-companion.app";
};

const toShareUserFromTracker = (value: unknown): ShareUser | null => {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as TrackerUserRecord;
	if (typeof record.id !== "string" || record.id.trim().length === 0) {
		return null;
	}

	const rawUsername =
		typeof record.username === "string" && record.username.trim().length > 0
			? normalizeUsername(record.username)
			: "";
	const normalizedId = record.id.trim();

	return {
		id: normalizedId,
		name:
			typeof record.name === "string" && record.name.trim().length > 0
				? record.name
				: rawUsername || "Rider",
		username: rawUsername || normalizedId,
		avatarUrl:
			typeof record.avatar === "string" && record.avatar.trim().length > 0
				? record.avatar
				: typeof record.profileImageUrl === "string" &&
					  record.profileImageUrl.trim().length > 0
				? record.profileImageUrl
				: DEFAULT_AVATAR,
	};
};

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
		createdAt: item.createdAt,
		timeLabel: formatRelativeTime(item.createdAt),
		likedByMe: Boolean(item.likedByMe),
		likeCount: Number(item.likesCount ?? 0),
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
			const data = await FeedService.getComments(contentId);
			return data.comments.map(toCommentModel);
		}

		const data = await ClipService.getComments(contentId);
		return data.comments.map(toCommentModel);
	}

	async addComment(
		contentType: InteractionContentType,
		contentId: string,
		commentText: string,
		_currentUsername?: string,
		_currentUserAvatarUrl?: string,
	) {
		const trimmed = commentText.trim();
		if (trimmed.length === 0) {
			throw new Error("Comment cannot be empty");
		}

		if (contentType === "feed") {
			await FeedService.commentOnPost(contentId, trimmed);
			return;
		}

		await ClipService.commentOnClip(contentId, trimmed);
	}

	async editComment(
		contentType: InteractionContentType,
		contentId: string,
		commentId: string,
		commentText: string,
	) {
		const trimmed = commentText.trim();
		if (trimmed.length === 0) {
			throw new Error("Comment cannot be empty");
		}

		if (contentType === "feed") {
			const response = await FeedService.updateComment(contentId, commentId, trimmed);
			return toCommentModel(response.comment);
		}

		const response = await ClipService.updateComment(contentId, commentId, trimmed);
		return toCommentModel(response.comment);
	}

	async deleteComment(
		contentType: InteractionContentType,
		contentId: string,
		commentId: string,
	) {
		if (contentType === "feed") {
			await FeedService.deleteComment(contentId, commentId);
			return;
		}

		await ClipService.deleteComment(contentId, commentId);
	}

	async toggleCommentLike(
		contentType: InteractionContentType,
		contentId: string,
		commentId: string,
		shouldLike: boolean,
	) {
		if (contentType !== "feed") {
			return null;
		}

		const response = shouldLike
			? await FeedService.likeComment(contentId, commentId)
			: await FeedService.unlikeComment(contentId, commentId);

		return {
			likedByMe: shouldLike,
			likeCount: response.likesCount,
		};
	}

	async getShareUsers(query: string = ""): Promise<ShareUser[]> {
		const users = new Map<string, ShareUser>();

		try {
			const profileData = await ProfileService.getMyProfile();
			const riderId = profileData.profile.id;
			if (riderId) {
				const [followersData, followingData] = await Promise.allSettled([
					TrackerService.getFollowers(riderId),
					TrackerService.getFollowing(riderId),
				]);

				if (followersData.status === "fulfilled") {
					followersData.value.followers
						.map(toShareUserFromTracker)
						.filter((item): item is ShareUser => item != null)
						.forEach((item) => users.set(item.id, item));
				}

				if (followingData.status === "fulfilled") {
					followingData.value.following
						.map(toShareUserFromTracker)
						.filter((item): item is ShareUser => item != null)
						.forEach((item) => users.set(item.id, item));
				}
			}
		} catch {
			// Fall back to feed/clips sourced users below.
		}

		const [feedData, clipsData] = await Promise.allSettled([
			FeedService.getFeed(),
			ClipService.getClips(),
		]);

		if (feedData.status === "fulfilled") {
			feedData.value.posts.forEach((post) => {
				const riderId = post.rider?.id;
				if (!riderId || users.has(riderId)) {
					return;
				}
				const username = normalizeUsername(post.rider?.username ?? post.rider?.name ?? riderId);

				users.set(riderId, {
					id: riderId,
					name: post.rider?.name ?? username,
					username,
					avatarUrl: post.rider?.profileImageUrl ?? DEFAULT_AVATAR,
				});
			});
		}

		if (clipsData.status === "fulfilled") {
			clipsData.value.clips.forEach((clip) => {
				const riderId = clip.rider?.id;
				if (!riderId || users.has(riderId)) {
					return;
				}
				const username = normalizeUsername(clip.rider?.username ?? clip.rider?.name ?? riderId);

				users.set(riderId, {
					id: riderId,
					name: clip.rider?.name ?? username,
					username,
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
					normalizeUsername(user.username).toLowerCase().includes(normalizedQuery),
			)
			.slice(0, 24);
	}

	async shareToUser(userId: string, resourceUrl?: string, username?: string) {
		const displayUsername = normalizeUsername(username ?? userId);
		const message = resourceUrl
			? `Shared with @${displayUsername}. Open chat and paste this link:\n${resourceUrl}`
			: `Shared with @${displayUsername}.`;
		Alert.alert("Share ready", message);
	}

	async shareToAction(target: ShareTargetType, postUrl?: string, resourceId?: string | null) {
		const url = getShareUrl(postUrl, resourceId);
		const encodedUrl = encodeURIComponent(url);
		const shareMessage = `Check this out on Rider's Companion: ${url}`;

		if (target === "message") {
			await Share.share({ message: shareMessage, url });
			return;
		}

		if (target === "story") {
			await Share.share({ message: `Ride highlight: ${url}`, url });
			return;
		}

		if (target === "facebook") {
			const appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(
				`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
			)}`;
			const webUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
			const canOpenApp = await Linking.canOpenURL(appUrl);
			await Linking.openURL(canOpenApp ? appUrl : webUrl);
			return;
		}

		if (target === "twitter") {
			const tweetText = encodeURIComponent("Check this ride out on Rider's Companion");
			const appUrl = `twitter://post?message=${tweetText}%20${encodedUrl}`;
			const webUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}`;
			const canOpenApp = await Linking.canOpenURL(appUrl);
			await Linking.openURL(canOpenApp ? appUrl : webUrl);
			return;
		}

		if (target === "whatsapp") {
			const text = encodeURIComponent(`Check this ride out on Rider's Companion: ${url}`);
			const appUrl = `whatsapp://send?text=${text}`;
			const webUrl = `https://wa.me/?text=${text}`;
			const canOpenApp = await Linking.canOpenURL(appUrl);
			await Linking.openURL(canOpenApp ? appUrl : webUrl);
		}
	}

	async copyLink(postUrl?: string, resourceId?: string | null) {
		const url = getShareUrl(postUrl, resourceId);

		if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
			await navigator.clipboard.writeText(url);
		} else {
			await Clipboard.setStringAsync(url);
		}

		Alert.alert("Copied", "Share link copied to clipboard.");
	}
}

export default new InteractionService();
