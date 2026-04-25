export interface CommentAuthorModel {
	id: string;
	name: string;
	username: string;
	avatarUrl: string;
}

export interface CommentModel {
	id: string;
	content: string;
	createdAt?: string;
	timeLabel: string;
	likeCount: number;
	likedByMe: boolean;
	author: CommentAuthorModel;
}

export interface ShareUser {
	id: string;
	name: string;
	username: string;
	avatarUrl: string;
}

export type ShareTargetType =
	| "story"
	| "message"
	| "link"
	| "facebook"
	| "twitter"
	| "whatsapp";

export interface ShareActionModel {
	id: ShareTargetType;
	label: string;
	iconName: string;
}

export type InteractionContentType = "feed" | "clip";
