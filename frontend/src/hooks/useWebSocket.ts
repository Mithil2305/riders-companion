import { useState, useEffect, useRef, useCallback } from "react";
import { API_URL } from "../services/api";
import { auth } from "../config/firebase";

export interface WebSocketMessage {
	type: string;
	payload?: unknown;
	timestamp?: string;
}

type UseWebSocketOptions = {
	url?: string;
	autoConnect?: boolean;
	reconnectOnClose?: boolean;
	reconnectDelayMs?: number;
};

const defaultOptions: Required<UseWebSocketOptions> = {
	url: "",
	autoConnect: true,
	reconnectOnClose: true,
	reconnectDelayMs: 1500,
};

const toWebSocketBaseUrl = () => {
	const baseApi = API_URL.replace(/\/api\/?$/, "");
	if (baseApi.startsWith("https://")) {
		return baseApi.replace("https://", "wss://");
	}

	if (baseApi.startsWith("http://")) {
		return baseApi.replace("http://", "ws://");
	}

	return `ws://${baseApi}`;
};

const buildWebSocketUrl = (urlOverride: string, token: string) => {
	const base =
		typeof urlOverride === "string" && urlOverride.trim().length > 0
			? urlOverride.trim()
			: `${toWebSocketBaseUrl()}/ws`;

	const separator = base.includes("?") ? "&" : "?";
	return `${base}${separator}token=${encodeURIComponent(token)}`;
};

export function useWebSocket(options: UseWebSocketOptions = {}) {
	const resolved = { ...defaultOptions, ...options };

	const [isConnected, setIsConnected] = useState(false);
	const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [connectedUrl, setConnectedUrl] = useState<string | null>(null);

	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const manualCloseRef = useRef(false);

	const clearReconnectTimer = useCallback(() => {
		if (reconnectTimerRef.current) {
			clearTimeout(reconnectTimerRef.current);
			reconnectTimerRef.current = null;
		}
	}, []);

	const disconnect = useCallback(() => {
		manualCloseRef.current = true;
		clearReconnectTimer();

		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		setIsConnected(false);
	}, [clearReconnectTimer]);

	const connect = useCallback(async () => {
		manualCloseRef.current = false;
		clearReconnectTimer();

		try {
			const user = auth?.currentUser;
			if (!user) {
				setError("Login required before opening websocket connection.");
				setIsConnected(false);
				return false;
			}

			const token = await user.getIdToken();
			const wsUrl = buildWebSocketUrl(resolved.url, token);
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			ws.onopen = () => {
				setConnectedUrl(wsUrl);
				setError(null);
				setIsConnected(true);
			};

			ws.onmessage = (event) => {
				try {
					const parsed = JSON.parse(String(event.data)) as WebSocketMessage;
					setLastMessage(parsed);
				} catch (_err) {
					setError("Received malformed websocket payload.");
				}
			};

			ws.onerror = () => {
				setError("WebSocket error occurred.");
				setIsConnected(false);
			};

			ws.onclose = () => {
				setIsConnected(false);

				if (
					!manualCloseRef.current &&
					resolved.reconnectOnClose &&
					resolved.autoConnect
				) {
					reconnectTimerRef.current = setTimeout(() => {
						void connect();
					}, resolved.reconnectDelayMs);
				}
			};

			return true;
		} catch (_err) {
			setIsConnected(false);
			setError("Failed to connect to websocket server.");
			return false;
		}
	}, [clearReconnectTimer, resolved]);

	const sendMessage = useCallback(
		(type: string, payload: Record<string, unknown> = {}) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				return false;
			}

			wsRef.current.send(
				JSON.stringify({
					type,
					payload,
				}),
			);

			return true;
		},
		[],
	);

	useEffect(() => {
		if (resolved.autoConnect) {
			void connect();
		}

		return () => {
			disconnect();
			clearReconnectTimer();
		};
	}, [connect, disconnect, clearReconnectTimer, resolved.autoConnect]);

	return {
		isConnected,
		lastMessage,
		error,
		connectedUrl,
		connect,
		disconnect,
		sendMessage,
	};
}
