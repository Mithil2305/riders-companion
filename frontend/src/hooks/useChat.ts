import React from "react";
import ChatService, { PersonalMessagePayload } from "../services/ChatService";
import RideService from "../services/RideService";
import {
	PersonalChatListItem,
	PersonalInviteMessage,
	PersonalSharedMessage,
	PersonalChatMenuAction,
	PersonalChatMessage,
	PersonalChatMeta,
	PersonalImageMessage,
	RideInvitePayload,
} from "../types/chat";
import { useWebSocket } from "./useWebSocket";
import {
	createRideInvitePayload,
	parseRideInviteMessage,
	serializeRideInviteMessage,
} from "../utils/rideInviteMessage";
import { parseSharedContentMessage } from "../utils/sharedContentMessage";
import { useAuth } from "../contexts/AuthContext";

const FALLBACK_META: PersonalChatMeta = {
	roomId: "",
	name: "@rider",
	username: "rider",
	avatar: null,
	isOnline: false,
	rideTogetherLabel: "RIDER: @rider",
	blockedByViewer: false,
	blockedByOther: false,
	isBlocked: false,
	isSelf: false,
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
	const { user } = useAuth();
	const [meta, setMeta] = React.useState<PersonalChatMeta>(() => ({
		...FALLBACK_META,
		roomId,
	}));
	const [messages, setMessages] = React.useState<PersonalChatMessage[]>([]);
	const [draft, setDraft] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(true);
	const [isMenuVisible, setIsMenuVisible] = React.useState(false);

	const { lastMessage } = useWebSocket();

	const toTimeLabel = React.useCallback((isoDate: string) => {
		const date = new Date(isoDate);
		if (Number.isNaN(date.getTime())) {
			return "";
		}
		const hour = `${date.getHours()}`.padStart(2, "0");
		const minute = `${date.getMinutes()}`.padStart(2, "0");
		return `${hour}:${minute}`;
	}, []);

	const mapMessage = React.useCallback(
		(item: PersonalMessagePayload): PersonalChatMessage => {
			const isOutgoing = item.senderId !== roomId;
			const invitePayload = parseRideInviteMessage(item.message);
			const sender: "me" | "other" = isOutgoing ? "me" : "other";
			const base = {
				id: item.id,
				sender,
				createdAt: item.createdAt,
				timeLabel: toTimeLabel(item.createdAt),
				delivery: isOutgoing ? ("read" as const) : undefined,
			};

			if (item.attachmentUrl) {
				const imageMessage: PersonalImageMessage = {
					...base,
					kind: "image",
					imageUrl: item.attachmentUrl,
					text: item.message,
				};
				return imageMessage;
			}

			if (invitePayload) {
				const inviteMessage: PersonalInviteMessage = {
					...base,
					kind: "invite",
					invite: invitePayload,
				};
				return inviteMessage;
			}

			const sharedPayload = parseSharedContentMessage(item.message);
			if (sharedPayload) {
				const sharedMessage: PersonalSharedMessage = {
					...base,
					kind: "shared-content",
					shared: sharedPayload,
				};
				return sharedMessage;
			}

			return {
				...base,
				kind: "text",
				text: item.message,
			};
		},
		[roomId, toTimeLabel],
	);

	const loadConversation = React.useCallback(async () => {
		const response = await ChatService.getPersonalConversation(roomId);
		setMeta(response.meta);
		setMessages(response.messages.map(mapMessage));
	}, [mapMessage, roomId]);

	React.useEffect(() => {
		let isMounted = true;

		setIsLoading(true);
		setDraft("");

		loadConversation()
			.catch(() => {
				if (!isMounted) {
					return;
				}

				setMeta({ ...FALLBACK_META, roomId });
				setMessages([]);
			})
			.finally(() => {
				if (isMounted) {
					setIsLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [loadConversation, roomId]);

	React.useEffect(() => {
		if (lastMessage?.type === "CHAT_MESSAGE") {
			const payload = (lastMessage.payload || {}) as Record<string, unknown>;
			const senderId =
				typeof payload.senderId === "string" ? payload.senderId : null;
			const receiverId =
				typeof payload.receiverId === "string" ? payload.receiverId : null;

			const isRelevantDirectMessage =
				(senderId === roomId && receiverId === user?.id) ||
				(senderId === user?.id && receiverId === roomId);

			if (!isRelevantDirectMessage) {
				return;
			}

			const mapped = mapMessage({
				id: String(payload.id ?? `msg-${Date.now()}`),
				roomId,
				senderId: senderId || roomId,
				receiverId,
				message:
					typeof payload.message === "string" ? payload.message : "[message]",
				attachmentUrl:
					typeof payload.attachmentUrl === "string"
						? payload.attachmentUrl
						: null,
				createdAt:
					typeof payload.createdAt === "string"
						? payload.createdAt
						: new Date().toISOString(),
				senderName:
					typeof payload.senderName === "string" ? payload.senderName : null,
				senderUsername:
					typeof payload.senderUsername === "string"
						? payload.senderUsername
						: null,
			});

			setMessages((prev) => {
				if (prev.some((message) => message.id === mapped.id)) {
					return prev;
				}
				return [...prev, mapped];
			});
			return;
		}

		if (
			lastMessage?.type !== "NOTIFICATION_EVENT" ||
			typeof lastMessage.payload !== "object" ||
			lastMessage.payload == null
		) {
			return;
		}

		const payload = lastMessage.payload as {
			notification?: {
				type?: string;
				metadata?: { riderId?: string };
			};
		};

		if (
			payload.notification?.type === "MESSAGE_RECEIVED" &&
			payload.notification.metadata?.riderId === roomId
		) {
			void loadConversation();
		}
	}, [lastMessage, loadConversation, mapMessage, roomId, user?.id]);

	const sendMessage = React.useCallback(async () => {
		const trimmed = draft.trim();
		if (!trimmed || meta.isBlocked) {
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
						? { ...mapMessage(response), sender: "me", delivery: "read" }
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
	}, [draft, mapMessage, meta.isBlocked, roomId, toTimeLabel]);

	const sendImage = React.useCallback(
		async (uri: string) => {
			if (meta.isBlocked) {
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
							? { ...mapMessage(response), sender: "me", delivery: "read" }
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
		[mapMessage, meta.isBlocked, roomId, toTimeLabel],
	);

	const respondToRideInvite = React.useCallback(
		async (
			inviteMessageId: string,
			action: "join" | "reject",
		): Promise<RideInvitePayload | null> => {
			if (meta.isBlocked) {
				return null;
			}

			const target = messages.find(
				(message): message is PersonalInviteMessage =>
					message.id === inviteMessageId &&
					message.kind === "invite" &&
					message.sender === "other",
			);

			if (!target || target.invite.status !== "pending") {
				return null;
			}

			const nextStatus = action === "join" ? "joined" : "rejected";
			const updatedInvite = createRideInvitePayload({
				...target.invite,
				status: nextStatus,
				respondedBy: "You",
			});

			setMessages((prev) =>
				prev.map((message) =>
					message.id === inviteMessageId && message.kind === "invite"
						? { ...message, invite: updatedInvite }
						: message,
				),
			);

			try {
				if (action === "join") {
					await RideService.acceptInvitation(target.invite.rideId);
				} else {
					await RideService.declineInvitation(target.invite.rideId);
				}

				await ChatService.sendPersonalMessage(roomId, {
					kind: "text",
					text: serializeRideInviteMessage(updatedInvite),
				});

				return updatedInvite;
			} catch {
				setMessages((prev) =>
					prev.map((message) =>
						message.id === inviteMessageId && message.kind === "invite"
							? {
									...message,
									invite: {
										...message.invite,
										status: "pending",
										respondedBy: undefined,
									},
								}
							: message,
					),
				);
				return null;
			}
		},
		[meta.isBlocked, messages, roomId],
	);

	const toggleBlockUser = React.useCallback(async () => {
		if (meta.blockedByViewer) {
			await ChatService.unblockPersonalUser(roomId);
			setMeta((prev) => ({
				...prev,
				blockedByViewer: false,
				isBlocked: Boolean(prev.blockedByOther),
			}));
		} else {
			await ChatService.blockPersonalUser(roomId);
			setMeta((prev) => ({
				...prev,
				blockedByViewer: true,
				isBlocked: true,
			}));
		}

		setIsMenuVisible(false);
	}, [meta.blockedByViewer, roomId]);

	const runMenuAction = React.useCallback(
		async (action: PersonalChatMenuAction) => {
			if (action === "toggle-block-user") {
				await toggleBlockUser();
			}
		},
		[toggleBlockUser],
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
		respondToRideInvite,
		isBlocked: Boolean(meta.isBlocked),
		isBlockedByViewer: Boolean(meta.blockedByViewer),
	};
}
