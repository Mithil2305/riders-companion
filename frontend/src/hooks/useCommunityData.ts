import React from "react";
import RideService from "../services/RideService";
import type { CommunityData, RideItem } from "../types/community";
<<<<<<< HEAD
=======
import type { CommunityRide } from "../services/RideService";
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0

const EMPTY_COMMUNITY_DATA: CommunityData = {
	activeRide: null,
	suggestedGroups: [],
	nearbyRides: [],
	myRides: [],
};

const toTagChips = (details: {
	includesFood?: boolean;
	stayArranged?: boolean;
	includesFuel?: boolean;
}): RideItem["tags"] => {
	const tags = [] as RideItem["tags"];

	if (details.includesFood) {
		tags.push({ id: "food", label: "Food Included", icon: "restaurant" });
	}

	if (details.stayArranged) {
		tags.push({ id: "stay", label: "Stay Arranged", icon: "bed" });
	}

	if (details.includesFuel) {
		tags.push({ id: "fuel", label: "Fuel Included", icon: "cafe" });
	}

	if (tags.length > 0) {
		return tags;
	}

	return [{ id: "basic", label: "Self Managed", icon: "cafe" }];
};

const toRideItem = (
<<<<<<< HEAD
	ride: {
		id: string;
		status: string;
		joinedCount: number;
		invitedCount: number;
		organizerId?: string | null;
		details: {
			rideType?: "solo" | "group";
			source?: string;
			destination?: string;
			startDate?: string;
			budget?: number;
			includesFood?: boolean;
			includesFuel?: boolean;
			stayArranged?: boolean;
		};
		isOrganizer?: boolean;
	},
=======
	ride: CommunityRide,
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	mode: "nearby" | "myRides",
): RideItem => ({
	id: ride.id,
	route: `${ride.details.source || "Source"} -> ${ride.details.destination || "Destination"}`,
<<<<<<< HEAD
	startsAt: `Starts: ${ride.details.startDate || "TBA"}`,
=======
	startsAt: ride.details.startDate || "TBA",
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	tags: toTagChips(ride.details),
	joinedText: `${ride.joinedCount} joined • ${ride.invitedCount} invited`,
	pricePerDay: `₹${ride.details.budget || 0}`,
	rideType: ride.details.rideType,
	status:
		mode === "myRides"
			? ride.status === "COMPLETED"
				? "completed"
				: "active"
			: undefined,
	statusLabel:
		mode === "myRides"
			? ride.status === "COMPLETED"
				? "ENDED"
				: ride.status
			: undefined,
	isOrganizer: ride.isOrganizer,
	organizerId: ride.organizerId ?? null,
});

<<<<<<< HEAD
export function useCommunityData(selectedLocation?: string) {
	const [data, setData] = React.useState<CommunityData>(EMPTY_COMMUNITY_DATA);
	const [loading, setLoading] = React.useState(true);
=======
const buildCommunityState = (
	payload: {
		activeRide: CommunityRide | null;
		nearbyRides: CommunityRide[];
		myRides: CommunityRide[];
	} | null,
	previous: CommunityData = EMPTY_COMMUNITY_DATA,
): CommunityData => {
	if (!payload) {
		return previous;
	}

	return {
		...previous,
		activeRide: payload.activeRide
			? {
					id: payload.activeRide.id,
					badge: payload.activeRide.status,
					title: `${payload.activeRide.details.source || "Source"} -> ${payload.activeRide.details.destination || "Destination"}`,
					subtitle: "Live group ride",
					actionIcon: "navigate",
					avatars: previous.activeRide?.avatars || [],
					extraCount: payload.activeRide.joinedCount,
				}
			: null,
		nearbyRides: payload.nearbyRides.map((ride) => toRideItem(ride, "nearby")),
		myRides: payload.myRides.map((ride) => toRideItem(ride, "myRides")),
	};
};

export function useCommunityData(selectedLocation?: string) {
	const cachedCommunity = React.useMemo(
		() => RideService.peekCommunityRidesCache(selectedLocation),
		[selectedLocation],
	);
	const initialState = React.useMemo(
		() => buildCommunityState(cachedCommunity, EMPTY_COMMUNITY_DATA),
		[cachedCommunity],
	);
	const [data, setData] = React.useState<CommunityData>(initialState);
	const [loading, setLoading] = React.useState(!cachedCommunity);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	const [refreshing, setRefreshing] = React.useState(false);
	const mountedRef = React.useRef(true);

	const loadCommunity = React.useCallback(async () => {
		try {
			const payload = await RideService.getCommunityRides(selectedLocation);
			if (!mountedRef.current) {
				return;
			}

<<<<<<< HEAD
			setData((prev) => ({
				...prev,
				activeRide: payload.activeRide
					? {
							id: payload.activeRide.id,
							badge: payload.activeRide.status,
							title: `${payload.activeRide.details.source || "Source"} -> ${payload.activeRide.details.destination || "Destination"}`,
							subtitle: "Live group ride",
							actionIcon: "navigate",
							avatars: prev.activeRide?.avatars || [],
							extraCount: payload.activeRide.joinedCount,
						}
					: null,
				nearbyRides: payload.nearbyRides.map((ride) =>
					toRideItem(ride, "nearby"),
				),
				myRides: payload.myRides.map((ride) => toRideItem(ride, "myRides")),
			}));
=======
			setData((prev) => buildCommunityState(payload, prev));
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
		} catch {
			if (mountedRef.current) {
				setData(EMPTY_COMMUNITY_DATA);
			}
		} finally {
			if (mountedRef.current) {
				setLoading(false);
			}
		}
	}, [selectedLocation]);

	React.useEffect(() => {
		mountedRef.current = true;
		void loadCommunity();

		return () => {
			mountedRef.current = false;
		};
	}, [loadCommunity]);

	const refreshCommunity = React.useCallback(async () => {
		setRefreshing(true);
		try {
			await loadCommunity();
		} finally {
			if (mountedRef.current) {
				setRefreshing(false);
			}
		}
	}, [loadCommunity]);

	return {
		...data,
		loading,
		refreshing,
		refreshCommunity,
	};
}
