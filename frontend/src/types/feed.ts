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
<<<<<<< HEAD
	time: string;
=======
	createdAt: string;
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	likedByMe?: boolean;
}
