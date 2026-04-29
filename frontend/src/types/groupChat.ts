export type GroupChatMessageStatus = "sending" | "sent" | "failed";

export type GroupChatEventType =
	| "RIDE_ENDED"
	| "SOS_ALERT"
	| "RIDE_INVITE"
	| "RIDE_JOINED"
	| "RIDE_LEFT"
	| "LOCATION_UPDATE"
	| "SYSTEM";

export type GroupChatItem =
	| {
			id: string;
			kind: "system";
			text: string;
			eventType?: GroupChatEventType;
			time?: string;
	  }
	| {
			id: string;
			kind: "incoming";
			senderId?: string;
			senderName: string;
			message: string;
			avatar: string;
			time: string;
			createdAt?: string;
	  }
	| {
			id: string;
			kind: "incoming-location";
			senderId?: string;
			senderName: string;
			message: string;
			avatar: string;
			time: string;
			locationLabel: string;
			createdAt?: string;
	  }
	| {
			id: string;
			clientMessageId?: string;
			kind: "outgoing";
			message: string;
			time: string;
			createdAt?: string;
			status: GroupChatMessageStatus;
	  };

export type RiderLocation = {
	rideId: string;
	riderId: string;
	name: string;
	username?: string | null;
	latitude: number;
	longitude: number;
	deviceSpeedKmh?: number | null;
	speed: number | null;
	averageSpeedKmh?: number | null;
	heading: number | null;
	accuracy: number | null;
	altitude: number | null;
	timestamp: string;
	updatedAt: string;
	isLeader?: boolean;
	isOnline?: boolean;
	rideStatus?: string | null;
	participantStatus?: string | null;
};

export type RideRouteMeta = {
	source: string | null;
	destination: string | null;
	sourceCoordinates: { latitude: number; longitude: number } | null;
	destinationCoordinates: { latitude: number; longitude: number } | null;
	routePolyline: Array<{ latitude: number; longitude: number }>;
};

export type RideSnapshot = {
	rideId: string;
	rideStatus: string;
	leaderRiderId: string | null;
	route: RideRouteMeta;
	participants: Array<{
		riderId: string;
		name: string;
		username?: string | null;
		participantStatus: string;
		isLeader: boolean;
		isOnline?: boolean;
	}>;
	locations: RiderLocation[];
	snapshotAt: string;
};

export type GroupSocketEnvelope<TPayload = unknown> = {
	type: string;
	payload?: TPayload;
	timestamp?: string;
};

export type GroupRideMember = {
	id: string;
	name: string;
	username?: string | null;
	avatar?: string | null;
	bio?: string | null;
	status?: string;
	isOrganizer?: boolean;
	isFollowing?: boolean;
	isOnline?: boolean;
	lastLocationAt?: string | null;
	distanceFromLeaderMeters?: number | null;
};

export type InviteFriendItem = {
	id: string;
	name: string;
	username?: string;
	avatar?: string | null;
};

export type InviteActionState = "idle" | "sending" | "sent";
