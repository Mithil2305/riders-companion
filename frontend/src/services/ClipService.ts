import { apiRequest } from "./api";

export interface ClipPayload {
	id: string;
	videoUrl: string;
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

class ClipService {
	async getClips() {
		return apiRequest<{ clips: ClipPayload[] }>("/clips");
	}

	async createClip(payload: CreateClipPayload) {
		return apiRequest("/clips", {
			method: "POST",
			body: payload,
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
