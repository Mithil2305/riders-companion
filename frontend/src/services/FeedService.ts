import { apiRequest } from "./api";

class FeedService {
	async getFeed(_page: number = 1, _limit: number = 20) {
		return apiRequest<{ posts: unknown[] }>("/feed");
	}

	async createPost(caption: string, mediaUrl?: string) {
		return apiRequest("/feed", {
			method: "POST",
			body: {
				caption,
				mediaUrl,
			},
		});
	}

	async likePost(postId: string) {
		return apiRequest(`/feed/${postId}/likes`, {
			method: "POST",
		});
	}

	async unlikePost(postId: string) {
		return apiRequest(`/feed/${postId}/likes`, {
			method: "DELETE",
		});
	}

	async commentOnPost(postId: string, commentText: string) {
		return apiRequest(`/feed/${postId}/comments`, {
			method: "POST",
			body: { commentText },
		});
	}
}

export default new FeedService();
