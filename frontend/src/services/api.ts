import { Platform } from "react-native";
import Constants from "expo-constants";
import { auth } from "../config/firebase";

const BASE_URL = "http://45.82.244.247:3000";

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

const extractHost = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//i, "");
	const hostPort = withoutProtocol.split("/")[0] ?? "";
	const host = hostPort.split(":")[0] ?? "";
	return host.length > 0 ? host : null;
};

const fromExpoHost = () => {
	const hostCandidates = [
		Constants.expoConfig?.hostUri,
		Constants.manifest2?.extra?.expoGo?.hostUri,
		(Constants as unknown as { expoGoConfig?: { debuggerHost?: string } })
			.expoGoConfig?.debuggerHost,
	];

	for (const candidate of hostCandidates) {
		if (!candidate) {
			continue;
		}

		const host = extractHost(candidate);
		if (!host || !isLocalOrPrivateHost(host)) {
			continue;
		}

		return `http://${host}:3000/api`;
	}

	return null;
};

const resolveApiUrlCandidates = () => {
	const urls: string[] = [];
	const isDev = typeof __DEV__ !== "undefined" && __DEV__;
	const add = (value: string | null | undefined) => {
		if (!value) {
			return;
		}

		const normalized = normalizeApiBase(value);
		if (!urls.includes(normalized)) {
			urls.push(normalized);
		}
	};

	const fromHost = fromExpoHost();
	const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

	add(BASE_URL);

	if (isDev) {
		if (fromHost) {
			add(fromHost);
		}

		if (envApiUrl && envApiUrl.trim().length > 0) {
			add(envApiUrl);
		}
	} else {
		if (envApiUrl && envApiUrl.trim().length > 0) {
			add(envApiUrl);
		}

		if (fromHost) {
			add(fromHost);
		}
	}

	if (Platform.OS === "android") {
		add("http://10.0.2.2:3000/api");
	}

	add("http://localhost:3000/api");
	add("http://127.0.0.1:3000/api");

	return urls;
};

let activeApiUrl = resolveApiUrlCandidates()[0] ?? normalizeApiBase(BASE_URL);

export const API_URL = activeApiUrl;

export const getApiUrl = () => activeApiUrl;

export const getApiBaseCandidates = () => {
	const candidates = resolveApiUrlCandidates();
	if (!candidates.includes(activeApiUrl)) {
		return [activeApiUrl, ...candidates];
	}

	return [
		activeApiUrl,
		...candidates.filter((candidate) => candidate !== activeApiUrl),
	];
};

type ApiRequestOptions = {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	body?: unknown;
	timeoutMs?: number;
	allowRetryOnTimeout?: boolean;
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
	const execute = async (allowRetry: boolean, baseUrl: string): Promise<T> => {
		const token = await getAuthToken();
		const controller = new AbortController();
		const timeoutMs = options.timeoutMs ?? 30000;
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(`${baseUrl}${path}`, {
				method: options.method ?? "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: options.body == null ? undefined : JSON.stringify(options.body),
				signal: controller.signal,
			});

			const rawBody = await response.text();
			let data: {
				success: boolean;
				data?: T;
				message?: string;
			} | null = null;

			try {
				data = JSON.parse(rawBody) as {
					success: boolean;
					data?: T;
					message?: string;
				};
			} catch {
				if (!response.ok) {
					if (response.status === 413) {
						throw new Error(
							"Upload is too large for the server. Please use a smaller file or shorter video.",
						);
					}

					const trimmed = rawBody.trim();
					const preview =
						trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed;
					throw new Error(
						`Request failed (${response.status}) with a non-JSON response: ${preview}`,
					);
				}

				throw new Error(
					"Request succeeded but returned an invalid JSON response.",
				);
			}

			if (!response.ok || !data.success || data.data == null) {
				throw new Error(data.message ?? "Request failed");
			}

			return data.data;
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				if (allowRetry) {
					return execute(false, baseUrl);
				}

				throw error;
			}

			if (error instanceof TypeError) {
				throw error;
			}

			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	};

	const candidates = getApiBaseCandidates();
	let lastNetworkError: Error | null = null;

	for (const candidate of candidates) {
		try {
			const data = await execute(
				options.allowRetryOnTimeout ?? true,
				candidate,
			);
			activeApiUrl = candidate;
			return data;
		} catch (error) {
			if (
				error instanceof Error &&
				(error.name === "AbortError" || error instanceof TypeError)
			) {
				lastNetworkError = error;
				continue;
			}

			throw error;
		}
	}

	const tried = candidates.join(", ");
	if (lastNetworkError?.name === "AbortError") {
		throw new Error(
			`Request timed out while contacting backend. Tried: ${tried}. Ensure backend is running and reachable on your current LAN IP.`,
		);
	}

	throw new Error(
		`Cannot reach backend from app. Tried: ${tried}. Set EXPO_PUBLIC_API_URL or start frontend/backend on same network.`,
	);
}
