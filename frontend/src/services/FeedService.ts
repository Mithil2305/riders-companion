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
	createdAt: string;
	rider?: FeedAuthorPayload;
	likesCount: number;
	commentsCount: number;
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

class FeedService {
	async getFeed(_page: number = 1, _limit: number = 20) {
		return apiRequest<{ posts: FeedPostPayload[] }>("/feed");
	}

	async createPost(payload: CreatePostPayload) {
		return apiRequest("/feed", {
			method: "POST",
			body: payload,
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
		return apiRequest<{ commentsCount: number }>(`/feed/${postId}/comments`, {
			method: "POST",
			body: { commentText },
		});
	}
}

export default new FeedService();
