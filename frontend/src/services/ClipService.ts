import { CommentPayload } from "./FeedService";
import { apiRequest } from "./api";

export interface ClipPayload {
	id: string;
	videoUrl: string;
	thumbnailUrl?: string | null;
	caption?: string | null;
	songId?: string | null;
	createdAt: string;
	rider?: {
		id?: string;
		name?: string;
		username?: string;
		profileImageUrl?: string;
	};
	likesCount: number;
	commentsCount: number;
	sharesCount: number;
	likedByMe?: boolean;
}

interface CreateClipPayload {
	title?: string;
	caption?: string;
	mediaData?: string;
	mediaBase64?: string;
	videoData?: string;
	videoBase64?: string;
	videoUrl?: string;
	mediaMimeType?: string;
	hashtags?: string[];
}

type ClipsResponse = { clips: ClipPayload[] };

const CLIPS_CACHE_TTL_MS = 30_000;

let clipsCache: { data: ClipsResponse; fetchedAt: number } | null = null;
let clipsInFlight: Promise<ClipsResponse> | null = null;

class ClipService {
	peekClipsCache() {
		return clipsCache?.data ?? null;
	}

	clearClipsCache() {
		clipsCache = null;
		clipsInFlight = null;
	}

	async preloadClips() {
		try {
			await this.getClips();
		} catch {
			// Best-effort warmup.
		}
	}

	async getClips() {
		const now = Date.now();
		if (clipsCache && now - clipsCache.fetchedAt < CLIPS_CACHE_TTL_MS) {
			return clipsCache.data;
		}

		if (clipsInFlight) {
			return clipsInFlight;
		}

		clipsInFlight = apiRequest<ClipsResponse>("/clips")
			.then((data) => {
				clipsCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				clipsInFlight = null;
			});

		return clipsInFlight;
	}

	async getClipById(clipId: string) {
		return apiRequest<{ clip: ClipPayload }>(`/clips/${clipId}`);
	}

	async getComments(clipId: string) {
		return apiRequest<{ comments: CommentPayload[] }>(`/clips/${clipId}/comments`);
	}

	async commentOnClip(clipId: string, commentText: string) {
		return apiRequest<{ commentsCount: number; comment?: CommentPayload }>(
			`/clips/${clipId}/comments`,
			{
				method: "POST",
				body: { commentText },
			},
		);
	}

	async updateComment(clipId: string, commentId: string, commentText: string) {
		return apiRequest<{ clipId: string; comment: CommentPayload }>(
			`/clips/${clipId}/comments/${commentId}`,
			{
				method: "PATCH",
				body: { commentText },
			},
		);
	}

	async deleteComment(clipId: string, commentId: string) {
		return apiRequest<{ clipId: string; commentId: string; commentsCount: number }>(
			`/clips/${clipId}/comments/${commentId}`,
			{
				method: "DELETE",
			},
		);
	}

	async createClip(payload: CreateClipPayload) {
		return apiRequest("/clips", {
			method: "POST",
			body: payload,
			timeoutMs: 15 * 60 * 1000,
			allowRetryOnTimeout: false,
		});
	}

	async updateClip(clipId: string, payload: { caption: string }) {
		return apiRequest<{ clip: ClipPayload }>(`/clips/${clipId}`, {
			method: "PATCH",
			body: payload,
		});
	}

	async deleteClip(clipId: string) {
		return apiRequest<{ clipId: string }>(`/clips/${clipId}`, {
			method: "DELETE",
		});
	}

	async likeClip(clipId: string) {
		return apiRequest<{ clipId: string; liked: boolean; likesCount: number }>(
			`/clips/${clipId}/likes`,
			{
				method: "POST",
			},
		);
	}

	async unlikeClip(clipId: string) {
		return apiRequest<{ clipId: string; liked: boolean; likesCount: number }>(
			`/clips/${clipId}/likes`,
			{
				method: "DELETE",
			},
		);
	}
}

export default new ClipService();
