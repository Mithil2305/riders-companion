export interface SuggestedUser {
	id: string
	username: string
	name: string
	avatar: string
	followersCount?: number
	isVerified?: boolean
}

export interface SuggestedRoom {
	id: string
	name: string
	members: number
}

export interface TrendingClip {
	id: string
	title: string
	creatorName: string
	creatorUsername: string
	thumbnail: string
	likes: number
	comments: number
	shares: number
	createdAt: string
	likedByMe?: boolean
	type: "post" | "clip"
	mediaType?: string | null
	aspectRatio?: number
	width?: number
	height?: number
}

export interface ExploreGridSection {
	id: string
	layout: "large-small-large" | "small-large-small"
	heroTop: TrendingClip
	smallLeft: TrendingClip
	smallRight: TrendingClip
	heroBottom?: TrendingClip
}