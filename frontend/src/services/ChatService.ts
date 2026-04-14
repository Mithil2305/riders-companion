import { apiRequest } from "./api";

type ChatRoomListResponse = {
	communities: Array<{
		id: string;
		name: string;
	}>;
};

type ChatMessagesResponse = {
	roomId: string;
	messages: unknown[];
};

class ChatService {
	async getRooms() {
		return apiRequest<ChatRoomListResponse>("/community");
	}

	async getRoomMessages(roomId: string) {
		return apiRequest<ChatMessagesResponse>(`/chat/rooms/${roomId}/messages`);
	}

	async createRoom(name: string, _participants: string[] = []) {
		return apiRequest("/community", {
			method: "POST",
			body: { name },
		});
	}

	async sendMessage(
		roomId: string,
		encryptedPayload: string,
		iv: string,
		attachmentUrl?: string,
	) {
		return apiRequest(`/chat/rooms/${roomId}/messages`, {
			method: "POST",
			body: {
				encryptedPayload,
				iv,
				attachmentUrl,
			},
		});
	}
}

export default new ChatService();
