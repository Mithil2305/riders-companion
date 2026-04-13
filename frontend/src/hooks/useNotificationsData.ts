import React from "react";
import { AppNotification } from "../types/notifications";
import { mockNotifications } from "../utils/mocks/notifications";
import { apiRequest } from "../services/api";

interface UseNotificationsDataResult {
	loading: boolean;
	notifications: AppNotification[];
	markAsRead: (id: string) => void;
	dismiss: (id: string) => void;
}

export function useNotificationsData(): UseNotificationsDataResult {
	const [loading, setLoading] = React.useState(true);
	const [notifications, setNotifications] =
		React.useState<AppNotification[]>(mockNotifications);

	React.useEffect(() => {
		let mounted = true;

		apiRequest<{
			notifications: Array<{
				id: string;
				type: "invite" | "status";
				title: string;
				body: string;
				read: boolean;
				createdAt: string;
			}>;
		}>("/notifications")
			.then((data) => {
				if (!mounted) {
					return;
				}

				setNotifications(
					data.notifications.map((item) => ({
						id: item.id,
						type: item.type === "invite" ? "SOCIAL" : "SYSTEM",
						title: item.title,
						message: item.body,
						time: new Date(item.createdAt).toLocaleString(),
						read: item.read,
					})),
				);
			})
			.catch(() => {
				// Keep existing mock notifications as fallback if backend is unavailable.
			})
			.finally(() => {
				if (mounted) {
					setLoading(false);
				}
			});

		return () => {
			mounted = false;
		};
	}, []);

	const markAsRead = React.useCallback((id: string) => {
		setNotifications((prev) =>
			prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
		);
	}, []);

	const dismiss = React.useCallback((id: string) => {
		setNotifications((prev) => prev.filter((item) => item.id !== id));
	}, []);

	return {
		loading,
		notifications,
		markAsRead,
		dismiss,
	};
}
