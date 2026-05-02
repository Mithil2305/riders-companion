import React from "react";
import { AppNotification } from "../types/notifications";
import { apiRequest } from "../services/api";
import { useWebSocket } from "./useWebSocket";

interface UseNotificationsDataResult {
	loading: boolean;
	refreshing: boolean;
	notifications: AppNotification[];
	markAsRead: (id: string) => void;
	dismiss: (id: string) => void;
	refreshNotifications: () => Promise<void>;
}

export function useNotificationsData(): UseNotificationsDataResult {
	const [loading, setLoading] = React.useState(true);
	const [refreshing, setRefreshing] = React.useState(false);
	const [notifications, setNotifications] = React.useState<AppNotification[]>(
		[],
	);
	const { lastMessage } = useWebSocket();
	const mountedRef = React.useRef(true);

	const mapType = React.useCallback((type: string) => {
		if (type === "MESSAGE_RECEIVED" || type === "POST_COMMENTED") {
			return "SOCIAL" as const;
		}

		if (type === "FOLLOWING_POSTED") {
			return "ALERT" as const;
		}

		return "SYSTEM" as const;
	}, []);

	const mapServerItem = React.useCallback(
		(item: {
			id: string;
			type: string;
			title: string;
			body: string;
			read: boolean;
			createdAt: string;
		}): AppNotification => ({
			id: item.id,
			type: mapType(item.type),
			title: item.title,
			message: item.body,
			time: new Date(item.createdAt).toLocaleString(),
			read: item.read,
		}),
		[mapType],
	);

	const loadNotifications = React.useCallback(async () => {
		try {
			const data = await apiRequest<{
				notifications: {
					id: string;
					type: string;
					title: string;
					body: string;
					read: boolean;
					createdAt: string;
				}[];
			}>("/notifications");

			if (!mountedRef.current) {
				return;
			}

			setNotifications(data.notifications.map((item) => mapServerItem(item)));
		} catch {
			if (mountedRef.current) {
				setNotifications([]);
			}
		} finally {
			if (mountedRef.current) {
				setLoading(false);
			}
		}
	}, [mapServerItem]);

	React.useEffect(() => {
		mountedRef.current = true;
		void loadNotifications();

		return () => {
			mountedRef.current = false;
		};
	}, [loadNotifications]);

	const refreshNotifications = React.useCallback(async () => {
		setRefreshing(true);
		try {
			await loadNotifications();
		} finally {
			if (mountedRef.current) {
				setRefreshing(false);
			}
		}
	}, [loadNotifications]);

	React.useEffect(() => {
		if (
			!lastMessage ||
			lastMessage.type !== "NOTIFICATION_EVENT" ||
			typeof lastMessage.payload !== "object" ||
			lastMessage.payload == null
		) {
			return;
		}

		const payload = lastMessage.payload as {
			notification?: {
				id: string;
				type: string;
				title: string;
				body: string;
				read: boolean;
				createdAt: string;
			};
		};

		if (!payload.notification) {
			return;
		}

		const incoming = mapServerItem(payload.notification);
		setNotifications((prev) => {
			if (prev.some((item) => item.id === incoming.id)) {
				return prev;
			}

			return [incoming, ...prev];
		});
	}, [lastMessage, mapServerItem]);

	const markAsRead = React.useCallback((id: string) => {
		void apiRequest(`/notifications/${id}/read`, {
			method: "PATCH",
		}).catch(() => {
			// Ignore failures so we do not surface unhandled promise errors.
		});

		setNotifications((prev) =>
			prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
		);
	}, []);

	const dismiss = React.useCallback((id: string) => {
		setNotifications((prev) => prev.filter((item) => item.id !== id));
	}, []);

	return {
		loading,
		refreshing,
		notifications,
		markAsRead,
		dismiss,
		refreshNotifications,
	};
}
