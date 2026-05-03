export interface Story {
	id: string;
	name: string;
	avatar?: string;
	isAdd?: boolean;
}

export interface FeedPostItem {
	id: string;
	riderId?: string;
	user: string;
	avatar: string;
	image: string;
	mediaType?: string | null;
	aspectRatio?: number;
	caption: string;
	likes: number;
	comments: number;
	createdAt: string;
	likedByMe?: boolean;
}
