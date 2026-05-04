import React from "react";
import { ChatFilter, ChatPreview } from "../types/chat";
import ChatService from "../services/ChatService";
import RideService from "../services/RideService";
import { useWebSocket } from "./useWebSocket";
import {
	parseRideInviteMessage,
	toRideInvitePreview,
} from "../utils/rideInviteMessage";
import {
	parseSharedContentMessage,
	toSharedContentPreview,
} from "../utils/sharedContentMessage";

const formatPreviewTime = (iso?: string) => {
	if (!iso) {
		return "--:--";
	}

	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "--:--";
	}

	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
};

const toAvatarUrl = (name: string) =>
	`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=212121&color=FFFFFF`;

export function useChatListData() {
	const [chatPreviews, setChatPreviews] = React.useState<ChatPreview[]>([]);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [activeFilter, setActiveFilter] = React.useState<ChatFilter>("all");
	const [refreshing, setRefreshing] = React.useState(false);
	const mountedRef = React.useRef(true);
	const { lastMessage } = useWebSocket();

	const loadChatPreviews = React.useCallback(async () => {
		try {
			const [personalData, blockedData, roomsResponse] = await Promise.all([
				ChatService.getPersonalConversations(),
				ChatService.getBlockedUsers(),
				ChatService.getRooms(),
			]);

			const personalPreviews: ChatPreview[] = personalData.conversations.map(
				(conversation) => {
					const latest = conversation.latestMessage;
					const invitePayload = parseRideInviteMessage(latest?.message);
					const sharedPayload = parseSharedContentMessage(latest?.message);
					const avatar =
						conversation.meta.avatar &&
						conversation.meta.avatar.trim().length > 0
							? conversation.meta.avatar
							: toAvatarUrl(conversation.meta.name);

					return {
						id: conversation.id,
						name: conversation.meta.name,
						username: conversation.meta.username ?? undefined,
						message: invitePayload
							? toRideInvitePreview(
									invitePayload,
									latest?.senderId === conversation.id ? "receiver" : "sender",
								)
							: sharedPayload
								? toSharedContentPreview(sharedPayload)
								: latest?.attachmentUrl && !latest.message
									? "Photo"
									: latest?.message && latest.message.trim().length > 0
										? latest.message
										: "No messages yet",
						time: formatPreviewTime(latest?.createdAt),
						avatar,
						roomType: "personal",
						status: conversation.meta.isBlocked ? "blocked" : "active",
						senderName:
							latest?.senderId && latest.senderId !== conversation.id
								? undefined
								: undefined,
						isOnline: Boolean(conversation.meta.isOnline),
					};
				},
			);

			const blockedIds = new Set(
				blockedData.blockedUsers.map((item) => item.id),
			);
			const blockedPreviews: ChatPreview[] = blockedData.blockedUsers.map(
				(item) => ({
					id: item.id,
					name: item.meta.name,
					username: item.meta.username ?? undefined,
					message: "Blocked user",
					time: "--:--",
					avatar:
						item.meta.avatar && item.meta.avatar.trim().length > 0
							? item.meta.avatar
							: toAvatarUrl(item.meta.name),
					roomType: "personal",
					status: "blocked",
					isOnline: false,
				}),
			);

			const rooms = roomsResponse.communities || [];
			const groupPreviews = await Promise.all(
				rooms.map(async (room) => {
					try {
						const [history, snapshotResponse] = await Promise.all([
							ChatService.getRoomMessages(String(room.id)),
							RideService.getRideSnapshot(String(room.id)).catch(() => null),
						]);
						const latest = history.messages?.[history.messages.length - 1] as
							| {
									message?: string;
									attachmentUrl?: string | null;
									senderName?: string | null;
									createdAt?: string;
							  }
							| undefined;
						const participants = snapshotResponse?.snapshot?.participants ?? [];
						const onlineCount = participants.filter(
							(participant) => participant.isOnline === true,
						).length;
						const memberCount = participants.filter(
							(participant) =>
								String(participant.participantStatus || "").toUpperCase() !==
								"DECLINED",
						).length;
						const defaultPresenceMessage =
							memberCount > 0
								? `${onlineCount}/${memberCount} riders online`
								: "No riders online";

						return {
							id: String(room.id),
							name: room.name || `Room ${room.id}`,
							message:
								latest?.attachmentUrl && !latest?.message
									? "Photo"
									: typeof latest?.message === "string" &&
										  latest.message.trim().length > 0
										? latest.message
										: defaultPresenceMessage,
							time: formatPreviewTime(latest?.createdAt),
							avatar: toAvatarUrl(room.name || `Room ${room.id}`),
							roomType: "group" as const,
							status: "active" as const,
							isOnline: onlineCount > 0,
							senderName:
								typeof latest?.senderName === "string" &&
								latest.senderName.trim().length > 0
									? latest.senderName
									: undefined,
						};
					} catch {
						return {
							id: String(room.id),
							name: room.name || `Room ${room.id}`,
							message: "No messages yet",
							time: "--:--",
							avatar: toAvatarUrl(room.name || `Room ${room.id}`),
							roomType: "group" as const,
							status: "active" as const,
							isOnline: false,
						};
					}
				}),
			);

			if (!mountedRef.current) {
				return;
			}

			const mergedPersonal = personalPreviews.filter(
				(item) => item.status !== "blocked" || blockedIds.has(item.id),
			);
			const blockedOnly = blockedPreviews.filter(
				(item) => !mergedPersonal.some((existing) => existing.id === item.id),
			);

			setChatPreviews([...mergedPersonal, ...blockedOnly, ...groupPreviews]);
		} catch {
			if (mountedRef.current) {
				setChatPreviews([]);
			}
		}
	}, []);

	React.useEffect(() => {
		mountedRef.current = true;
		void loadChatPreviews();

		return () => {
			mountedRef.current = false;
		};
	}, [loadChatPreviews]);

	React.useEffect(() => {
		if (
			lastMessage?.type === "NOTIFICATION_EVENT" ||
			lastMessage?.type === "CHAT_MESSAGE" ||
			lastMessage?.type === "CHAT_MESSAGE_ACK"
		) {
			void loadChatPreviews();
		}
	}, [lastMessage, loadChatPreviews]);

	const refreshChats = React.useCallback(async () => {
		setRefreshing(true);
		try {
			await loadChatPreviews();
		} finally {
			if (mountedRef.current) {
				setRefreshing(false);
			}
		}
	}, [loadChatPreviews]);

	const filteredChats = React.useMemo(() => {
		const byFilter = chatPreviews.filter((item) => {
			if (activeFilter === "all") {
				return item.status !== "blocked";
			}

			if (activeFilter === "personal") {
				return item.roomType === "personal" && item.status !== "blocked";
			}

			if (activeFilter === "group") {
				return item.roomType === "group" && item.status !== "ended";
			}

			if (activeFilter === "blocked") {
				return item.status === "blocked";
			}

			return item.status === "ended";
		});

		if (!searchQuery.trim()) {
			return byFilter;
		}

		const normalizedQuery = searchQuery.trim().toLowerCase();

		return byFilter.filter((item) => {
			const searchable =
				`${item.name} ${item.username ?? ""} ${item.senderName ?? ""} ${item.message}`.toLowerCase();
			return searchable.includes(normalizedQuery);
		});
	}, [activeFilter, chatPreviews, searchQuery]);

	return {
		chats: filteredChats,
		refreshing,
		refreshChats,
		searchQuery,
		setSearchQuery,
		activeFilter,
		setActiveFilter,
	};
}
