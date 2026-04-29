import { useState, useEffect, useRef, useCallback } from "react";
import { getApiUrl } from "../services/api";
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
	const baseApi = getApiUrl().replace(/\/api\/?$/, "");
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
	const url = options.url ?? defaultOptions.url;
	const autoConnect = options.autoConnect ?? defaultOptions.autoConnect;
	const reconnectOnClose =
		options.reconnectOnClose ?? defaultOptions.reconnectOnClose;
	const reconnectDelayMs =
		options.reconnectDelayMs ?? defaultOptions.reconnectDelayMs;

	const [isConnected, setIsConnected] = useState(false);
	const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [connectedUrl, setConnectedUrl] = useState<string | null>(null);
	const [connectionState, setConnectionState] = useState<
		"idle" | "connecting" | "connected" | "reconnecting" | "disconnected"
	>(autoConnect ? "connecting" : "idle");
	const [reconnectAttempt, setReconnectAttempt] = useState(0);

	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const manualCloseRef = useRef(false);
	const isConnectingRef = useRef(false);

	const clearReconnectTimer = useCallback(() => {
		if (reconnectTimerRef.current) {
			clearTimeout(reconnectTimerRef.current);
			reconnectTimerRef.current = null;
		}
	}, []);

	const disconnect = useCallback(() => {
		manualCloseRef.current = true;
		isConnectingRef.current = false;
		clearReconnectTimer();

		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		setIsConnected(false);
		setConnectionState("disconnected");
	}, [clearReconnectTimer]);

	const connect = useCallback(async () => {
		if (
			isConnectingRef.current ||
			(wsRef.current &&
				(wsRef.current.readyState === WebSocket.OPEN ||
					wsRef.current.readyState === WebSocket.CONNECTING))
		) {
			return false;
		}

		isConnectingRef.current = true;
		manualCloseRef.current = false;
		clearReconnectTimer();
		setConnectionState(reconnectAttempt > 0 ? "reconnecting" : "connecting");

		try {
			const user = auth?.currentUser;
			if (!user) {
				setError("Login required before opening websocket connection.");
				setIsConnected(false);
				setConnectionState("disconnected");
				isConnectingRef.current = false;
				return false;
			}

			const token = await user.getIdToken();
			const wsUrl = buildWebSocketUrl(url, token);
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			ws.onopen = () => {
				isConnectingRef.current = false;
				setConnectedUrl(wsUrl);
				setError(null);
				setIsConnected(true);
				setReconnectAttempt(0);
				setConnectionState("connected");
			};

			ws.onmessage = (event) => {
				try {
					const parsed = JSON.parse(String(event.data)) as WebSocketMessage;
					setLastMessage(parsed);
				} catch {
					setError("Received malformed websocket payload.");
				}
			};

			ws.onerror = () => {
				isConnectingRef.current = false;
				setError("WebSocket error occurred.");
				setIsConnected(false);
				setConnectionState("disconnected");
			};

			ws.onclose = () => {
				isConnectingRef.current = false;
				setIsConnected(false);
				setConnectionState("disconnected");

				if (!manualCloseRef.current && reconnectOnClose && autoConnect) {
					setReconnectAttempt((prev) => prev + 1);
					setConnectionState("reconnecting");
					reconnectTimerRef.current = setTimeout(() => {
						void connect();
					}, reconnectDelayMs);
				}
			};

			return true;
		} catch {
			isConnectingRef.current = false;
			setIsConnected(false);
			setError("Failed to connect to websocket server.");
			setConnectionState("disconnected");
			return false;
		}
	}, [
		autoConnect,
		clearReconnectTimer,
		reconnectDelayMs,
		reconnectOnClose,
		reconnectAttempt,
		url,
	]);

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
		if (autoConnect) {
			void connect();
		}

		return () => {
			disconnect();
			clearReconnectTimer();
		};
	}, [autoConnect, clearReconnectTimer, connect, disconnect]);

	return {
		isConnected,
		connectionState,
		reconnectAttempt,
		lastMessage,
		error,
		connectedUrl,
		connect,
		disconnect,
		sendMessage,
	};
}
