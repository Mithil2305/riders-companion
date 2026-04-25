import React from "react";
import ChatService from "../services/ChatService";
import {
	PersonalChatListItem,
	PersonalChatMenuAction,
	PersonalChatMessage,
	PersonalChatMeta,
	PersonalImageMessage,
} from "../types/chat";
import { useWebSocket } from "./useWebSocket";

const FALLBACK_META: PersonalChatMeta = {
	roomId: "1",
	name: "Ride Buddy",
	avatar:
		"https://ui-avatars.com/api/?name=Ride%20Buddy&background=0D8ABC&color=fff",
	isOnline: false,
	rideTogetherLabel: "RIDER: @ridebuddy",
};

const toDayKey = (isoDate: string) => {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return "unknown";
	}

	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const toDayLabel = (isoDate: string) => {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return "TODAY";
	}

	const now = new Date();
	const nowKey = toDayKey(now.toISOString());
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	const yesterdayKey = toDayKey(yesterday.toISOString());
	const dateKey = toDayKey(isoDate);

	if (dateKey === nowKey) {
		return "TODAY";
	}

	if (dateKey === yesterdayKey) {
		return "YESTERDAY";
	}

	return date.toLocaleDateString([], {
		month: "short",
		day: "2-digit",
		year: "numeric",
	});
};

const toListItems = (
	messages: PersonalChatMessage[],
): PersonalChatListItem[] => {
	const grouped: PersonalChatListItem[] = [];
	let lastDay = "";

	for (const message of messages) {
		const dayKey = toDayKey(message.createdAt);
		if (dayKey !== lastDay) {
			grouped.push({
				id: `sep-${dayKey}-${message.id}`,
				kind: "date-separator",
				label: toDayLabel(message.createdAt),
			});
			lastDay = dayKey;
		}

		grouped.push(message);
	}

	return grouped;
};

export function useChat(roomId: string) {
	const [meta, setMeta] = React.useState<PersonalChatMeta>(() => ({
		...FALLBACK_META,
		roomId,
	}));
	const [messages, setMessages] = React.useState<PersonalChatMessage[]>([]);
	const [draft, setDraft] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(true);
	const [isMenuVisible, setIsMenuVisible] = React.useState(false);
	const [isMuted, setIsMuted] = React.useState(false);
	const [isBlocked, setIsBlocked] = React.useState(false);

	const { lastMessage } = useWebSocket();

	const toTimeLabel = React.useCallback((isoDate: string) => {
		const date = new Date(isoDate);
		if (Number.isNaN(date.getTime())) {
			return "";
		}

		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	}, []);

	React.useEffect(() => {
		let isMounted = true;

		setIsLoading(true);
		setDraft("");

		ChatService.getPersonalConversation(roomId)
			.then((response) => {
				if (!isMounted) {
					return;
				}

				setMeta(response.meta);
				setMessages(response.messages);
			})
			.catch(() => {
				if (!isMounted) {
					return;
				}

				setMeta({ ...FALLBACK_META, roomId });
				setMessages([]);
			})
			.finally(() => {
				if (!isMounted) {
					return;
				}

				setIsLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [roomId]);

	React.useEffect(() => {
		if (lastMessage?.type === "new_message") {
			const payload = lastMessage.payload as any;
			if (payload?.roomId === roomId && payload?.message) {
				const rawMsg = payload.message;
				const isImage = !!rawMsg?.mediaUrl;
				const id = String(rawMsg?.id ?? `msg-${Date.now()}-${Math.random()}`);
				const createdAt = rawMsg?.createdAt ?? new Date().toISOString();
				const timeLabelValue = toTimeLabel(createdAt);

				let nextMsg: PersonalChatMessage;
				if (isImage) {
					nextMsg = {
						id,
						kind: "image",
						sender: "other",
						createdAt,
						timeLabel: timeLabelValue,
						delivery: "read",
						imageUrl: rawMsg.mediaUrl,
						text: rawMsg?.text ?? "",
					};
				} else {
					nextMsg = {
						id,
						kind: "text",
						sender: "other",
						createdAt,
						timeLabel: timeLabelValue,
						delivery: "read",
						text: rawMsg?.text ?? "",
					};
				}

				setMessages((prev) => {
					if (prev.some((message) => message.id === nextMsg.id)) {
						return prev;
					}

					return [...prev, nextMsg];
				});
			}
		}
	}, [lastMessage, roomId, toTimeLabel]);

	const sendMessage = React.useCallback(async () => {
		const trimmed = draft.trim();
		if (!trimmed || isBlocked) {
			return;
		}

		const tempId = `out-${roomId}-${Date.now()}`;
		const createdAt = new Date().toISOString();

		const next: PersonalChatMessage = {
			id: tempId,
			kind: "text",
			sender: "me",
			createdAt,
			timeLabel: toTimeLabel(createdAt),
			delivery: "sent",
			text: trimmed,
		};

		setMessages((prev) => [...prev, next]);
		setDraft("");

		try {
			const response = await ChatService.sendPersonalMessage(roomId, {
				kind: "text",
				text: trimmed,
			});

			setMessages((prev) =>
				prev.map((message) =>
					message.id === tempId
						? { ...message, id: response.id, delivery: "read" }
						: message,
				),
			);
		} catch {
			setMessages((prev) =>
				prev.map((message) =>
					message.id === tempId
						? { ...message, delivery: "failed" as const }
						: message,
				),
			);
		}
	}, [draft, isBlocked, roomId, toTimeLabel]);

	const sendImage = React.useCallback(
		async (uri: string) => {
			if (isBlocked) {
				return;
			}

			const tempId = `img-out-${roomId}-${Date.now()}`;
			const createdAt = new Date().toISOString();

			const next: PersonalImageMessage = {
				id: tempId,
				kind: "image",
				sender: "me",
				createdAt,
				timeLabel: toTimeLabel(createdAt),
				delivery: "sent",
				imageUrl: uri,
				text: "",
			};

			setMessages((prev) => [...prev, next]);

			try {
				const response = await ChatService.sendPersonalMessage(roomId, {
					kind: "image",
					imageUrl: uri,
					text: "",
				});

				setMessages((prev) =>
					prev.map((message) =>
						message.id === tempId
							? { ...message, id: response.id, delivery: "read" }
							: message,
					),
				);
			} catch {
				setMessages((prev) =>
					prev.map((message) =>
						message.id === tempId
							? { ...message, delivery: "failed" as const }
							: message,
					),
				);
			}
		},
		[isBlocked, roomId, toTimeLabel],
	);

	const clearChat = React.useCallback(async () => {
		await ChatService.clearPersonalConversation(roomId);
		setMessages([]);
		setIsMenuVisible(false);
	}, [roomId]);

	const muteNotifications = React.useCallback(async () => {
		const nextMuted = !isMuted;
		await ChatService.mutePersonalConversation(roomId, nextMuted);
		setIsMuted(nextMuted);
		setIsMenuVisible(false);
	}, [isMuted, roomId]);

	const blockUser = React.useCallback(async () => {
		await ChatService.blockPersonalUser(roomId);
		setIsBlocked(true);
		setIsMenuVisible(false);
	}, [roomId]);

	const runMenuAction = React.useCallback(
		async (action: PersonalChatMenuAction) => {
			if (action === "voice-call" || action === "video-call") {
				setIsMenuVisible(false);
				return;
			}

			if (action === "clear-chat") {
				await clearChat();
				return;
			}

			if (action === "mute-notifications") {
				await muteNotifications();
				return;
			}

			if (action === "block-user") {
				await blockUser();
			}
		},
		[blockUser, clearChat, muteNotifications],
	);

	const listData = React.useMemo(() => toListItems(messages), [messages]);

	const openMenu = React.useCallback(() => setIsMenuVisible(true), []);
	const closeMenu = React.useCallback(() => setIsMenuVisible(false), []);

	return {
		meta,
		listData,
		draft,
		setDraft,
		sendMessage,
		sendImage,
		isLoading,
		isMenuVisible,
		openMenu,
		closeMenu,
		runMenuAction,
		isMuted,
		isBlocked,
	};
}
