import { apiRequest } from "./api";
import { PersonalChatMeta } from "../types/chat";

type ChatRoomListResponse = {
	communities: {
		id: string;
		name: string;
	}[];
};

type ChatMessagesResponse = {
	roomId: string;
	messages: unknown[];
};

export type PersonalMessagePayload = {
	id: string;
	roomId: string;
	senderId: string;
	receiverId?: string | null;
	message: string;
	attachmentUrl?: string | null;
	createdAt: string;
	senderName?: string | null;
	senderUsername?: string | null;
};

type PersonalConversationResponse = {
	roomId: string;
	meta: PersonalChatMeta;
	messages: PersonalMessagePayload[];
};

type PersonalConversationPreviewResponse = {
	conversations: {
		id: string;
		meta: PersonalChatMeta;
		latestMessage?: PersonalMessagePayload | null;
	}[];
};

type PersonalBlockResponse = {
	riderId: string;
	blocked: boolean;
};

type BlockedUsersResponse = {
	blockedUsers: {
		id: string;
		meta: PersonalChatMeta;
	}[];
};

type PersonalSendInput = {
	kind: "text" | "image";
	text?: string;
	imageUrl?: string;
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
		message: string,
		receiverId?: string,
		attachmentUrl?: string,
	) {
		return apiRequest(`/chat/rooms/${roomId}/messages`, {
			method: "POST",
			body: {
				message,
				receiverId,
				attachmentUrl,
			},
		});
	}

	async getPersonalConversations(): Promise<PersonalConversationPreviewResponse> {
		return apiRequest<PersonalConversationPreviewResponse>("/chat/personal");
	}

	async getBlockedUsers(): Promise<BlockedUsersResponse> {
		return apiRequest<BlockedUsersResponse>("/chat/personal/blocked");
	}

	async getPersonalConversation(
		roomId: string,
	): Promise<PersonalConversationResponse> {
		return apiRequest<PersonalConversationResponse>(`/chat/personal/${roomId}`);
	}

	async sendPersonalMessage(
		roomId: string,
		payload: PersonalSendInput,
	): Promise<PersonalMessagePayload> {
		return apiRequest<PersonalMessagePayload>(
			`/chat/personal/${roomId}/messages`,
			{
				method: "POST",
				body:
					payload.kind === "image"
						? {
								text: payload.text ?? "",
								imageUrl: payload.imageUrl ?? "",
							}
						: {
								message: payload.text ?? "",
							},
			},
		);
	}

	async blockPersonalUser(roomId: string): Promise<PersonalBlockResponse> {
		return apiRequest<PersonalBlockResponse>(`/chat/personal/${roomId}/block`, {
			method: "POST",
		});
	}

	async unblockPersonalUser(roomId: string): Promise<PersonalBlockResponse> {
		return apiRequest<PersonalBlockResponse>(`/chat/personal/${roomId}/block`, {
			method: "DELETE",
		});
	}

	async listGroupChatInvitations() {
		return apiRequest<{
			invitations: Array<{
				id: string;
				communityId: string;
				communityName: string;
				inviterId: string;
				inviterName: string;
				inviterUsername?: string | null;
				inviterAvatar?: string | null;
				status: string;
				createdAt: string;
			}>;
		}>("/chat/invitations");
	}

	async acceptGroupChatInvitation(invitationId: string) {
		return apiRequest<{
			invitationId: string;
			communityId: string;
			status: string;
		}>(`/chat/invitations/${invitationId}/accept`, {
			method: "POST",
		});
	}

	async declineGroupChatInvitation(invitationId: string) {
		return apiRequest<{
			invitationId: string;
			communityId: string;
			status: string;
		}>(`/chat/invitations/${invitationId}/decline`, {
			method: "POST",
		});
	}

	async inviteUsersToGroupChat(
		communityId: string,
		invitedRiderIds: string[],
		rideId?: string,
	) {
		return apiRequest<{
			communityId: string;
			invitedCount: number;
		}>(`/chat/communities/${communityId}/invite`, {
			method: "POST",
			body: { invitedRiderIds, rideId },
		});
	}
}

export default new ChatService();
