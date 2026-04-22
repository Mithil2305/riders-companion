import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiRequest } from "./api";

let notificationHandlerConfigured = false;

const isPhysicalDevice = () => {
	const appOwnership = Constants.appOwnership;
	return appOwnership !== "expo";
};

const loadNotifications = async () => {
	if (!isPhysicalDevice()) {
		return null;
	}

	const Notifications = await import("expo-notifications");

	if (!notificationHandlerConfigured) {
		Notifications.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowAlert: true,
				shouldPlaySound: true,
				shouldSetBadge: false,
				shouldShowBanner: true,
				shouldShowList: true,
			}),
		});

		notificationHandlerConfigured = true;
	}

	return Notifications;
};

const getProjectId = () => {
	return (
		Constants.expoConfig?.extra?.eas?.projectId ||
		(Constants as unknown as { easConfig?: { projectId?: string } }).easConfig
			?.projectId ||
		null
	);
};

const registerPushToken = async (token: string) => {
	await apiRequest("/notifications/push-token", {
		method: "POST",
		body: {
			token,
			platform: Platform.OS,
		},
	});
};

export const initializePushNotifications = async () => {
	try {
		const Notifications = await loadNotifications();
		if (!Notifications) {
			return;
		}

		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const permission = await Notifications.requestPermissionsAsync();
			finalStatus = permission.status;
		}

		if (finalStatus !== "granted") {
			return;
		}

		const projectId = getProjectId();
		const tokenResponse = projectId
			? await Notifications.getExpoPushTokenAsync({ projectId })
			: await Notifications.getExpoPushTokenAsync();

		const token = tokenResponse?.data;
		if (typeof token === "string" && token.length > 0) {
			await registerPushToken(token);
		}

		if (Platform.OS === "android") {
			await Notifications.setNotificationChannelAsync("default", {
				name: "default",
				importance: Notifications.AndroidImportance.DEFAULT,
			});
		}
	} catch {
		// No-op: push registration should not block app startup.
	}
};
