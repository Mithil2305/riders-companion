import { useEffect, useRef, useState } from "react";
import useWebSocket from "./useWebSocket";
import useLocation from "./useLocation";
import RideService from "../services/RideService";
import ChatService from "../services/ChatService";
import { v4 as uuidv4 } from "uuid";
import {
	RiderLocation,
	RideSnapshot,
	GroupSocketEnvelope,
} from "../types/groupChat";

type UseGroupChatScreenArgs = {
	rideId: string;
	groupId: string;
	userId: string;
};

export default function useGroupChatScreen({
	rideId,
	groupId,
	userId,
}: UseGroupChatScreenArgs) {
	const ws = useWebSocket();
	const { location, startWatching, stopWatching } = useLocation();
	const [snapshot, setSnapshot] = useState<RideSnapshot | null>(null);
	const pendingMessages = useRef<Record<string, any>>({});

	useEffect(() => {
		if (!rideId) return;
		let mounted = true;

		// bootstrap snapshot
		RideService.getRideSnapshot(rideId)
			.then((res) => {
				if (!mounted) return;
				setSnapshot(res.data);
			})
			.catch(() => {
				// ignore
			});

		return () => {
			mounted = false;
		};
	}, [rideId]);

	useEffect(() => {
		if (!ws || !rideId) return;

		const onMessage = (env: GroupSocketEnvelope) => {
			if (env.type === "RIDE_SNAPSHOT" && env.rideId === rideId) {
				setSnapshot(env.payload as RideSnapshot);
			}
			if (env.type === "LOCATION_UPDATE" && env.rideId === rideId) {
				const loc = env.payload as RiderLocation;
				setSnapshot((prev) => {
					if (!prev) return prev;
					const participants = prev.participants.map((p) =>
						p.riderId === loc.riderId ? { ...p, latest: loc } : p,
					);
					return { ...prev, participants };
				});
			}
			if (env.type === "CHAT_MESSAGE_ACK" && env.rideId === rideId) {
				const { clientMessageId, serverMessage } = env.payload as any;
				pendingMessages.current[clientMessageId]?.resolve(serverMessage);
				delete pendingMessages.current[clientMessageId];
			}
		};

		ws.subscribe(onMessage);
		ws.joinRoom(groupId);

		return () => {
			ws.leaveRoom(groupId);
			ws.unsubscribe(onMessage);
		};
	}, [ws, rideId, groupId]);

	useEffect(() => {
		if (!location) return;
		const payload: any = {
			type: "LOCATION_UPDATE",
			rideId,
			payload: {
				riderId: userId,
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				accuracy: location.coords.accuracy,
				altitude: location.coords.altitude,
				deviceSpeedKmh:
					location.coords.speed != null ? location.coords.speed * 3.6 : null,
				heading: location.coords.heading,
				sourceTimestamp: location.timestamp,
			},
		};

		ws?.send(payload);
	}, [location]);

	const sendMessage = (text: string) => {
		const clientMessageId = uuidv4();
		const payload = {
			type: "CHAT_SEND_MESSAGE",
			groupId,
			clientMessageId,
			payload: { text },
		};

		return new Promise((resolve, reject) => {
			pendingMessages.current[clientMessageId] = { resolve, reject };
			try {
				ws?.send(payload);
				// fallback: if not acked in 5s, send via REST
				setTimeout(async () => {
					if (pendingMessages.current[clientMessageId]) {
						try {
							const res = await ChatService.sendMessageToGroup(groupId, text);
							pendingMessages.current[clientMessageId].resolve(res.data);
						} catch (err) {
							pendingMessages.current[clientMessageId].reject(err);
						}
						delete pendingMessages.current[clientMessageId];
					}
				}, 5000);
			} catch (err) {
				delete pendingMessages.current[clientMessageId];
				reject(err);
			}
		});
	};

	const inviteRiders = (riderIds: string[]) =>
		RideService.inviteRiders(rideId, riderIds);

	return {
		snapshot,
		sendMessage,
		inviteRiders,
		startWatching,
		stopWatching,
	};
}
