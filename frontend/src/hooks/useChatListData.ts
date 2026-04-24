import React from "react";
import { ChatFilter, ChatPreview } from "../types/chat";
import ChatService from "../services/ChatService";

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

const MOCK_CHAT_PREVIEW: ChatPreview = {
	id: "mock-room-1",
	name: "Weekend Riders",
	senderName: "Aarav",
	message: "Route locked: ECR sunrise loop. Meet at 5:30 AM.",
	time: formatPreviewTime(new Date().toISOString()),
	avatar:
		"https://ui-avatars.com/api/?name=Weekend%20Riders&background=0D8ABC&color=fff",
	roomType: "group",
	status: "active",
};

export function useChatListData() {
	const [chatPreviews, setChatPreviews] = React.useState<ChatPreview[]>([]);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [activeFilter, setActiveFilter] = React.useState<ChatFilter>("all");
	const [refreshing, setRefreshing] = React.useState(false);
	const mountedRef = React.useRef(true);

	const loadChatPreviews = React.useCallback(async () => {
		try {
			const response = await ChatService.getRooms();
			const rooms = response.communities || [];

			const previews = await Promise.all(
				rooms.map(async (room) => {
					try {
						const history = await ChatService.getRoomMessages(String(room.id));
						const latest = history.messages?.[history.messages.length - 1] as
							| {
									message?: string;
									senderName?: string;
									createdAt?: string;
							  }
							| undefined;

						return {
							id: String(room.id),
							name: room.name || `Room ${room.id}`,
							senderName:
								typeof latest?.senderName === "string"
									? latest.senderName
									: undefined,
							message:
								typeof latest?.message === "string" &&
								latest.message.trim().length > 0
									? latest.message
									: "No messages yet",
							time: formatPreviewTime(latest?.createdAt),
							avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(room.name || `Room ${room.id}`)}&background=0D8ABC&color=fff`,
							roomType: "group" as const,
							status: "active" as const,
						};
					} catch {
						return {
							id: String(room.id),
							name: room.name || `Room ${room.id}`,
							message: "No messages yet",
							time: "--:--",
							avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(room.name || `Room ${room.id}`)}&background=0D8ABC&color=fff`,
							roomType: "group" as const,
							status: "active" as const,
						};
					}
				}),
			);

			if (!mountedRef.current) {
				return;
			}

			setChatPreviews(previews.length > 0 ? previews : [MOCK_CHAT_PREVIEW]);
		} catch {
			if (mountedRef.current) {
				setChatPreviews([MOCK_CHAT_PREVIEW]);
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
				return true;
			}

			if (activeFilter === "personal") {
				return item.roomType === "personal";
			}

			if (activeFilter === "group") {
				return item.roomType === "group" && item.status !== "ended";
			}

			return item.status === "ended";
		});

		if (!searchQuery.trim()) {
			return byFilter;
		}

		const normalizedQuery = searchQuery.trim().toLowerCase();

		return byFilter.filter((item) => {
			const searchable =
				`${item.name} ${item.senderName ?? ""} ${item.message}`.toLowerCase();
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
