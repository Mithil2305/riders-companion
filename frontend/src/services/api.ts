import { Platform } from "react-native";
import Constants from "expo-constants";
import { auth } from "../config/firebase";

const isLocalOrPrivateHost = (host: string) => {
	if (host === "localhost" || host === "127.0.0.1") {
		return true;
	}

	return (
		/^10\./.test(host) ||
		/^192\.168\./.test(host) ||
		/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
	);
};

const normalizeApiBase = (value: string) => {
	const trimmed = value.trim().replace(/\/+$/, "");
	return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const fromExpoHost = () => {
	const hostUri =
		Constants.expoConfig?.hostUri ??
		Constants.manifest2?.extra?.expoGo?.hostUri;
	if (!hostUri) {
		return null;
	}

	const host = hostUri.split(":")[0];
	if (!host || !isLocalOrPrivateHost(host)) {
		return null;
	}

	return `http://${host}:3000/api`;
};

const resolveApiUrl = () => {
	const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
	if (envApiUrl && envApiUrl.trim().length > 0) {
		return normalizeApiBase(envApiUrl);
	}

	const fromHost = fromExpoHost();
	if (fromHost) {
		return fromHost;
	}

	return Platform.select({
		ios: "http://localhost:3000/api",
		android: "http://10.0.2.2:3000/api",
		default: "http://localhost:3000/api",
	})!;
};

export const API_URL = resolveApiUrl();

type ApiRequestOptions = {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	body?: unknown;
	timeoutMs?: number;
};

const getAuthToken = async () => {
	const user = auth?.currentUser;
	if (!user) {
		throw new Error("You need to be logged in to perform this action.");
	}

	return user.getIdToken();
};

export async function apiRequest<T>(
	path: string,
	options: ApiRequestOptions = {},
): Promise<T> {
	const token = await getAuthToken();
	const controller = new AbortController();
	const timeoutMs = options.timeoutMs ?? 15000;
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${API_URL}${path}`, {
			method: options.method ?? "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: options.body == null ? undefined : JSON.stringify(options.body),
			signal: controller.signal,
		});

		const data = (await response.json()) as {
			success: boolean;
			data?: T;
			message?: string;
		};

		if (!response.ok || !data.success || data.data == null) {
			throw new Error(data.message ?? "Request failed");
		}

		return data.data;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(
				"Request timed out. Please check your connection and backend server.",
			);
		}

		if (error instanceof TypeError) {
			throw new Error(
				`Cannot reach backend at ${API_URL}. Update EXPO_PUBLIC_API_URL if needed.`,
			);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}
