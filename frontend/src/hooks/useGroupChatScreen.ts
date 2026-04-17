import React from "react";
import { GroupChatItem } from "../types/groupChat";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "./useLocation";
import { useWebSocket } from "./useWebSocket";

const INITIAL_CHAT: GroupChatItem[] = [
	{
		id: "1",
		kind: "system",
		text: "JOHN STARTED THE RIDE",
	},
	{
		id: "2",
		kind: "incoming",
		senderName: "SARAH",
		message:
			"Checkpoints look good. I'm hitting the highway now. Everyone ready?",
		avatar: "https://randomuser.me/api/portraits/women/65.jpg",
		time: "08:42 AM",
	},
	{
		id: "3",
		kind: "incoming-location",
		senderName: "ARUN",
		message: "I'm taking a quick break near Vellore. Catching up in 10!",
		avatar: "https://randomuser.me/api/portraits/men/39.jpg",
		time: "08:45 AM",
		locationLabel: "Vellore Bypass",
	},
	{
		id: "4",
		kind: "outgoing",
		message:
			"Copy that, Arun. We are about 15 mins behind you. Keeping a steady 80kmph.",
		time: "08:47 AM",
	},
	{
		id: "5",
		kind: "incoming",
		senderName: "SARAH",
		message:
			"Found a great breakfast spot at the next toll. Let's regroup there!",
		avatar: "https://randomuser.me/api/portraits/women/65.jpg",
		time: "08:50 AM",
	},
];

export const INVITE_FRIENDS = [
	"Cameron Williamson",
	"Annette Black",
	"Marvin McKinney",
	"Brooklyn Simmons",
];

const AVATAR_MAP: Record<string, string> = {
	SARAH: "https://randomuser.me/api/portraits/women/65.jpg",
	ARUN: "https://randomuser.me/api/portraits/men/39.jpg",
	CAMERON: "https://i.pravatar.cc/120?img=33",
};

const toClockTime = (isoDate: string) => {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const hour = `${date.getHours()}`.padStart(2, "0");
	const minute = `${date.getMinutes()}`.padStart(2, "0");
	return `${hour}:${minute}`;
};

const ENDED_ROOM_IDS = new Set(["3"]);

export function useGroupChatScreen(roomId: string, initialStatus?: string) {
	const { user } = useAuth();
	const { location, startWatching, getCurrentLocation } = useLocation({
		autoRequest: false,
	});

	const {
		isConnected,
		lastMessage,
		sendMessage: sendWsMessage,
	} = useWebSocket();

	const [menuVisible, setMenuVisible] = React.useState(false);
	const [inviteVisible, setInviteVisible] = React.useState(false);
	const [isRideEnded, setIsRideEnded] = React.useState(
		initialStatus === "ended" || ENDED_ROOM_IDS.has(roomId),
	);
	const [locationEnabled, setLocationEnabled] = React.useState(
		!(initialStatus === "ended" || ENDED_ROOM_IDS.has(roomId)),
	);
	const [isAdmin] = React.useState(true);
	const [draft, setDraft] = React.useState("");
	const [messages, setMessages] = React.useState<GroupChatItem[]>(INITIAL_CHAT);

	const typingStateRef = React.useRef(false);

	const closeMenu = React.useCallback(() => setMenuVisible(false), []);
	const openMenu = React.useCallback(() => setMenuVisible(true), []);
	const openInvite = React.useCallback(() => setInviteVisible(true), []);
	const closeInvite = React.useCallback(() => setInviteVisible(false), []);

	React.useEffect(() => {
		const ended = initialStatus === "ended" || ENDED_ROOM_IDS.has(roomId);
		setIsRideEnded(ended);
		if (ended) {
			setLocationEnabled(false);
		}
	}, [initialStatus, roomId]);

	React.useEffect(() => {
		if (!isConnected || roomId.length === 0) {
			return;
		}

		sendWsMessage("CHAT_JOIN_ROOM", { roomId });

		return () => {
			sendWsMessage("CHAT_LEAVE_ROOM", { roomId });
		};
	}, [isConnected, roomId, sendWsMessage]);

	React.useEffect(() => {
		if (
			!isConnected ||
			roomId.length === 0 ||
			!locationEnabled ||
			isRideEnded
		) {
			return;
		}

		sendWsMessage("RIDE_JOIN", { rideId: roomId });

		return () => {
			sendWsMessage("RIDE_LEAVE", { rideId: roomId });
		};
	}, [isConnected, isRideEnded, roomId, locationEnabled, sendWsMessage]);

	React.useEffect(() => {
		if (
			!isConnected ||
			!locationEnabled ||
			roomId.length === 0 ||
			isRideEnded
		) {
			return;
		}

		let watcher: { remove: () => void } | null = null;
		void getCurrentLocation();

		startWatching()
			.then((subscription) => {
				watcher = subscription;
			})
			.catch(() => {
				// Keep chat functional if location permission is denied.
			});

		return () => {
			watcher?.remove();
		};
	}, [
		getCurrentLocation,
		isConnected,
		isRideEnded,
		locationEnabled,
		roomId,
		startWatching,
	]);

	React.useEffect(() => {
		if (
			!locationEnabled ||
			!location ||
			!isConnected ||
			roomId.length === 0 ||
			isRideEnded
		) {
			return;
		}

		sendWsMessage("LOCATION_UPDATE", {
			rideId: roomId,
			latitude: location.latitude,
			longitude: location.longitude,
			accuracy: location.accuracy,
		});
	}, [
		isConnected,
		isRideEnded,
		location,
		locationEnabled,
		roomId,
		sendWsMessage,
	]);

	React.useEffect(() => {
		if (!lastMessage || typeof lastMessage.type !== "string") {
			return;
		}

		if (lastMessage.type === "CHAT_MESSAGE") {
			const payload = (lastMessage.payload || {}) as Record<string, any>;
			if (payload.roomId !== roomId) {
				return;
			}

			if (payload.senderId && payload.senderId === user?.id) {
				return;
			}

			const senderName =
				typeof payload.senderName === "string" &&
				payload.senderName.trim().length > 0
					? payload.senderName.toUpperCase()
					: "RIDER";

			const text =
				typeof payload.message === "string" && payload.message.trim().length > 0
					? payload.message
					: typeof payload.encryptedPayload === "string" &&
						  payload.encryptedPayload.trim().length > 0
						? payload.encryptedPayload
						: "[encrypted]";

			setMessages((prev) => [
				...prev,
				{
					id: String(payload.id ?? `in-${Date.now()}`),
					kind: "incoming",
					senderName,
					message: text,
					avatar: AVATAR_MAP[senderName] ?? "https://i.pravatar.cc/120?img=32",
					time:
						typeof payload.createdAt === "string"
							? toClockTime(payload.createdAt)
							: toClockTime(new Date().toISOString()),
				},
			]);

			return;
		}

		if (lastMessage.type === "LOCATION_UPDATE") {
			const payload = (lastMessage.payload || {}) as Record<string, any>;
			if (payload.rideId !== roomId) {
				return;
			}

			if (payload.riderId && payload.riderId === user?.id) {
				return;
			}

			const senderName =
				typeof payload.name === "string" && payload.name.trim().length > 0
					? payload.name.toUpperCase()
					: "RIDER";

			setMessages((prev) => [
				...prev,
				{
					id: `loc-${Date.now()}`,
					kind: "incoming-location",
					senderName,
					message: `${senderName} updated live location`,
					avatar: AVATAR_MAP[senderName] ?? "https://i.pravatar.cc/120?img=32",
					time:
						typeof payload.updatedAt === "string"
							? toClockTime(payload.updatedAt)
							: toClockTime(new Date().toISOString()),
					locationLabel:
						typeof payload.latitude === "number" &&
						typeof payload.longitude === "number"
							? `${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`
							: "Live location update",
				},
			]);

			return;
		}

		if (lastMessage.type === "SOS_ALERT") {
			const payload = (lastMessage.payload || {}) as Record<string, any>;
			if (payload.rideId !== roomId) {
				return;
			}

			const riderName =
				typeof payload.name === "string" && payload.name.trim().length > 0
					? payload.name.toUpperCase()
					: "A RIDER";

			setMessages((prev) => [
				...prev,
				{
					id: `sos-${Date.now()}`,
					kind: "system",
					text: `${riderName} TRIGGERED SOS`,
				},
			]);
		}

		if (lastMessage.type === "RIDE_ENDED") {
			const payload = (lastMessage.payload || {}) as Record<string, any>;
			if (payload.rideId !== roomId) {
				return;
			}

			setIsRideEnded(true);
			setLocationEnabled(false);
			setDraft("");
			typingStateRef.current = false;
		}
	}, [lastMessage, roomId, user?.id]);

	const setDraftWithTyping = React.useCallback(
		(value: string) => {
			if (isRideEnded) {
				return;
			}

			setDraft(value);

			const shouldType = value.trim().length > 0;
			if (typingStateRef.current !== shouldType) {
				typingStateRef.current = shouldType;
				sendWsMessage("CHAT_TYPING", {
					roomId,
					isTyping: shouldType,
				});
			}
		},
		[isRideEnded, roomId, sendWsMessage],
	);

	const sendMessage = React.useCallback(() => {
		if (isRideEnded) {
			return;
		}

		const trimmed = draft.trim();
		if (!trimmed) {
			return;
		}

		const now = new Date();
		const hour = `${now.getHours()}`.padStart(2, "0");
		const minute = `${now.getMinutes()}`.padStart(2, "0");

		setMessages((prev) => [
			...prev,
			{
				id: `out-${Date.now()}`,
				kind: "outgoing",
				message: trimmed,
				time: `${hour}:${minute}`,
			},
		]);

		sendWsMessage("CHAT_SEND_MESSAGE", {
			roomId,
			message: trimmed,
		});

		typingStateRef.current = false;
		sendWsMessage("CHAT_TYPING", {
			roomId,
			isTyping: false,
		});

		setDraft("");
	}, [draft, isRideEnded, roomId, sendWsMessage]);

	const endRide = React.useCallback(() => {
		setIsRideEnded(true);
		setLocationEnabled(false);
		setDraft("");
		typingStateRef.current = false;
		sendWsMessage("RIDE_END", { rideId: roomId });
		setMenuVisible(false);
	}, [roomId, sendWsMessage]);

	const inviteFromMenu = React.useCallback(() => {
		if (isRideEnded) {
			closeMenu();
			return;
		}

		closeMenu();
		openInvite();
	}, [closeMenu, isRideEnded, openInvite]);

	return {
		menuVisible,
		inviteVisible,
		locationEnabled,
		isRideEnded,
		isAdmin,
		draft,
		messages,
		setDraft: setDraftWithTyping,
		setLocationEnabled,
		isConnected,
		openMenu,
		closeMenu,
		openInvite,
		closeInvite,
		inviteFromMenu,
		endRide,
		sendMessage,
	};
}
