import { apiRequest } from "./api";

export interface FeedAuthorPayload {
	id?: string;
	name?: string;
	username?: string;
	profileImageUrl?: string;
}

export interface FeedPostPayload {
	id: string;
	caption: string | null;
	mediaUrl: string | null;
	mediaType: string | null;
	width?: number | null;
	height?: number | null;
	createdAt: string;
	rider?: FeedAuthorPayload;
	likesCount: number;
	commentsCount: number;
	likedByMe?: boolean;
}

export interface CommentPayload {
	id: string;
	commentText: string;
	createdAt: string;
	rider?: FeedAuthorPayload;
	likesCount?: number;
	likedByMe?: boolean;
}

interface CreatePostPayload {
	title?: string;
	caption: string;
	mediaData?: string;
	mediaBase64?: string;
	mediaUrl?: string;
	mediaMimeType?: string;
	hashtags?: string[];
}

type FeedResponse = { posts: FeedPostPayload[] };

const FEED_CACHE_TTL_MS = 30_000;

let feedCache: { data: FeedResponse; fetchedAt: number } | null = null;
let feedInFlight: Promise<FeedResponse> | null = null;

class FeedService {
	peekFeedCache() {
		return feedCache?.data ?? null;
	}

	clearFeedCache() {
		feedCache = null;
		feedInFlight = null;
	}

	async preloadFeed() {
		try {
			await this.getFeed();
		} catch {
			// Best-effort warmup.
		}
	}

	async getFeed(_page: number = 1, _limit: number = 20) {
		const now = Date.now();
		if (feedCache && now - feedCache.fetchedAt < FEED_CACHE_TTL_MS) {
			return feedCache.data;
		}

		if (feedInFlight) {
			return feedInFlight;
		}

		feedInFlight = apiRequest<FeedResponse>("/feed")
			.then((data) => {
				feedCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				feedInFlight = null;
			});

		return feedInFlight;
	}

	async createPost(payload: CreatePostPayload) {
		return apiRequest("/feed", {
			method: "POST",
			body: payload,
			timeoutMs: 15 * 60 * 1000,
			allowRetryOnTimeout: false,
		});
	}

	async getPostById(postId: string) {
		return apiRequest<{ post: FeedPostPayload }>(`/feed/${postId}`);
	}

	async updatePost(postId: string, payload: { caption: string }) {
		return apiRequest<{ post: FeedPostPayload }>(`/feed/${postId}`, {
			method: "PATCH",
			body: payload,
		});
	}

	async deletePost(postId: string) {
		return apiRequest<{ postId: string }>(`/feed/${postId}`, {
			method: "DELETE",
		});
	}

	async likePost(postId: string) {
		return apiRequest<{ postId: string; liked: boolean; likesCount: number }>(
			`/feed/${postId}/likes`,
			{
				method: "POST",
			},
		);
	}

	async unlikePost(postId: string) {
		return apiRequest<{ postId: string; liked: boolean; likesCount: number }>(
			`/feed/${postId}/likes`,
			{
				method: "DELETE",
			},
		);
	}

	async commentOnPost(postId: string, commentText: string) {
		return apiRequest<{ commentsCount: number; comment?: CommentPayload }>(`/feed/${postId}/comments`, {
			method: "POST",
			body: { commentText },
		});
	}

	async getComments(postId: string, _page: number = 1, _limit: number = 20) {
		return apiRequest<{ comments: CommentPayload[] }>(`/feed/${postId}/comments`);
	}

	async likeComment(postId: string, commentId: string) {
		return apiRequest<{ commentId: string; liked: boolean; likesCount: number }>(`/feed/${postId}/comments/${commentId}/likes`, {
			method: "POST"
		});
	}

	async unlikeComment(postId: string, commentId: string) {
		return apiRequest<{ commentId: string; liked: boolean; likesCount: number }>(`/feed/${postId}/comments/${commentId}/likes`, {
			method: "DELETE"
		});
	}

	async updateComment(postId: string, commentId: string, commentText: string) {
		return apiRequest<{ postId: string; comment: CommentPayload }>(
			`/feed/${postId}/comments/${commentId}`,
			{
				method: "PATCH",
				body: { commentText },
			},
		);
	}

	async deleteComment(postId: string, commentId: string) {
		return apiRequest<{ postId: string; commentId: string; commentsCount: number }>(
			`/feed/${postId}/comments/${commentId}`,
			{
				method: "DELETE",
			},
		);
	}
}

export default new FeedService();
