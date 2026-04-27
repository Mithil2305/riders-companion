import { RideInvitePayload, RideInviteStatus } from "../types/chat";

const RIDE_INVITE_PREFIX = "[RIDE_INVITE]";

export type RideInviteAction = "join" | "reject";

const isInviteStatus = (value: unknown): value is RideInviteStatus =>
	value === "pending" || value === "joined" || value === "rejected";

const isRideInvitePayload = (value: unknown): value is RideInvitePayload => {
	if (typeof value !== "object" || value == null) {
		return false;
	}

	const record = value as Record<string, unknown>;
	return (
		record.type === "ride-invite" &&
		typeof record.inviteId === "string" &&
		typeof record.rideId === "string" &&
		typeof record.roomName === "string" &&
		typeof record.inviterId === "string" &&
		typeof record.inviterName === "string" &&
		isInviteStatus(record.status) &&
		typeof record.sentAt === "string"
	);
};

export const createRideInvitePayload = (input: {
	rideId: string;
	roomName: string;
	inviterId: string;
	inviterName: string;
	status?: RideInviteStatus;
	inviteId?: string;
	sentAt?: string;
	respondedBy?: string;
}): RideInvitePayload => ({
	type: "ride-invite",
	inviteId: input.inviteId ?? `invite-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
	rideId: input.rideId,
	roomName: input.roomName,
	inviterId: input.inviterId,
	inviterName: input.inviterName,
	status: input.status ?? "pending",
	sentAt: input.sentAt ?? new Date().toISOString(),
	respondedBy: input.respondedBy,
});

export const serializeRideInviteMessage = (payload: RideInvitePayload): string =>
	`${RIDE_INVITE_PREFIX}${JSON.stringify(payload)}`;

export const parseRideInviteMessage = (
	message: string | null | undefined,
): RideInvitePayload | null => {
	if (typeof message !== "string" || !message.startsWith(RIDE_INVITE_PREFIX)) {
		return null;
	}

	const rawJson = message.slice(RIDE_INVITE_PREFIX.length).trim();
	if (!rawJson) {
		return null;
	}

	try {
		const parsed = JSON.parse(rawJson) as unknown;
		return isRideInvitePayload(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

export const toRideInvitePreview = (
	payload: RideInvitePayload,
	viewerRole: "sender" | "receiver",
): string => {
	if (payload.status === "pending") {
		return viewerRole === "sender"
			? `Ride invite sent for ${payload.roomName}`
			: `Ride invite: ${payload.roomName}`;
	}

	if (payload.status === "joined") {
		return viewerRole === "sender"
			? `${payload.respondedBy ?? "A rider"} joined ${payload.roomName}`
			: `You joined ${payload.roomName}`;
	}

	return viewerRole === "sender"
		? `${payload.respondedBy ?? "A rider"} rejected ${payload.roomName}`
		: `You rejected ${payload.roomName}`;
};
