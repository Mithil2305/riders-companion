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
		});
	}
}

export default new StoryService();
