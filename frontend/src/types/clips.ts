export interface ClipItem {
	id: string;
	riderId?: string;
	user: string;
	avatar: string;
	media: string;
	caption: string;
	likes: number;
	comments: number;
	shares: number;
	music: string;
	likedByMe?: boolean;
}
