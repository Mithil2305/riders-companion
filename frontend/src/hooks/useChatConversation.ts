import React from "react";
import { ChatMessage } from "../types/chat";
import ChatService from "../services/ChatService";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "./useWebSocket";

const AVATARS_BY_ROOM: Record<string, string> = {
	"1": "https://i.pravatar.cc/120?img=33",
	"2": "https://i.pravatar.cc/120?img=5",
	"3": "https://i.pravatar.cc/120?img=12",
	"4": "https://i.pravatar.cc/120?img=29",
	"5": "https://i.pravatar.cc/120?img=45",
};

const NAMES_BY_ROOM: Record<string, string> = {
	"1": "Cameron Williamson",
	"2": "Annette Black",
	"3": "Marvin McKinney",
	"4": "Brooklyn Simmons",
	"5": "Devon Lane",
};

function createInitialMessages(roomId: string): ChatMessage[] {
	return [
		{
			id: `in-${roomId}-1`,
			sender: "other",
			text: "Hey! How are you?",
			avatar: AVATARS_BY_ROOM[roomId] ?? AVATARS_BY_ROOM["1"],
		},
		{
			id: `out-${roomId}-1`,
			sender: "me",
			text: "All good! Working on the project 🚀",
			reaction: "❤️",
		},
	];
}

export function useChatConversation(roomId: string) {
	const { user } = useAuth();
	const [messages, setMessages] = React.useState<ChatMessage[]>(() =>
		createInitialMessages(roomId),
	);
	const [draft, setDraft] = React.useState("");
	const [showTyping, setShowTyping] = React.useState(false);
	const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const typingStateRef = React.useRef(false);

	const {
		isConnected,
		lastMessage,
		sendMessage: sendWsMessage,
	} = useWebSocket();

	React.useEffect(() => {
		setMessages(createInitialMessages(roomId));
		setDraft("");

		ChatService.getRoomMessages(roomId)
			.then((response) => {
				const mapped = (response.messages || [])
					.map((entry: any) => {
						const senderId =
							typeof entry?.senderId === "string" ? entry.senderId : null;
						const messageText =
							typeof entry?.message === "string"
								? entry.message
								: typeof entry?.encryptedPayload === "string"
									? entry.encryptedPayload
									: null;

						if (!messageText) {
							return null;
						}

						return {
							id: String(entry.id ?? `hist-${Date.now()}-${Math.random()}`),
							sender:
								senderId != null && senderId === user?.id ? "me" : "other",
							text: messageText,
							avatar:
								senderId != null && senderId === user?.id
									? undefined
									: (AVATARS_BY_ROOM[roomId] ?? AVATARS_BY_ROOM["1"]),
						} as ChatMessage;
					})
					.filter(Boolean) as ChatMessage[];

				if (mapped.length > 0) {
					setMessages(mapped);
				}
			})
			.catch(() => {
				// Keep local seeded messages when history is unavailable.
			});
	}, [roomId, user?.id]);

	React.useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, []);

	React.useEffect(() => {
		if (!isConnected) {
			return;
		}

		sendWsMessage("CHAT_JOIN_ROOM", { roomId });

		return () => {
			sendWsMessage("CHAT_LEAVE_ROOM", { roomId });
		};
	}, [isConnected, roomId, sendWsMessage]);

	React.useEffect(() => {
		if (!lastMessage || typeof lastMessage.type !== "string") {
			return;
		}

		if (lastMessage.type === "CHAT_MESSAGE") {
			const payload = (lastMessage.payload || {}) as Record<string, any>;
			if (payload.roomId !== roomId) {
				return;
			}

			const senderId =
				typeof payload.senderId === "string" ? payload.senderId : null;
			const text =
				typeof payload.message === "string"
					? payload.message
					: typeof payload.encryptedPayload === "string"
						? payload.encryptedPayload
						: null;

			if (!text) {
				return;
			}

			if (senderId && senderId === user?.id) {
				return;
			}

			setMessages((prev) => [
				...prev,
				{
					id: String(payload.id ?? `in-${Date.now()}`),
					sender: "other",
					text,
					avatar: AVATARS_BY_ROOM[roomId] ?? AVATARS_BY_ROOM["1"],
					isNew: true,
				},
			]);
			return;
		}

		if (lastMessage.type === "CHAT_TYPING") {
			const payload = (lastMessage.payload || {}) as Record<string, any>;
			if (payload.roomId !== roomId) {
				return;
			}

			if (payload.riderId && payload.riderId === user?.id) {
				return;
			}

			const typing = Boolean(payload.isTyping);
			setShowTyping(typing);

			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}

			if (typing) {
				typingTimeoutRef.current = setTimeout(() => {
					setShowTyping(false);
				}, 1800);
			}
		}
	}, [lastMessage, roomId, user?.id]);

	const setDraftWithTyping = React.useCallback(
		(value: string) => {
			setDraft(value);

			const shouldType = value.trim().length > 0;
			if (typingStateRef.current !== shouldType) {
				typingStateRef.current = shouldType;
				sendWsMessage("CHAT_TYPING", {
					roomId,
					isTyping: shouldType,
				});
			}
		},
		[roomId, sendWsMessage],
	);

	const sendMessage = React.useCallback(() => {
		const trimmed = draft.trim();

		if (!trimmed) {
			return;
		}

		const nextMessage: ChatMessage = {
			id: `out-${Date.now()}`,
			sender: "me",
			text: trimmed,
			isNew: true,
		};

		setMessages((prev) => [...prev, nextMessage]);
		setDraft("");

		typingStateRef.current = false;
		sendWsMessage("CHAT_TYPING", {
			roomId,
			isTyping: false,
		});

		sendWsMessage("CHAT_SEND_MESSAGE", {
			roomId,
			message: trimmed,
		});
	}, [draft, roomId, sendWsMessage]);

	return {
		chatName: NAMES_BY_ROOM[roomId] ?? "Ride Buddy",
		chatAvatar: AVATARS_BY_ROOM[roomId] ?? AVATARS_BY_ROOM["1"],
		messages,
		draft,
		setDraft: setDraftWithTyping,
		sendMessage,
		showTyping,
	};
}
