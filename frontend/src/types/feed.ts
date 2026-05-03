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
	createdAt: string;
=======
<<<<<<< HEAD
	time: string;
=======
	createdAt: string;
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	likedByMe?: boolean;
}
