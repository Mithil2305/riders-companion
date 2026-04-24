import type { ImageSourcePropType } from "react-native";

export interface AvatarItem {
	id: string;
	name: string;
	image?: string;
}

export interface ActiveRideData {
	id: string;
	badge: string;
	title: string;
	subtitle: string;
	actionIcon: "options" | "navigate";
	avatars: AvatarItem[];
	extraCount: number;
}

export interface SuggestedGroup {
	id: string;
	title: string;
	badge: string;
	duration: string;
	riders: string;
	image: ImageSourcePropType;
}

export interface RideTagChip {
	id: string;
	label: string;
	icon: "restaurant" | "bed" | "cafe";
}

export type RideStatusType = "active" | "completed";

export interface RideItem {
	id: string;
	route: string;
	levelTag?: string;
	pricePerDay?: string;
	startsAt: string;
	tags: RideTagChip[];
	joinedText: string;
	status?: RideStatusType;
	statusLabel?: string;
}

export interface CommunityData {
	activeRide: ActiveRideData | null;
	suggestedGroups: SuggestedGroup[];
	nearbyRides: RideItem[];
	myRides: RideItem[];
}
