import { apiRequest } from "./api";
import {
	PersonalChatMessage,
	PersonalChatMeta,
	PersonalImageMessage,
	PersonalTextMessage,
} from "../types/chat";

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

type PersonalConversationResponse = {
	roomId: string;
	meta: PersonalChatMeta;
	messages: PersonalChatMessage[];
};

type PersonalMuteResponse = {
	roomId: string;
	muted: boolean;
};

type PersonalBlockResponse = {
	roomId: string;
	blocked: boolean;
};

type PersonalClearResponse = {
	roomId: string;
	cleared: boolean;
};

type PersonalSendInput = {
	kind: "text" | "image";
	text?: string;
	imageUrl?: string;
};

const PERSONAL_CHAT_META: Record<string, PersonalChatMeta> = {
	"1": {
		roomId: "1",
		name: "ArunKumar",
		avatar: "https://i.pravatar.cc/120?img=68",
		isOnline: true,
		rideTogetherLabel: "YOU RODE TOGETHER ON: CHENNAI → OOTY",
	},
};

const nowIso = () => new Date().toISOString();

const toTimeLabel = (iso: string) => {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const seedPersonalMessages = (roomId: string): PersonalChatMessage[] => {
	const day = new Date();
	const yesterday = new Date(day);
	yesterday.setDate(day.getDate() - 1);

	const text = (
		id: string,
		sender: "me" | "other",
		createdAt: string,
		messageText: string,
	): PersonalTextMessage => ({
		id,
		kind: "text",
		sender,
		createdAt,
		timeLabel: toTimeLabel(createdAt),
		delivery: sender === "me" ? "read" : undefined,
		text: messageText,
		avatar:
			sender === "other"
				? (PERSONAL_CHAT_META[roomId]?.avatar ?? PERSONAL_CHAT_META["1"].avatar)
				: undefined,
	});

	const image = (
		id: string,
		sender: "me" | "other",
		createdAt: string,
		imageUrl: string,
		messageText: string,
	): PersonalImageMessage => ({
		id,
		kind: "image",
		sender,
		createdAt,
		timeLabel: toTimeLabel(createdAt),
		delivery: sender === "me" ? "read" : undefined,
		imageUrl,
		text: messageText,
		avatar:
			sender === "other"
				? (PERSONAL_CHAT_META[roomId]?.avatar ?? PERSONAL_CHAT_META["1"].avatar)
				: undefined,
	});

	return [
		text(
			`in-${roomId}-1`,
			"other",
			new Date(yesterday.setHours(10, 42, 0, 0)).toISOString(),
			"Hey! That ride to Ooty was epic. The hairpin bends were intense. Are you planning the Sunday morning breakfast ride?",
		),
		text(
			`out-${roomId}-1`,
			"me",
			new Date(yesterday.setHours(10, 45, 0, 0)).toISOString(),
			"Definitely! The performance of your bike on those climbs was impressive. I'm thinking of a shorter route this Sunday.",
		),
		text(
			`in-${roomId}-2`,
			"other",
			new Date(yesterday.setHours(10, 48, 0, 0)).toISOString(),
			"Sounds good. Send me the coordinates? I might bring my brother along too. He just got a new Speed Triple.",
		),
		image(
			`out-${roomId}-2`,
			"me",
			new Date(yesterday.setHours(10, 50, 0, 0)).toISOString(),
			"https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=960&q=80",
			"This is the spot I'm looking at for the breakfast stop. High altitude, great coffee.",
		),
		text(
			`in-${roomId}-3`,
			"other",
			new Date(day.setHours(9, 15, 0, 0)).toISOString(),
			"Checking the weather. Looks like clear skies! See you at 6 AM at the bypass?",
		),
	];
};

class ChatService {
	private readonly personalMessages: Record<string, PersonalChatMessage[]> = {
		"1": seedPersonalMessages("1"),
	};

	private readonly personalMuteMap: Record<string, boolean> = {};

	private readonly personalBlockMap: Record<string, boolean> = {};

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

	async getPersonalConversation(
		roomId: string,
	): Promise<PersonalConversationResponse> {
		const knownMeta = PERSONAL_CHAT_META[roomId] ?? {
			...PERSONAL_CHAT_META["1"],
			roomId,
		};

		const seeded =
			this.personalMessages[roomId] ?? seedPersonalMessages(roomId);
		this.personalMessages[roomId] = seeded;

		return Promise.resolve({
			roomId,
			meta: knownMeta,
			messages: seeded,
		});
	}

	async sendPersonalMessage(
		roomId: string,
		payload: PersonalSendInput,
	): Promise<PersonalChatMessage> {
		const createdAt = nowIso();
		const id = `out-${roomId}-${Date.now()}`;

		let nextMessage: PersonalChatMessage;
		if (payload.kind === "image") {
			nextMessage = {
				id,
				kind: "image",
				sender: "me",
				createdAt,
				timeLabel: toTimeLabel(createdAt),
				delivery: "sent",
				imageUrl: payload.imageUrl ?? "",
				text: payload.text,
			};
		} else {
			nextMessage = {
				id,
				kind: "text",
				sender: "me",
				createdAt,
				timeLabel: toTimeLabel(createdAt),
				delivery: "sent",
				text: payload.text ?? "",
			};
		}

		const existing =
			this.personalMessages[roomId] ?? seedPersonalMessages(roomId);
		this.personalMessages[roomId] = [...existing, nextMessage];

		return Promise.resolve(nextMessage);
	}

	async clearPersonalConversation(
		roomId: string,
	): Promise<PersonalClearResponse> {
		this.personalMessages[roomId] = [];
		return Promise.resolve({ roomId, cleared: true });
	}

	async mutePersonalConversation(
		roomId: string,
		muted = true,
	): Promise<PersonalMuteResponse> {
		this.personalMuteMap[roomId] = muted;
		return Promise.resolve({ roomId, muted });
	}

	async blockPersonalUser(roomId: string): Promise<PersonalBlockResponse> {
		this.personalBlockMap[roomId] = true;
		return Promise.resolve({ roomId, blocked: true });
	}
}

export default new ChatService();
