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

<<<<<<< HEAD
const CHAT_CACHE_TTL_MS = 20_000;

let roomsCache: { data: ChatRoomListResponse; fetchedAt: number } | null = null;
let roomsInFlight: Promise<ChatRoomListResponse> | null = null;

let personalCache: {
	data: PersonalConversationPreviewResponse;
	fetchedAt: number;
} | null = null;
let personalInFlight: Promise<PersonalConversationPreviewResponse> | null =
	null;

let blockedCache: { data: BlockedUsersResponse; fetchedAt: number } | null =
	null;
let blockedInFlight: Promise<BlockedUsersResponse> | null = null;

const roomMessagesCache = new Map<
	string,
	{ data: ChatMessagesResponse; fetchedAt: number }
>();
const roomMessagesInFlight = new Map<string, Promise<ChatMessagesResponse>>();

=======
<<<<<<< HEAD
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
class ChatService {
	async getRooms() {
		const now = Date.now();
		if (roomsCache && now - roomsCache.fetchedAt < CHAT_CACHE_TTL_MS) {
			return roomsCache.data;
		}

		if (roomsInFlight) {
			return roomsInFlight;
		}

		roomsInFlight = apiRequest<ChatRoomListResponse>("/community")
			.then((data) => {
				roomsCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				roomsInFlight = null;
			});

		return roomsInFlight;
	}

	async getRoomMessages(roomId: string) {
<<<<<<< HEAD
=======
		return apiRequest<ChatMessagesResponse>(`/chat/rooms/${roomId}/messages`);
=======
const CHAT_CACHE_TTL_MS = 20_000;

let roomsCache: { data: ChatRoomListResponse; fetchedAt: number } | null = null;
let roomsInFlight: Promise<ChatRoomListResponse> | null = null;

let personalCache: {
	data: PersonalConversationPreviewResponse;
	fetchedAt: number;
} | null = null;
let personalInFlight: Promise<PersonalConversationPreviewResponse> | null =
	null;

let blockedCache: { data: BlockedUsersResponse; fetchedAt: number } | null =
	null;
let blockedInFlight: Promise<BlockedUsersResponse> | null = null;

const roomMessagesCache = new Map<
	string,
	{ data: ChatMessagesResponse; fetchedAt: number }
>();
const roomMessagesInFlight = new Map<string, Promise<ChatMessagesResponse>>();

class ChatService {
	async getRooms() {
		const now = Date.now();
		if (roomsCache && now - roomsCache.fetchedAt < CHAT_CACHE_TTL_MS) {
			return roomsCache.data;
		}

		if (roomsInFlight) {
			return roomsInFlight;
		}

		roomsInFlight = apiRequest<ChatRoomListResponse>("/community")
			.then((data) => {
				roomsCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				roomsInFlight = null;
			});

		return roomsInFlight;
	}

	async getRoomMessages(roomId: string) {
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		const now = Date.now();
		const cached = roomMessagesCache.get(roomId);
		if (cached && now - cached.fetchedAt < CHAT_CACHE_TTL_MS) {
			return cached.data;
		}

		const inflight = roomMessagesInFlight.get(roomId);
		if (inflight) {
			return inflight;
		}

		const request = apiRequest<ChatMessagesResponse>(
			`/chat/rooms/${roomId}/messages`,
		)
			.then((data) => {
				roomMessagesCache.set(roomId, {
					data,
					fetchedAt: Date.now(),
				});
				return data;
			})
			.finally(() => {
				roomMessagesInFlight.delete(roomId);
			});

		roomMessagesInFlight.set(roomId, request);
		return request;
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
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
<<<<<<< HEAD
		const now = Date.now();
		if (personalCache && now - personalCache.fetchedAt < CHAT_CACHE_TTL_MS) {
			return personalCache.data;
		}

		if (personalInFlight) {
			return personalInFlight;
		}

		personalInFlight = apiRequest<PersonalConversationPreviewResponse>(
			"/chat/personal",
		)
			.then((data) => {
				personalCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				personalInFlight = null;
			});

		return personalInFlight;
	}

	async getBlockedUsers(): Promise<BlockedUsersResponse> {
=======
<<<<<<< HEAD
		return apiRequest<PersonalConversationPreviewResponse>("/chat/personal");
	}

	async getBlockedUsers(): Promise<BlockedUsersResponse> {
		return apiRequest<BlockedUsersResponse>("/chat/personal/blocked");
=======
		const now = Date.now();
		if (personalCache && now - personalCache.fetchedAt < CHAT_CACHE_TTL_MS) {
			return personalCache.data;
		}

		if (personalInFlight) {
			return personalInFlight;
		}

		personalInFlight = apiRequest<PersonalConversationPreviewResponse>(
			"/chat/personal",
		)
			.then((data) => {
				personalCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				personalInFlight = null;
			});

		return personalInFlight;
	}

	async getBlockedUsers(): Promise<BlockedUsersResponse> {
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		const now = Date.now();
		if (blockedCache && now - blockedCache.fetchedAt < CHAT_CACHE_TTL_MS) {
			return blockedCache.data;
		}

		if (blockedInFlight) {
			return blockedInFlight;
		}

		blockedInFlight = apiRequest<BlockedUsersResponse>("/chat/personal/blocked")
			.then((data) => {
				blockedCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				blockedInFlight = null;
			});

		return blockedInFlight;
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	async preloadChatOverview() {
		try {
			const [rooms] = await Promise.all([
				this.getRooms(),
				this.getPersonalConversations(),
				this.getBlockedUsers(),
			]);

			const roomIds = (rooms.communities || [])
				.slice(0, 3)
				.map((room) => String(room.id));

			if (roomIds.length > 0) {
				await Promise.allSettled(
					roomIds.map((roomId) => this.getRoomMessages(roomId)),
				);
			}
		} catch {
			// Best-effort warmup.
		}
	}
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}

export default new ChatService();
