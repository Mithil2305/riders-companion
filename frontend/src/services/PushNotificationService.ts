import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiRequest } from "./api";

type NotificationsModule = typeof import("expo-notifications");

const isPhysicalDevice = () => {
	const appOwnership = Constants.appOwnership;
	return appOwnership !== "expo";
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

const getNotificationsModule =
	async (): Promise<NotificationsModule | null> => {
		if (!isPhysicalDevice()) {
			return null;
		}

		try {
			return await import("expo-notifications");
		} catch {
			// Expo Go on SDK 53+ no longer supports remote push notifications.
			return null;
		}
	};

export const initializePushNotifications = async () => {
	try {
		const Notifications = await getNotificationsModule();
		if (!Notifications) {
			return;
		}

		Notifications.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowAlert: true,
				shouldPlaySound: true,
				shouldSetBadge: false,
				shouldShowBanner: true,
				shouldShowList: true,
			}),
		});

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
