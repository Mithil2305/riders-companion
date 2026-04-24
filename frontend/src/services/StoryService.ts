import { apiRequest } from "./api";

interface CreateStoryPayload {
	title?: string;
	caption?: string;
	mediaData?: string;
	mediaBase64?: string;
	mediaUrl?: string;
	mediaMimeType?: string;
	hashtags?: string[];
}

class StoryService {
	async createStory(payload: CreateStoryPayload) {
		return apiRequest("/stories", {
			method: "POST",
			body: payload,
			timeoutMs: 15 * 60 * 1000,
			allowRetryOnTimeout: false,
		});
	}
}

export default new StoryService();
