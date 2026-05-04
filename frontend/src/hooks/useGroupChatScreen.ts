import React, { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { useLocation } from "./useLocation";
import { useAuth } from "../contexts/AuthContext";
import RideService from "../services/RideService";
import ChatService from "../services/ChatService";
import TrackerService from "../services/TrackerService";
import ProfileService from "../services/ProfileService";
import {
	RiderLocation,
	RideSnapshot,
	GroupChatItem,
	GroupRideMember,
	InviteFriendItem,
	InviteActionState,
	RideRouteMeta,
} from "../types/groupChat";
import { isUuid } from "../utils/isUuid";

const AVATAR_MAP: Record<string, string> = {
	SARAH: "https://randomuser.me/api/portraits/women/65.jpg",
	ARUN: "https://randomuser.me/api/portraits/men/39.jpg",
	CAMERON: "https://i.pravatar.cc/120?img=33",
};

const LOCATION_SEND_MIN_INTERVAL_MS = 2200;
const LOCATION_SEND_MIN_DISTANCE_METERS = 4;
const RIDE_SYSTEM_PREFIX = "[RIDE_SYSTEM]";

const avatarForName = (name: string): string => {
	const mapped = AVATAR_MAP[name.toUpperCase()];
	if (mapped) {
		return mapped;
	}

	return `https://ui-avatars.com/api/?name=${encodeURIComponent(
		name,
	)}&background=0D8ABC&color=fff`;
};

const toClockTime = (isoDate: string): string => {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const hour = `${date.getHours()}`.padStart(2, "0");
	const minute = `${date.getMinutes()}`.padStart(2, "0");
	return `${hour}:${minute}`;
};

const haversineMeters = (
	from: { latitude: number; longitude: number },
	to: { latitude: number; longitude: number },
): number => {
	const toRad = (value: number) => (value * Math.PI) / 180;
	const earthRadius = 6371000;

	const dLat = toRad(to.latitude - from.latitude);
	const dLon = toRad(to.longitude - from.longitude);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(from.latitude)) *
			Math.cos(toRad(to.latitude)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return earthRadius * c;
};

const normalizeToInviteFriendItem = (
	value: unknown,
): InviteFriendItem | null => {
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

const normalizeRiderLocation = (
	value: unknown,
	fallbackRideId: string,
): RiderLocation | null => {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	if (
		typeof record.riderId !== "string" ||
		typeof record.latitude !== "number" ||
		typeof record.longitude !== "number"
	) {
		return null;
	}

	const timestamp =
		typeof record.timestamp === "string"
			? record.timestamp
			: typeof record.updatedAt === "string"
				? record.updatedAt
				: new Date().toISOString();

	const rideId =
		typeof record.rideId === "string" && record.rideId.length > 0
			? record.rideId
			: fallbackRideId;

	return {
		rideId,
		riderId: record.riderId,
		name:
			typeof record.name === "string" && record.name.trim().length > 0
				? record.name
				: "Rider",
		username: typeof record.username === "string" ? record.username : null,
		latitude: record.latitude,
		longitude: record.longitude,
		deviceSpeedKmh:
			typeof record.deviceSpeedKmh === "number" ? record.deviceSpeedKmh : null,
		speed: typeof record.speed === "number" ? record.speed : null,
		averageSpeedKmh:
			typeof record.averageSpeedKmh === "number"
				? record.averageSpeedKmh
				: null,
		heading: typeof record.heading === "number" ? record.heading : null,
		accuracy: typeof record.accuracy === "number" ? record.accuracy : null,
		altitude: typeof record.altitude === "number" ? record.altitude : null,
		timestamp,
		updatedAt:
			typeof record.updatedAt === "string" ? record.updatedAt : timestamp,
		isLeader: Boolean(record.isLeader),
		isOnline:
			typeof record.isOnline === "boolean" ? record.isOnline : undefined,
		rideStatus:
			typeof record.rideStatus === "string" ? record.rideStatus : undefined,
		participantStatus:
			typeof record.participantStatus === "string"
				? record.participantStatus
				: undefined,
		avatar:
			typeof record.avatar === "string" && record.avatar.trim().length > 0
				? record.avatar
				: typeof record.profileImageUrl === "string" &&
					  record.profileImageUrl.trim().length > 0
					? record.profileImageUrl
					: null,
	};
};

const normalizeRoute = (value: unknown): RideRouteMeta => {
	const fallback: RideRouteMeta = {
		source: null,
		destination: null,
		sourceCoordinates: null,
		destinationCoordinates: null,
		routePolyline: [],
	};

	if (!value || typeof value !== "object") {
		return fallback;
	}

	const route = value as Record<string, unknown>;
	const sourceCoordinates =
		route.sourceCoordinates &&
		typeof route.sourceCoordinates === "object" &&
		typeof (route.sourceCoordinates as Record<string, unknown>).latitude ===
			"number" &&
		typeof (route.sourceCoordinates as Record<string, unknown>).longitude ===
			"number"
			? {
					latitude: (route.sourceCoordinates as Record<string, unknown>)
						.latitude as number,
					longitude: (route.sourceCoordinates as Record<string, unknown>)
						.longitude as number,
				}
			: null;

	const destinationCoordinates =
		route.destinationCoordinates &&
		typeof route.destinationCoordinates === "object" &&
		typeof (route.destinationCoordinates as Record<string, unknown>)
			.latitude === "number" &&
		typeof (route.destinationCoordinates as Record<string, unknown>)
			.longitude === "number"
			? {
					latitude: (route.destinationCoordinates as Record<string, unknown>)
						.latitude as number,
					longitude: (route.destinationCoordinates as Record<string, unknown>)
						.longitude as number,
				}
			: null;

	const routePolyline = Array.isArray(route.routePolyline)
		? route.routePolyline.filter(
				(point): point is { latitude: number; longitude: number } =>
					typeof point === "object" &&
					point !== null &&
					typeof (point as Record<string, unknown>).latitude === "number" &&
					typeof (point as Record<string, unknown>).longitude === "number",
			)
		: [];

	return {
		source: typeof route.source === "string" ? route.source : null,
		destination:
			typeof route.destination === "string" ? route.destination : null,
		sourceCoordinates,
		destinationCoordinates,
		routePolyline,
	};
};

const parseRideSystemMessage = (value: unknown): string | null => {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed.startsWith(RIDE_SYSTEM_PREFIX)) {
		return null;
	}

	const text = trimmed.slice(RIDE_SYSTEM_PREFIX.length).trim();
	return text.length > 0 ? text : null;
};

const mapApiMessageToGroupItem = (
	entry: Record<string, unknown>,
	currentUserId?: string,
	riderProfilesById?: Map<
		string,
		{
			name: string;
			avatar: string;
			username?: string | null;
			isOnline?: boolean;
		}
	>,
): GroupChatItem | null => {
	const text =
		typeof entry.message === "string" && entry.message.trim().length > 0
			? entry.message
			: typeof entry.encryptedPayload === "string" &&
				  entry.encryptedPayload.trim().length > 0
				? entry.encryptedPayload
				: null;

	if (!text) {
		return null;
	}

	const senderId = typeof entry.senderId === "string" ? entry.senderId : null;
	const knownSender =
		senderId && riderProfilesById?.has(senderId)
			? riderProfilesById.get(senderId)
			: null;
	const senderName =
		typeof entry.senderName === "string" && entry.senderName.trim().length > 0
			? entry.senderName
			: (knownSender?.name ?? "Rider");
	const senderAvatar =
		typeof entry.senderAvatar === "string" &&
		entry.senderAvatar.trim().length > 0
			? entry.senderAvatar
			: (knownSender?.avatar ?? avatarForName(senderName));
	const createdAt =
		typeof entry.createdAt === "string"
			? entry.createdAt
			: new Date().toISOString();
	const systemMessage = parseRideSystemMessage(text);

	if (systemMessage) {
		return {
			id: String(entry.id ?? `system-${Date.now()}-${Math.random()}`),
			kind: "system",
			text: systemMessage,
			time: toClockTime(createdAt),
		};
	}

	if (senderId && currentUserId && senderId === currentUserId) {
		return {
			id: String(entry.id ?? `out-${Date.now()}-${Math.random()}`),
			kind: "outgoing",
			message: text,
			time: toClockTime(createdAt),
			createdAt,
			status: "sent",
		};
	}

	return {
		id: String(entry.id ?? `in-${Date.now()}-${Math.random()}`),
		kind: "incoming",
		senderId: senderId ?? undefined,
		senderName: senderName,
		message: text,
		avatar: senderAvatar,
		time: toClockTime(createdAt),
		createdAt,
		isOnline: knownSender?.isOnline,
	};
};

export function useGroupChatScreen(
	roomId: string,
	initialStatus?: string,
	initialRoomName?: string,
) {
	const { user } = useAuth();
	const {
		location,
		startWatching,
		stopWatching,
		getCurrentLocation,
		hasPermission,
		error: locationError,
	} = useLocation({
		autoRequest: false,
	});

	const {
		isConnected,
		lastMessage,
		sendMessage: sendWsMessage,
		connectionState,
	} = useWebSocket();

	const [menuVisible, setMenuVisible] = useState(false);
	const [inviteVisible, setInviteVisible] = useState(false);
	const [isRideEnded, setIsRideEnded] = useState(initialStatus === "ended");
	const [locationEnabled, setLocationEnabled] = useState(
		initialStatus !== "ended",
	);
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteStateByFriendId, setInviteStateByFriendId] = useState<
		Record<string, InviteActionState>
	>({});
	const [inviteCandidates, setInviteCandidates] = useState<InviteFriendItem[]>(
		[],
	);
	const [inviteSearchQuery, setInviteSearchQuery] = useState("");
	const [inviteSearchResults, setInviteSearchResults] = useState<
		InviteFriendItem[]
	>([]);
	const [isInviteSearching, setIsInviteSearching] = useState(false);
	const [inviteToast, setInviteToast] = useState<string | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [draft, setDraft] = useState("");
	const [messages, setMessages] = useState<GroupChatItem[]>([]);
	const [riderLocations, setRiderLocations] = useState<RiderLocation[]>([]);
	const [locationsLastUpdatedAt, setLocationsLastUpdatedAt] = useState<
		string | null
	>(null);
	const [roomTitle, setRoomTitle] = useState(
		initialRoomName && initialRoomName.trim().length > 0
			? initialRoomName
			: `Ride Room ${roomId}`,
	);
	const [roomSubtitle, setRoomSubtitle] = useState("Connecting...");
	const [rideSourceLabel, setRideSourceLabel] = useState("Current location");
	const [rideDestinationLabel, setRideDestinationLabel] =
		useState("Destination");
	const [rideRoute, setRideRoute] = useState<RideRouteMeta>(() =>
		normalizeRoute(undefined),
	);
	const [rideStatus, setRideStatus] = useState<string>("PENDING");
	const [rideMembers, setRideMembers] = useState<GroupRideMember[]>([]);
	const [organizerProfile, setOrganizerProfile] =
		useState<GroupRideMember | null>(null);
	const [mapLoading, setMapLoading] = useState(true);
	const [mapError, setMapError] = useState<string | null>(null);
	const [typingRiders, setTypingRiders] = useState<string[]>([]);
	const [riderProfilesById, setRiderProfilesById] = useState<
		Map<
			string,
			{
				name: string;
				avatar: string;
				username?: string | null;
				isOnline?: boolean;
			}
		>
	>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [isError, setIsError] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const isValidRoomId = isUuid(roomId);

	const knownMessageIdsRef = useRef<Set<string>>(new Set());
	const riderProfilesByIdRef = useRef(riderProfilesById);
	const typingStateRef = useRef(false);
	const inviteToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastLocationSentAtRef = useRef(0);
	const lastSentCoordRef = useRef<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const previousConnectionRef = useRef(false);

	useEffect(() => {
		riderProfilesByIdRef.current = riderProfilesById;
	}, [riderProfilesById]);

	const closeMenu = useCallback(() => setMenuVisible(false), []);
	const openMenu = useCallback(() => setMenuVisible(true), []);
	const openInvite = useCallback(() => setInviteVisible(true), []);
	const closeInvite = useCallback(() => setInviteVisible(false), []);

	useEffect(() => {
		return () => {
			if (inviteToastTimeoutRef.current) {
				clearTimeout(inviteToastTimeoutRef.current);
			}
		};
	}, []);

	const applySnapshot = useCallback(
		(snapshot: RideSnapshot) => {
			const nextRideStatus = String(
				snapshot.rideStatus || "PENDING",
			).toUpperCase();
			setRideStatus(nextRideStatus);
			setIsRideEnded(nextRideStatus === "COMPLETED");
			setRideRoute(normalizeRoute(snapshot.route));
			setRideSourceLabel(snapshot.route.source || "Current location");
			setRideDestinationLabel(snapshot.route.destination || "Destination");

			const locations = snapshot.locations
				.map((entry: any) => normalizeRiderLocation(entry, roomId))
				.filter((entry): entry is RiderLocation => entry !== null);
			setRiderLocations(locations);
			setLocationsLastUpdatedAt(
				snapshot.snapshotAt || new Date().toISOString(),
			);

			// Build riderProfilesById Map from snapshot participants
			const profilesMap = new Map<
				string,
				{
					name: string;
					avatar: string;
					username?: string | null;
					isOnline?: boolean;
				}
			>();
			snapshot.participants.forEach((participant: any) => {
				profilesMap.set(participant.riderId, {
					name: participant.name || "Rider",
					avatar:
						participant.avatar && participant.avatar.trim().length > 0
							? participant.avatar
							: avatarForName(participant.name || "Rider"),
					username: participant.username || null,
					isOnline: participant.isOnline,
				});
			});
			setRiderProfilesById(profilesMap);

			setRideMembers((prev) => {
				const map = new Map<string, GroupRideMember>();
				prev.forEach((member) => map.set(member.id, member));

				snapshot.participants.forEach((participant) => {
					const existing = map.get(participant.riderId);
					const location = locations.find(
						(l) => l.riderId === participant.riderId,
					);

					map.set(participant.riderId, {
						id: participant.riderId,
						name: participant.name,
						username: participant.username,
						avatar: avatarForName(participant.name),
						bio: "",
						status: participant.participantStatus || "active",
						isOrganizer: participant.isLeader ?? false,
						isFollowing: existing?.isFollowing ?? false,
						isOnline: location?.isOnline ?? true,
						distanceFromLeaderMeters:
							location && lastSentCoordRef.current
								? haversineMeters(lastSentCoordRef.current, location)
								: null,
					});
				});

				return [...map.values()];
			});

			setMapError(null);
			setMapLoading(false);
		},
		[roomId],
	);

	const requestSnapshot = useCallback(async () => {
		if (!isValidRoomId) {
			setMapLoading(false);
			setMapError("Invalid ride ID.");
			return;
		}

		setMapLoading(true);
		setMapError(null);

		try {
			const response = await RideService.getRideSnapshot(roomId);
			if (response.snapshot) {
				applySnapshot(response.snapshot as unknown as RideSnapshot);
			}
		} catch {
			setMapError("Unable to load ride snapshot. Pull to retry or reconnect.");
			setMapLoading(false);
		}
	}, [applySnapshot, isValidRoomId, roomId]);

	// Initialize room data
	useEffect(() => {
		let isMounted = true;
		const sanitizedInitialRoomName =
			typeof initialRoomName === "string" && initialRoomName.trim().length > 0
				? initialRoomName
				: null;

		if (!isValidRoomId) {
			setIsLoading(false);
			setIsError(true);
			setErrorMessage("Invalid ride ID.");
			setRoomTitle(sanitizedInitialRoomName ?? "Ride Room");
			return () => {
				isMounted = false;
			};
		}

		// Reset loading and error states
		setIsLoading(true);
		setIsError(false);
		setErrorMessage(null);

		setMessages([]);
		setRiderLocations([]);
		setLocationsLastUpdatedAt(null);
		setRideMembers([]);
		setOrganizerProfile(null);
		setInviteStateByFriendId({});
		setRoomTitle(sanitizedInitialRoomName ?? `Ride Room ${roomId}`);
		knownMessageIdsRef.current.clear();

		void Promise.all([
			ChatService.getRoomMessages(roomId),
			RideService.getRideSnapshot(roomId),
		])
			.then(([messagesResponse, snapshotResponse]) => {
				if (!isMounted) return;

				// Build riderProfilesById from snapshot if available
				const profilesMap = new Map<
					string,
					{
						name: string;
						avatar: string;
						username?: string | null;
						isOnline?: boolean;
					}
				>();
				if (snapshotResponse.snapshot?.participants) {
					const snapshot = snapshotResponse.snapshot as any;
					snapshot.participants.forEach((participant: any) => {
						profilesMap.set(participant.riderId, {
							name: participant.name || "Rider",
							avatar:
								participant.avatar && participant.avatar.trim().length > 0
									? participant.avatar
									: avatarForName(participant.name || "Rider"),
							username: participant.username || null,
							isOnline: participant.isOnline,
						});
					});
					setRiderProfilesById(profilesMap);
				}

				const mapped = (messagesResponse.messages || [])
					.map((entry) =>
						mapApiMessageToGroupItem(
							entry as Record<string, unknown>,
							user?.id,
							profilesMap,
						),
					)
					.filter(Boolean) as GroupChatItem[];

				setMessages(mapped);
				knownMessageIdsRef.current = new Set(
					mapped.map((item) => item.id).filter((value) => value.length > 0),
				);
			})
			.catch(() => {
				if (!isMounted) return;
				setMessages([]);
			});

		void RideService.getRideById(roomId)
			.then((response) => {
				if (!isMounted) return;

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
					? response.ride.riderProfiles.map((member: any) => ({
							id: member.id,
							name: member.name,
							username: member.username,
							avatar: member.avatar || avatarForName(member.name),
							bio: member.bio || "",
							status: member.status || "active",
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
						avatar:
							response.ride.organizerProfile.avatar ||
							avatarForName(response.ride.organizerProfile.name),
						bio: response.ride.organizerProfile.bio || "",
						status: "active",
						isOrganizer: true,
						isFollowing: false,
					});
				}

				const status = String(response.ride?.status || "").toUpperCase();
				setRideStatus(status);
				setIsRideEnded(status === "COMPLETED");
				if (status === "COMPLETED") {
					setLocationEnabled(false);
				}
			})
			.catch(() => {
				if (!isMounted) return;
				setIsAdmin(false);
			});

		setInviteLoading(true);
		void Promise.all([
			ChatService.getPersonalConversations(),
			user?.id
				? TrackerService.getFollowers(user.id).catch(() => ({ followers: [] }))
				: Promise.resolve({ followers: [] }),
			user?.id
				? TrackerService.getFollowing(user.id).catch(() => ({ following: [] }))
				: Promise.resolve({ following: [] }),
		])
			.then(([conversationsResponse, followersResponse, followingResponse]) => {
				if (!isMounted) return;

				const chatCandidates = (conversationsResponse.conversations || []).map(
					(conversation: any) => {
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
							avatar: conversation.meta?.avatar ?? avatarForName(name),
						} as InviteFriendItem;
					},
				);

				const followerCandidates = (followersResponse.followers || [])
					.map(normalizeToInviteFriendItem)
					.filter(Boolean) as InviteFriendItem[];

				const followingCandidates = (followingResponse.following || [])
					.map(normalizeToInviteFriendItem)
					.filter(Boolean) as InviteFriendItem[];

				const mergedMap = new Map<string, InviteFriendItem>();
				for (const item of [
					...chatCandidates,
					...followerCandidates,
					...followingCandidates,
				]) {
					if (item.id !== user?.id) {
						mergedMap.set(item.id, item);
					}
				}

				setInviteCandidates([...mergedMap.values()]);
			})
			.catch(() => {
				if (!isMounted) return;
				setInviteCandidates([]);
			})
			.finally(() => {
				if (isMounted) {
					setInviteLoading(false);
				}
			});

		// Request snapshot and handle loading completion
		void requestSnapshot()
			.then(() => {
				if (!isMounted) return;
				setIsLoading(false);
			})
			.catch((error) => {
				if (!isMounted) return;
				console.error("[useGroupChatScreen] Failed to load snapshot:", error);
				setIsLoading(false);
				// Don't set as critical error - chat can still work without map
			});

		// Set a timeout to ensure loading state doesn't get stuck
		const loadingTimeout = setTimeout(() => {
			if (isMounted) {
				setIsLoading(false);
			}
		}, 10000); // 10 second timeout

		return () => {
			isMounted = false;
			clearTimeout(loadingTimeout);
		};
	}, [initialRoomName, isValidRoomId, roomId, requestSnapshot, user?.id]);

	// Update room subtitle based on connection and riders
	useEffect(() => {
		const onlineRiders = riderLocations.filter(
			(entry) => entry.isOnline !== false,
		).length;
		const totalRiders =
			rideMembers.length > 0 ? rideMembers.length : riderLocations.length;

		if (connectionState === "reconnecting") {
			setRoomSubtitle("Reconnecting...");
			return;
		}

		if (typingRiders.length > 0) {
			const names = typingRiders.slice(0, 2).join(", ");
			const suffix =
				typingRiders.length > 2 ? ` +${typingRiders.length - 2} more` : "";
			setRoomSubtitle(`${names}${suffix} is typing...`);
			return;
		}

		setRoomSubtitle(`${onlineRiders} online • ${totalRiders} riders`);
	}, [connectionState, rideMembers.length, riderLocations, typingRiders]);

	const isRideLive = React.useMemo(
		() => String(rideStatus).toUpperCase() === "ACTIVE",
		[rideStatus],
	);

	// Join room via WebSocket
	useEffect(() => {
		if (!isConnected || !isValidRoomId) return;

		sendWsMessage("CHAT_JOIN_ROOM", { roomId });
		sendWsMessage("RIDE_JOIN", { rideId: roomId });
		sendWsMessage("RIDE_SNAPSHOT", { rideId: roomId });

		return () => {
			sendWsMessage("CHAT_LEAVE_ROOM", { roomId });
		};
	}, [isConnected, isValidRoomId, roomId, sendWsMessage]);

	// Location watching
	useEffect(() => {
		if (!isConnected || !locationEnabled || isRideEnded || !isRideLive) return;

		void getCurrentLocation();
		void startWatching().catch(() => {
			// Keep chat functional if location permission is denied.
		});

		return () => {
			void stopWatching();
		};
	}, [
		getCurrentLocation,
		isConnected,
		isRideEnded,
		isRideLive,
		locationEnabled,
		startWatching,
		stopWatching,
	]);

	// Send location updates
	useEffect(() => {
		if (
			!locationEnabled ||
			!location ||
			!isConnected ||
			!isValidRoomId ||
			isRideEnded ||
			!isRideLive
		) {
			return;
		}

		const now = Date.now();
		const lastSentCoord = lastSentCoordRef.current;
		const movedMeters =
			lastSentCoord && location
				? haversineMeters(lastSentCoord, location)
				: LOCATION_SEND_MIN_DISTANCE_METERS + 1;
		const elapsed = now - lastLocationSentAtRef.current;

		if (
			elapsed < LOCATION_SEND_MIN_INTERVAL_MS &&
			movedMeters < LOCATION_SEND_MIN_DISTANCE_METERS
		) {
			return;
		}

		const sent = sendWsMessage("LOCATION_UPDATE", {
			rideId: roomId,
			latitude: location.latitude,
			longitude: location.longitude,
			accuracy: location.accuracy,
			timestamp: location.timestamp,
		});

		if (sent) {
			lastLocationSentAtRef.current = now;
			lastSentCoordRef.current = {
				latitude: location.latitude,
				longitude: location.longitude,
			};
		}
	}, [
		isConnected,
		isValidRoomId,
		isRideEnded,
		location,
		locationEnabled,
		roomId,
		sendWsMessage,
		isRideLive,
	]);

	// Handle WebSocket messages
	useEffect(() => {
		if (!lastMessage || typeof lastMessage.type !== "string") return;

		const payload = (lastMessage.payload || {}) as Record<string, unknown>;

		// Handle ride snapshot
		if (
			lastMessage.type === "RIDE_JOINED" ||
			lastMessage.type === "RIDE_SNAPSHOT"
		) {
			if (payload.rideId !== roomId) return;

			if (payload.snapshot) {
				applySnapshot(payload.snapshot as RideSnapshot);
			}
			return;
		}

		// Handle ACK for sent messages
		if (lastMessage.type === "CHAT_MESSAGE_ACK") {
			setMessages((prev) =>
				prev.map((msg) => {
					if (
						msg.kind === "outgoing" &&
						msg.clientMessageId === payload.clientMessageId
					) {
						return { ...msg, status: "sent" as const };
					}
					return msg;
				}),
			);
			return;
		}

		// Handle incoming chat messages
		if (lastMessage.type === "CHAT_MESSAGE") {
			if (payload.roomId !== roomId) return;

			const messageId = String(payload.id ?? `in-${Date.now()}`);
			if (knownMessageIdsRef.current.has(messageId)) return;
			const text =
				typeof payload.message === "string" && payload.message.trim().length > 0
					? (payload.message as string)
					: typeof payload.encryptedPayload === "string" &&
						  payload.encryptedPayload.trim().length > 0
						? (payload.encryptedPayload as string)
						: "[encrypted]";
			const createdAt =
				typeof payload.createdAt === "string"
					? (payload.createdAt as string)
					: new Date().toISOString();
			const senderId = payload.senderId as string | undefined;
			const systemMessage = parseRideSystemMessage(text);

			if (systemMessage) {
				knownMessageIdsRef.current.add(messageId);
				setMessages((prev) => [
					...prev,
					{
						id: messageId,
						kind: "system",
						text: systemMessage,
						time: toClockTime(createdAt),
					},
				]);
				return;
			}

			if (senderId && senderId === user?.id) {
				knownMessageIdsRef.current.add(messageId);
				setMessages((prev) =>
					prev.map((message) =>
						message.kind === "outgoing" &&
						message.clientMessageId &&
						message.clientMessageId === payload.clientMessageId
							? {
									...message,
									id: messageId,
									status: "sent",
									createdAt,
									time: toClockTime(createdAt),
								}
							: message,
					),
				);
				return;
			}

			const knownSender =
				senderId && riderProfilesByIdRef.current.has(senderId)
					? riderProfilesByIdRef.current.get(senderId)
					: null;
			const senderName =
				typeof payload.senderName === "string" &&
				payload.senderName.trim().length > 0
					? payload.senderName
					: (knownSender?.name ?? "Rider");
			const senderAvatar = knownSender?.avatar ?? avatarForName(senderName);
			knownMessageIdsRef.current.add(messageId);

			setMessages((prev) => [
				...prev,
				{
					id: messageId,
					kind: "incoming",
					senderId,
					senderName,
					message: text,
					avatar: senderAvatar,
					time: toClockTime(createdAt),
					createdAt,
					isOnline: knownSender?.isOnline,
				},
			]);
			return;
		}

		// Handle typing indicators
		if (lastMessage.type === "CHAT_TYPING") {
			const riderId = payload.riderId as string | undefined;
			const isTyping = payload.isTyping === true;

			if (!riderId) return;

			setTypingRiders((prev) => {
				if (isTyping) {
					return prev.includes(riderId) ? prev : [...prev, riderId];
				}
				return prev.filter((id) => id !== riderId);
			});
			return;
		}

		// Handle location updates
		if (lastMessage.type === "LOCATION_UPDATE") {
			if (payload.rideId !== roomId) return;

			const loc = normalizeRiderLocation(payload, roomId);
			if (!loc) return;

			setRiderLocations((prev) => {
				const idx = prev.findIndex((item) => item.riderId === loc.riderId);
				if (idx === -1) {
					return [...prev, loc];
				}
				const updated = [...prev];
				updated[idx] = loc;
				return updated;
			});
			setLocationsLastUpdatedAt(new Date().toISOString());
			return;
		}

		// Handle ride participant left
		if (lastMessage.type === "RIDE_PARTICIPANT_LEFT") {
			if (payload.rideId !== roomId) return;

			const leftRiderId = payload.riderId as string | undefined;
			if (!leftRiderId) return;

			setRideMembers((prev) =>
				prev.filter((member) => member.id !== leftRiderId),
			);
			setRiderLocations((prev) =>
				prev.filter((loc) => loc.riderId !== leftRiderId),
			);

			setMessages((prev) => [
				...prev,
				{
					id: `system-${Date.now()}`,
					kind: "system",
					text: `${leftRiderId} left the ride`,
					eventType: "RIDE_LEFT" as const,
				},
			]);
			return;
		}

		// Handle SOS alerts
		if (lastMessage.type === "SOS_ALERT") {
			if (payload.rideId !== roomId) return;

			const riderName =
				typeof payload.name === "string" && payload.name.trim().length > 0
					? (payload.name as string).toUpperCase()
					: "A RIDER";

			setMessages((prev) => [
				...prev,
				{
					id: `sos-${Date.now()}`,
					kind: "system",
					text: `${riderName} TRIGGERED SOS`,
					eventType: "SOS_ALERT" as const,
				},
			]);
			return;
		}

		// Handle ride ended
		if (lastMessage.type === "RIDE_ENDED") {
			if (payload.rideId !== roomId) return;

			setIsRideEnded(true);
			setLocationEnabled(false);
			setDraft("");
			typingStateRef.current = false;

			setMessages((prev) => [
				...prev,
				{
					id: `system-${Date.now()}`,
					kind: "system",
					text: "Ride has ended",
					eventType: "RIDE_ENDED" as const,
				},
			]);
			return;
		}

		if (
			lastMessage.type === "RIDE_SYNC_REQUIRED" ||
			lastMessage.type === "RIDE_STARTED" ||
			lastMessage.type === "RIDE_PARTICIPANT_JOINED"
		) {
			if (payload.rideId !== roomId) return;

			if (lastMessage.type === "RIDE_STARTED") {
				setRideStatus("ACTIVE");
				setIsRideEnded(false);
			}

			void requestSnapshot();
		}
	}, [applySnapshot, lastMessage, requestSnapshot, roomId, user?.id]);

	// Handle connection changes
	useEffect(() => {
		if (!previousConnectionRef.current && isConnected) {
			void requestSnapshot();
			sendWsMessage("CHAT_JOIN_ROOM", { roomId });
		}

		previousConnectionRef.current = isConnected;
	}, [isConnected, requestSnapshot, roomId, sendWsMessage]);

	const setDraftWithTyping = useCallback(
		(value: string) => {
			if (isRideEnded) return;

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

	const sendMessage = useCallback(() => {
		if (isRideEnded) return;

		const trimmed = draft.trim();
		if (!trimmed) return;

		const now = new Date().toISOString();
		const clientMessageId = `client-${Date.now()}-${Math.random()
			.toString(16)
			.slice(2)}`;

		const optimisticMessage: GroupChatItem = {
			id: clientMessageId,
			clientMessageId,
			kind: "outgoing",
			message: trimmed,
			time: toClockTime(now),
			createdAt: now,
			status: "sending",
		};

		setMessages((prev) => [...prev, optimisticMessage]);

		const sent = sendWsMessage("CHAT_SEND_MESSAGE", {
			roomId,
			message: trimmed,
			clientMessageId,
		});

		if (!sent) {
			void ChatService.sendMessage(roomId, trimmed)
				.then((response: any) => {
					const createdAt =
						typeof response.createdAt === "string" ? response.createdAt : now;
					knownMessageIdsRef.current.add(String(response.id));
					setMessages((prev) =>
						prev.map((message) =>
							message.kind === "outgoing" &&
							message.clientMessageId === clientMessageId
								? {
										...message,
										id: String(response.id),
										status: "sent",
										createdAt,
										time: toClockTime(createdAt),
									}
								: message,
						),
					);
				})
				.catch(() => {
					setMessages((prev) =>
						prev.map((message) =>
							message.kind === "outgoing" &&
							message.clientMessageId === clientMessageId
								? { ...message, status: "failed" as const }
								: message,
						),
					);
				});
		}

		typingStateRef.current = false;
		sendWsMessage("CHAT_TYPING", {
			roomId,
			isTyping: false,
		});

		setDraft("");
	}, [draft, isRideEnded, roomId, sendWsMessage]);

	const endRide = useCallback(() => {
		if (!isAdmin || isRideEnded) return;

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

	const startRide = useCallback(() => {
		if (!isAdmin || isRideEnded || isRideLive) return;

		void RideService.startRide(roomId)
			.then(() => {
				setRideStatus("ACTIVE");
				setMenuVisible(false);
				void requestSnapshot();
			})
			.catch(() => {
				setMenuVisible(false);
			});
	}, [isAdmin, isRideEnded, isRideLive, requestSnapshot, roomId]);

	const leaveRide = useCallback(async () => {
		if (isRideEnded) return false;

		try {
			await RideService.leaveRide(roomId);
			sendWsMessage("RIDE_LEAVE", { rideId: roomId });
			setLocationEnabled(false);
			return true;
		} catch (error) {
			console.error("Failed to leave ride:", error);
			return false;
		}
	}, [isRideEnded, roomId, sendWsMessage]);

	const inviteFromMenu = useCallback(() => {
		if (isRideEnded) {
			closeMenu();
			return;
		}

		closeMenu();
		openInvite();
	}, [closeMenu, isRideEnded, openInvite]);

	const searchInviteCandidates = useCallback(
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
					.filter((item): item is InviteFriendItem =>
						Boolean(item && item.id !== user?.id),
					);
				setInviteSearchResults(results);
			} catch {
				setInviteSearchResults([]);
			} finally {
				setIsInviteSearching(false);
			}
		},
		[user?.id],
	);

	const sendRideInvite = useCallback(
		async (friend: InviteFriendItem) => {
			if (isRideEnded || !friend.id || !user?.id) return;

			setInviteStateByFriendId((prev) => ({
				...prev,
				[friend.id]: "sending",
			}));

			try {
				await RideService.inviteRiders(roomId, [friend.id]);

				setInviteStateByFriendId((prev) => ({
					...prev,
					[friend.id]: "sent",
				}));
			} catch (error) {
				console.error("Failed to send ride invite:", error);
				setInviteStateByFriendId((prev) => ({
					...prev,
					[friend.id]: "idle",
				}));
				setInviteToast("Failed to send invites. Please try again.");
				if (inviteToastTimeoutRef.current) {
					clearTimeout(inviteToastTimeoutRef.current);
				}
				inviteToastTimeoutRef.current = setTimeout(() => {
					setInviteToast(null);
				}, 3000);
			}
		},
		[isRideEnded, roomId, user?.id],
	);

	const leaderLocation = React.useMemo(() => {
		if (!organizerProfile) return null;
		return (
			riderLocations.find((entry) => entry.riderId === organizerProfile.id) ||
			null
		);
	}, [organizerProfile, riderLocations]);

	// Update ride members with distance calculations
	useEffect(() => {
		if (!leaderLocation) return;

		setRideMembers((prev) =>
			prev.map((member) => {
				if (member.id === leaderLocation.riderId) {
					return { ...member, distanceFromLeaderMeters: 0 };
				}

				const memberLocation = riderLocations.find(
					(loc) => loc.riderId === member.id,
				);
				if (!memberLocation) return member;

				const distance = haversineMeters(leaderLocation, memberLocation);
				return { ...member, distanceFromLeaderMeters: distance };
			}),
		);
	}, [leaderLocation, riderLocations]);

	const inviteFriends = React.useMemo(() => {
		const existingMemberIds = new Set(rideMembers.map((member) => member.id));
		return inviteCandidates.filter(
			(friend) => !existingMemberIds.has(friend.id),
		);
	}, [inviteCandidates, rideMembers]);

	const toggleTrackRider = React.useCallback((riderId: string) => {
		setRideMembers((prev) =>
			prev.map((member) =>
				member.id === riderId
					? { ...member, isFollowing: !member.isFollowing }
					: member,
			),
		);
	}, []);

	return {
		// UI state
		menuVisible,
		inviteVisible,
		locationEnabled,
		isRideEnded,
		isAdmin,
		draft,

		// Messages
		messages,

		// Locations
		riderLocations,
		locationsLastUpdatedAt,

		// Ride info
		roomTitle,
		roomSubtitle,
		rideSourceLabel,
		rideDestinationLabel,
		rideRoute,
		rideStatus,
		rideMembers,
		organizerProfile,
		leaderLocation,
		isRideLive,

		// Map state
		mapLoading,
		mapError,

		// Location permissions
		hasPermission,
		locationError,

		// Connection state
		isConnected,
		connectionState,

		// Loading and error states
		isLoading,
		isError,
		errorMessage,

		// Handlers
		setDraft: setDraftWithTyping,
		setLocationEnabled,
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
		inviteToast,
		searchInviteCandidates,
		sendRideInvite,
		startRide,
		endRide,
		leaveRide,
		sendMessage,
		toggleTrackRider,
		retrySnapshot: requestSnapshot,
	};
}
