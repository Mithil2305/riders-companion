import { SharedContentPayload } from "../types/chat";

const SHARED_CONTENT_PREFIX = "[SHARED_CONTENT]";

const isSharedContentPayload = (
	value: unknown,
): value is SharedContentPayload => {
	if (typeof value !== "object" || value == null) {
		return false;
	}

	const record = value as Record<string, unknown>;
	return (
		record.type === "shared-content" &&
		(record.resourceType === "post" || record.resourceType === "clip") &&
		typeof record.resourceId === "string" &&
		typeof record.senderId === "string" &&
		typeof record.senderName === "string" &&
		typeof record.sentAt === "string"
	);
};

export const createSharedContentPayload = (input: {
	resourceType: "post" | "clip";
	resourceId: string;
	senderId: string;
	senderName: string;
	caption?: string;
	title?: string;
	thumbnailUrl?: string;
	sentAt?: string;
}): SharedContentPayload => ({
	type: "shared-content",
	resourceType: input.resourceType,
	resourceId: input.resourceId,
	title: input.title,
	caption: input.caption,
	thumbnailUrl: input.thumbnailUrl,
	senderId: input.senderId,
	senderName: input.senderName,
	sentAt: input.sentAt ?? new Date().toISOString(),
});

export const serializeSharedContentMessage = (
	payload: SharedContentPayload,
): string => `${SHARED_CONTENT_PREFIX}${JSON.stringify(payload)}`;

export const parseSharedContentMessage = (
	message: string | null | undefined,
): SharedContentPayload | null => {
	if (
		typeof message !== "string" ||
		!message.startsWith(SHARED_CONTENT_PREFIX)
	) {
		return null;
	}

	const rawJson = message.slice(SHARED_CONTENT_PREFIX.length).trim();
	if (!rawJson) {
		return null;
	}

	try {
		const parsed = JSON.parse(rawJson) as unknown;
		return isSharedContentPayload(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

export const toSharedContentPreview = (payload: SharedContentPayload): string => {
	const contentLabel = payload.resourceType === "clip" ? "Clip" : "Post";
	if (typeof payload.caption === "string" && payload.caption.trim().length > 0) {
		return `${contentLabel}: ${payload.caption}`;
	}

	if (typeof payload.title === "string" && payload.title.trim().length > 0) {
		return `${contentLabel}: ${payload.title}`;
	}

	return `${contentLabel} shared`;
};
