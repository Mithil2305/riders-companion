import React from "react";
import {
	GroupChatItem,
	GroupRideMember,
	InviteActionState,
	InviteFriendItem,
	RiderLocation,
} from "../types/groupChat";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "./useLocation";
import { useWebSocket } from "./useWebSocket";
import ChatService from "../services/ChatService";
import RideService from "../services/RideService";
import TrackerService from "../services/TrackerService";
import ProfileService from "../services/ProfileService";
import {
	createRideInvitePayload,
	serializeRideInviteMessage,
} from "../utils/rideInviteMessage";

const AVATAR_MAP: Record<string, string> = {
	SARAH: "https://randomuser.me/api/portraits/women/65.jpg",
	ARUN: "https://randomuser.me/api/portraits/men/39.jpg",
	CAMERON: "https://i.pravatar.cc/120?img=33",
};

const LOCATION_REFRESH_MINUTES = 15;

const SAMPLE_RIDER_LOCATIONS: RiderLocation[] = [
	{
		riderId: "sample-r1",
		name: "Gandhipuram",
		latitude: 11.0183,
		longitude: 76.9671,
		updatedAt: new Date().toISOString(),
	},
	{
		riderId: "sample-r2",
		name: "Perur",
		latitude: 10.9756,
		longitude: 76.9128,
		updatedAt: new Date().toISOString(),
	},
	{
		riderId: "sample-r3",
		name: "Race Course",
		latitude: 11.0017,
		longitude: 76.9619,
		updatedAt: new Date().toISOString(),
	},
	{
		riderId: "sample-r4",
		name: "RS Puram",
		latitude: 11.0096,
		longitude: 76.9496,
		updatedAt: new Date().toISOString(),
	},
	{
		riderId: "sample-r5",
		name: "Kuniyamuthur",
		latitude: 10.9681,
		longitude: 76.9551,
		updatedAt: new Date().toISOString(),
	},
];

const avatarForName = (name: string) => {
	const mapped = AVATAR_MAP[name.toUpperCase()];
	if (mapped) {
		return mapped;
	}

	return `https://ui-avatars.com/api/?name=${encodeURIComponent(
		name,
	)}&background=0D8ABC&color=fff`;
};

const normalizeToInviteFriendItem = (value: unknown): InviteFriendItem | null => {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const id =
		typeof record.id === "string" && record.id.trim().length > 0
			? record.id.trim()
			: "";
	if (!id) {
		return null;
	}

	const rawName =
		typeof record.name === "string" && record.name.trim().length > 0
			? record.name.trim()
			: "";
	const rawUsername =
		typeof record.username === "string" && record.username.trim().length > 0
			? record.username.trim().replace(/^@+/, "")
			: "";
	const name = rawName || rawUsername || "Rider";
	const avatar =
		typeof record.avatar === "string" && record.avatar.trim().length > 0
			? record.avatar
			: typeof record.profileImageUrl === "string" &&
				  record.profileImageUrl.trim().length > 0
				? record.profileImageUrl
				: typeof record.coverImageUrl === "string" &&
					  record.coverImageUrl.trim().length > 0
					? record.coverImageUrl
					: avatarForName(name);

	return { id, name, username: rawUsername || undefined, avatar };
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

const mapApiMessageToGroupItem = (
	entry: any,
	currentUserId?: string,
): GroupChatItem | null => {
	const text =
		typeof entry?.message === "string" && entry.message.trim().length > 0
			? entry.message
			: typeof entry?.encryptedPayload === "string" &&
				  entry.encryptedPayload.trim().length > 0
				? entry.encryptedPayload
				: null;

	if (!text) {
		return null;
	}

	const senderId = typeof entry?.senderId === "string" ? entry.senderId : null;
	const senderName =
		typeof entry?.senderName === "string" && entry.senderName.trim().length > 0
			? entry.senderName
			: "Rider";
	const createdAt =
		typeof entry?.createdAt === "string"
			? entry.createdAt
			: new Date().toISOString();

	if (senderId && currentUserId && senderId === currentUserId) {
		return {
			id: String(entry.id ?? `out-${Date.now()}-${Math.random()}`),
			kind: "outgoing",
			message: text,
			time: toClockTime(createdAt),
		};
	}

	return {
		id: String(entry.id ?? `in-${Date.now()}-${Math.random()}`),
		kind: "incoming",
		senderName: senderName.toUpperCase(),
		message: text,
		avatar: avatarForName(senderName),
		time: toClockTime(createdAt),
	};
};

const upsertRiderLocation = (
	prev: RiderLocation[],
	nextEntry: RiderLocation,
): RiderLocation[] => {
	const idx = prev.findIndex((item) => item.riderId === nextEntry.riderId);
	if (idx === -1) {
		return [...prev, nextEntry];
	}

	const updated = [...prev];
	updated[idx] = nextEntry;
	return updated;
};

export function useGroupChatScreen(
	roomId: string,
	initialStatus?: string,
	initialRoomName?: string,
) {
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
	const [inviteLoading, setInviteLoading] = React.useState(false);
	const [inviteStateByFriendId, setInviteStateByFriendId] = React.useState<
		Record<string, InviteActionState>
	>({});
	const [inviteCandidates, setInviteCandidates] = React.useState<InviteFriendItem[]>([]);
	const [inviteSearchQuery, setInviteSearchQuery] = React.useState("");
	const [inviteSearchResults, setInviteSearchResults] = React.useState<InviteFriendItem[]>([]);
	const [isInviteSearching, setIsInviteSearching] = React.useState(false);
	const [isAdmin, setIsAdmin] = React.useState(false);
	const [draft, setDraft] = React.useState("");
	const [messages, setMessages] = React.useState<GroupChatItem[]>([]);
	const [riderLocations, setRiderLocations] = React.useState<RiderLocation[]>(
		[],
	);
	const [locationsLastUpdatedAt, setLocationsLastUpdatedAt] = React.useState<
		string | null
	>(null);
	const [locationsRefreshMinutes, setLocationsRefreshMinutes] = React.useState(
		LOCATION_REFRESH_MINUTES,
	);
	const [roomTitle, setRoomTitle] = React.useState(
		initialRoomName && initialRoomName.trim().length > 0
			? initialRoomName
			: `Ride Room ${roomId}`,
	);
	const [roomSubtitle, setRoomSubtitle] = React.useState("0 online • 0 riders");
	const [rideSourceLabel, setRideSourceLabel] =
		React.useState("Current location");
	const [rideDestinationLabel, setRideDestinationLabel] =
		React.useState("Destination");
	const [rideStatus, setRideStatus] = React.useState<string>("PENDING");
	const [rideMembers, setRideMembers] = React.useState<GroupRideMember[]>([]);
	const [organizerProfile, setOrganizerProfile] =
		React.useState<GroupRideMember | null>(null);

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
		let isMounted = true;
		const sanitizedInitialRoomName =
			typeof initialRoomName === "string" && initialRoomName.trim().length > 0
				? initialRoomName
				: null;

		setMessages([]);
		setRiderLocations(SAMPLE_RIDER_LOCATIONS);
		setLocationsLastUpdatedAt(null);
		setRideMembers([]);
		setOrganizerProfile(null);
		setRideSourceLabel("Current location");
		setRideDestinationLabel("Destination");
		setInviteStateByFriendId({});
		setRoomTitle(sanitizedInitialRoomName ?? `Ride Room ${roomId}`);

		ChatService.getRoomMessages(roomId)
			.then((response) => {
				if (!isMounted) {
					return;
				}

				const mapped = (response.messages || [])
					.map((entry) => mapApiMessageToGroupItem(entry, user?.id))
					.filter(Boolean) as GroupChatItem[];

				setMessages(mapped);
			})
			.catch(() => {
				if (!isMounted) {
					return;
				}

				setMessages([]);
			});

		ChatService.getRooms()
			.then((response) => {
				if (!isMounted) {
					return;
				}

				const room = (response.communities || []).find(
					(entry) => String(entry.id) === roomId,
				);

				if (
					room &&
					typeof room.name === "string" &&
					room.name.trim().length > 0
				) {
					setRoomTitle(room.name);
					setRoomSubtitle(`Room #${roomId}`);
					return;
				}

				setRoomTitle(sanitizedInitialRoomName ?? `Ride Room ${roomId}`);
				setRoomSubtitle("Live rider updates");
			})
			.catch(() => {
				if (!isMounted) {
					return;
				}

				setRoomTitle(sanitizedInitialRoomName ?? `Ride Room ${roomId}`);
				setRoomSubtitle("0 online • 0 riders");
			});

		setInviteLoading(true);
		Promise.all([
			ChatService.getPersonalConversations(),
			user?.id ? TrackerService.getFollowers(user.id).catch(() => ({ followers: [] })) : Promise.resolve({ followers: [] }),
			user?.id ? TrackerService.getFollowing(user.id).catch(() => ({ following: [] })) : Promise.resolve({ following: [] }),
		])
			.then(([conversationsResponse, followersResponse, followingResponse]) => {
				if (!isMounted) {
					return;
				}

				const chatCandidates = (conversationsResponse.conversations || [])
					.map((conversation) => {
						const name =
							typeof conversation.meta?.name === "string" &&
							conversation.meta.name.trim().length > 0
								? conversation.meta.name
								: typeof conversation.meta?.username === "string" &&
								  conversation.meta.username.trim().length > 0
									? conversation.meta.username
									: "Rider";

						return {
							id: conversation.id,
							name,
							username: conversation.meta?.username ?? undefined,
							avatar: conversation.meta?.avatar ?? null,
						} as InviteFriendItem;
					});

				const followerCandidates = (followersResponse.followers || [])
					.map(normalizeToInviteFriendItem)
					.filter(Boolean) as InviteFriendItem[];

				const followingCandidates = (followingResponse.following || [])
					.map(normalizeToInviteFriendItem)
					.filter(Boolean) as InviteFriendItem[];

				const mergedMap = new Map<string, InviteFriendItem>();
				for (const item of [...chatCandidates, ...followerCandidates, ...followingCandidates]) {
					if (item.id !== user?.id) {
						mergedMap.set(item.id, item);
					}
				}

				setInviteCandidates([...mergedMap.values()]);
			})
			.catch(() => {
				if (!isMounted) {
					return;
				}

				setInviteCandidates([]);
			})
			.finally(() => {
				if (isMounted) {
					setInviteLoading(false);
				}
			});

		RideService.getRideById(roomId)
			.then((response) => {
				if (!isMounted) {
					return;
				}

				setIsAdmin(Boolean(response.ride?.isOrganizer));
				if (
					typeof response.ride?.communityName === "string" &&
					response.ride.communityName.trim().length > 0
				) {
					setRoomTitle(response.ride.communityName);
				}

				setRideSourceLabel(
					typeof response.ride?.details?.source === "string" &&
						response.ride.details.source.trim().length > 0
						? response.ride.details.source
						: "Current location",
				);
				setRideDestinationLabel(
					typeof response.ride?.details?.destination === "string" &&
						response.ride.details.destination.trim().length > 0
						? response.ride.details.destination
						: "Destination",
				);

				const members = Array.isArray(response.ride?.riderProfiles)
					? response.ride.riderProfiles.map((member) => ({
							id: member.id,
							name: member.name,
							username: member.username,
							avatar: member.avatar,
							bio: member.bio,
							status: member.status,
							isOrganizer: Boolean(member.isOrganizer),
							isFollowing: false,
						}))
					: [];
				setRideMembers(members);

				if (response.ride?.organizerProfile) {
					setOrganizerProfile({
						id: response.ride.organizerProfile.id,
						name: response.ride.organizerProfile.name,
						username: response.ride.organizerProfile.username,
						avatar: response.ride.organizerProfile.avatar,
						bio: response.ride.organizerProfile.bio,
						isOrganizer: true,
						isFollowing: false,
					});
				}

				const status = String(response.ride?.status || "").toUpperCase();
				setRideStatus(status);
				if (status === "COMPLETED") {
					setIsRideEnded(true);
					setLocationEnabled(false);
				}
			})
			.catch(() => {
				if (!isMounted) {
					return;
				}

				setIsAdmin(false);
			});

		return () => {
			isMounted = false;
		};
	}, [initialRoomName, roomId, user?.id]);

	const inviteFriends = React.useMemo(() => {
		const existingMemberIds = new Set(rideMembers.map((member) => member.id));

		return inviteCandidates.filter((friend) => !existingMemberIds.has(friend.id));
	}, [inviteCandidates, rideMembers]);

	const onlineRiders = React.useMemo(() => {
		if (riderLocations.length > 0) {
			return riderLocations.length;
		}

		if (rideMembers.length > 0) {
			return rideMembers.filter((member) => member.status === "STARTED").length;
		}

		return 0;
	}, [rideMembers, riderLocations]);

	const totalRiders = React.useMemo(() => {
		if (rideMembers.length > 0) {
			return rideMembers.length;
		}

		return SAMPLE_RIDER_LOCATIONS.length;
	}, [rideMembers]);

	React.useEffect(() => {
		setRoomSubtitle(`${onlineRiders} online • ${totalRiders} riders`);
	}, [onlineRiders, totalRiders]);

	const fetchRiderLocations = React.useCallback(async () => {
		try {
			const response = await RideService.getRideLocations(roomId);
			const nextLocations =
				Array.isArray(response.locations) && response.locations.length > 0
					? response.locations
					: SAMPLE_RIDER_LOCATIONS;
			setRiderLocations(nextLocations);
			setLocationsRefreshMinutes(
				typeof response.refreshIntervalMinutes === "number" &&
					Number.isFinite(response.refreshIntervalMinutes) &&
					response.refreshIntervalMinutes > 0
					? response.refreshIntervalMinutes
					: LOCATION_REFRESH_MINUTES,
			);
			setLocationsLastUpdatedAt(new Date().toISOString());
		} catch {
			setRiderLocations((prev) =>
				prev.length > 0 ? prev : SAMPLE_RIDER_LOCATIONS,
			);
			setLocationsLastUpdatedAt(new Date().toISOString());
		}
	}, [roomId]);

	React.useEffect(() => {
		if (!locationEnabled || isRideEnded) {
			return;
		}

		void fetchRiderLocations();
		const timer = setInterval(
			() => {
				void fetchRiderLocations();
			},
			LOCATION_REFRESH_MINUTES * 60 * 1000,
		);

		return () => {
			clearInterval(timer);
		};
	}, [fetchRiderLocations, isRideEnded, locationEnabled]);

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

		if (
			lastMessage.type === "RIDE_JOINED" ||
			lastMessage.type === "RIDE_SNAPSHOT"
		) {
			const payload = (lastMessage.payload || {}) as Record<string, any>;
			if (payload.rideId !== roomId) {
				return;
			}

			if (Array.isArray(payload.locations)) {
				setRiderLocations(
					payload.locations.filter(
						(entry: any) =>
							typeof entry?.riderId === "string" &&
							typeof entry?.latitude === "number" &&
							typeof entry?.longitude === "number",
					),
				);
				setLocationsLastUpdatedAt(new Date().toISOString());
			}

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

			if (
				typeof payload.riderId === "string" &&
				typeof payload.latitude === "number" &&
				typeof payload.longitude === "number"
			) {
				setRiderLocations((prev) =>
					upsertRiderLocation(prev, {
						riderId: payload.riderId,
						name:
							typeof payload.name === "string" && payload.name.trim().length > 0
								? payload.name
								: "Rider",
						latitude: payload.latitude,
						longitude: payload.longitude,
						updatedAt:
							typeof payload.updatedAt === "string"
								? payload.updatedAt
								: new Date().toISOString(),
					}),
				);
				setLocationsLastUpdatedAt(new Date().toISOString());
			}

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

		if (isConnected) {
			sendWsMessage("CHAT_SEND_MESSAGE", {
				roomId,
				message: trimmed,
			});
		} else {
			void ChatService.sendMessage(roomId, trimmed).catch(() => {
				// Keep optimistic message if send retry fails.
			});
		}

		typingStateRef.current = false;
		sendWsMessage("CHAT_TYPING", {
			roomId,
			isTyping: false,
		});

		setDraft("");
	}, [draft, isConnected, isRideEnded, roomId, sendWsMessage]);

	const endRide = React.useCallback(() => {
		if (!isAdmin || isRideEnded) {
			setMenuVisible(false);
			return;
		}

		void RideService.endRide(roomId)
			.then(() => {
				setIsRideEnded(true);
				setLocationEnabled(false);
				setDraft("");
				typingStateRef.current = false;
				setMenuVisible(false);
			})
			.catch(() => {
				setMenuVisible(false);
			});
	}, [isAdmin, isRideEnded, roomId]);

	const inviteFromMenu = React.useCallback(() => {
		if (isRideEnded) {
			closeMenu();
			return;
		}

		closeMenu();
		openInvite();
	}, [closeMenu, isRideEnded, openInvite]);

	const searchInviteCandidates = React.useCallback(
		async (query: string) => {
			const trimmed = query.trim();
			setInviteSearchQuery(trimmed);
			if (!trimmed) {
				setInviteSearchResults([]);
				return;
			}

			setIsInviteSearching(true);
			try {
				const response = await ProfileService.searchRiders(trimmed);
				const results = (response.users || [])
					.map(normalizeToInviteFriendItem)
					.filter((item): item is InviteFriendItem => Boolean(item && item.id !== user?.id));
				setInviteSearchResults(results);
			} catch {
				setInviteSearchResults([]);
			} finally {
				setIsInviteSearching(false);
			}
		},
		[user?.id],
	);

	const sendRideInvite = React.useCallback(
		async (friend: InviteFriendItem) => {
			if (isRideEnded || !friend.id || !user?.id) {
				return;
			}

			setInviteStateByFriendId((prev) => ({
				...prev,
				[friend.id]: "sending",
			}));

			const invitePayload = createRideInvitePayload({
				rideId: roomId,
				roomName: roomTitle,
				inviterId: user.id,
				inviterName: user.name || user.username || "Rider",
			});

			try {
				await ChatService.sendPersonalMessage(friend.id, {
					kind: "text",
					text: serializeRideInviteMessage(invitePayload),
				});

				setInviteStateByFriendId((prev) => ({
					...prev,
					[friend.id]: "sent",
				}));
			} catch {
				setInviteStateByFriendId((prev) => ({
					...prev,
					[friend.id]: "idle",
				}));
			}
		},
		[isRideEnded, roomId, roomTitle, user?.id, user?.name, user?.username],
	);

	const toggleTrackRider = React.useCallback((riderId: string) => {
		if (!riderId) {
			return;
		}

		const nextTracking = !rideMembers.find((member) => member.id === riderId)?.isFollowing;

		void (nextTracking
			? TrackerService.trackRider(riderId)
			: TrackerService.untrackRider(riderId))
			.then(() => {
				setRideMembers((prev) =>
					prev.map((member) =>
						member.id === riderId
							? { ...member, isFollowing: nextTracking }
							: member,
					),
				);
			})
			.catch(() => {
				// Keep UI stable when track state update fails.
			});
	}, [rideMembers]);

	return {
		menuVisible,
		inviteVisible,
		locationEnabled,
		isRideEnded,
		isAdmin,
		draft,
		messages,
		riderLocations,
		locationsLastUpdatedAt,
		locationsRefreshMinutes,
		roomTitle,
		roomSubtitle,
		rideSourceLabel,
		rideDestinationLabel,
		rideStatus,
		onlineRiders,
		totalRiders,
		rideMembers,
		organizerProfile,
		setDraft: setDraftWithTyping,
		setLocationEnabled,
		isConnected,
		openMenu,
		closeMenu,
		openInvite,
		closeInvite,
		inviteFromMenu,
		inviteFriends,
		inviteLoading,
		inviteStateByFriendId,
		inviteSearchQuery,
		inviteSearchResults,
		isInviteSearching,
		searchInviteCandidates,
		sendRideInvite,
		toggleTrackRider,
		endRide,
		sendMessage,
	};
}
