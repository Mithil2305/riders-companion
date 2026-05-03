import { apiRequest } from "./api";

export type RideFriend = {
	id: string;
	name: string;
	username: string;
	avatar?: string | null;
};

export type RideFormPayload = {
	rideType: "solo" | "group";
	privacy: "friends" | "strangers" | "mixed" | "solo";
	rideTitle?: string;
	source: string;
	destination: string;
	pickupLocation?: string;
	dropLocation?: string;
	startDate: string;
	endDate?: string;
	days: number;
	budget: number;
	maxRiders?: number;
	ridePace?: "calm" | "balanced" | "fast";
	roadPreference?: "scenic" | "highway" | "mixed";
	meetupNotes?: string;
	emergencyContactName?: string;
	emergencyContactPhone?: string;
	rideNotes?: string;
	includesFood?: boolean;
	includesFuel?: boolean;
	bikeProvided?: boolean;
	stayArranged?: boolean;
	stayDetails?: string;
	invitedFriendIds?: string[];
};

type RideDetails = {
	rideType?: "solo" | "group";
	privacy?: "friends" | "strangers" | "mixed" | "solo";
	rideTitle?: string;
	source?: string;
	destination?: string;
	pickupLocation?: string;
	dropLocation?: string;
	startDate?: string;
	endDate?: string | null;
	days?: number;
	budget?: number;
	maxRiders?: number;
	ridePace?: "calm" | "balanced" | "fast";
	roadPreference?: "scenic" | "highway" | "mixed";
	meetupNotes?: string;
	emergencyContactName?: string;
	emergencyContactPhone?: string;
	rideNotes?: string;
	includesFood?: boolean;
	includesFuel?: boolean;
	bikeProvided?: boolean;
	stayArranged?: boolean;
	stayDetails?: string;
};

export type CommunityRide = {
	id: string;
	communityId?: string;
	status: string;
	details: RideDetails;
	joinedCount: number;
	invitedCount: number;
	organizerId?: string | null;
	isOrganizer?: boolean;
};

type RideByIdResponse = {
	ride: {
		id: string;
		communityId: string;
		status: string;
		details: RideDetails;
		organizerId?: string | null;
		isOrganizer?: boolean;
		communityName?: string | null;
		organizerProfile?: {
			id: string;
			name: string;
			username?: string | null;
			avatar?: string | null;
			bio?: string | null;
		} | null;
		riderProfiles?: {
			id: string;
			name: string;
			username?: string | null;
			avatar?: string | null;
			bio?: string | null;
			status?: string;
			isOrganizer?: boolean;
		}[];
	};
};

type CommunityRidesResponse = {
	activeRide: CommunityRide | null;
	nearbyRides: CommunityRide[];
	myRides: CommunityRide[];
};

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
const COMMUNITY_CACHE_TTL_MS = 20_000;
const communityCache = new Map<
	string,
	{ data: CommunityRidesResponse; fetchedAt: number }
>();
const communityInFlight = new Map<string, Promise<CommunityRidesResponse>>();

const normalizeCommunityKey = (location?: string) =>
	location && location.trim().length > 0
		? location.trim().toLowerCase()
		: "default";

<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
type RideCreateResponse = {
	ride: {
		id: string;
		status: string;
		details: RideDetails;
	};
};

type RideLocationsResponse = {
	locations: {
		rideId: string;
		riderId: string;
		name: string;
		username?: string | null;
		avatar?: string | null;
		latitude: number;
		longitude: number;
		deviceSpeedKmh?: number | null;
		speed: number | null;
		heading: number | null;
		accuracy: number | null;
		altitude: number | null;
		timestamp?: string;
		updatedAt: string;
	}[];
	refreshIntervalMinutes: number;
};

type RideSnapshotResponse = {
	snapshot: {
		rideId: string;
		rideStatus: string;
		leaderRiderId: string | null;
		route: {
			source: string | null;
			destination: string | null;
			sourceCoordinates: { latitude: number; longitude: number } | null;
			destinationCoordinates: { latitude: number; longitude: number } | null;
			routePolyline: Array<{ latitude: number; longitude: number }>;
		};
		participants: Array<{
			riderId: string;
			name: string;
			username?: string | null;
			avatar?: string | null;
			participantStatus: string;
			isLeader: boolean;
			isOnline?: boolean;
		}>;
		locations: RideLocationsResponse["locations"];
		snapshotAt: string;
	};
};

class RideService {
	async getFriends() {
		const data = await apiRequest<{ friends: RideFriend[] }>("/rides/friends");
		return data.friends;
	}

	async createRide(payload: RideFormPayload) {
		return apiRequest<RideCreateResponse>("/rides", {
			method: "POST",
			body: payload,
		});
	}

	async updateRide(rideId: string, payload: RideFormPayload) {
		return apiRequest<RideCreateResponse>(`/rides/${rideId}`, {
			method: "PATCH",
			body: payload,
		});
	}

	async getCommunityRides(location?: string) {
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		const key = normalizeCommunityKey(location);
		const now = Date.now();
		const cached = communityCache.get(key);
		if (cached && now - cached.fetchedAt < COMMUNITY_CACHE_TTL_MS) {
			return cached.data;
		}

		const inflight = communityInFlight.get(key);
		if (inflight) {
			return inflight;
		}

<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		const query =
			typeof location === "string" && location.trim().length > 0
				? `?location=${encodeURIComponent(location.trim())}`
				: "";
<<<<<<< HEAD
=======
<<<<<<< HEAD
		return apiRequest<CommunityRidesResponse>(`/rides/community${query}`);
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		const request = apiRequest<CommunityRidesResponse>(
			`/rides/community${query}`,
		)
			.then((data) => {
				communityCache.set(key, { data, fetchedAt: Date.now() });
				return data;
			})
			.finally(() => {
				communityInFlight.delete(key);
			});

		communityInFlight.set(key, request);
		return request;
	}

	peekCommunityRidesCache(location?: string) {
		const key = normalizeCommunityKey(location);
		const cached = communityCache.get(key);
		return cached?.data ?? null;
	}

	async preloadCommunityRides(location?: string) {
		try {
			await this.getCommunityRides(location);
		} catch {
			// Best-effort warmup.
		}
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	}

	async joinRide(rideId: string) {
		return apiRequest<{ rideId: string; joined: boolean }>(
			`/rides/${rideId}/join`,
			{
				method: "POST",
			},
		);
	}

	async acceptInvitation(rideId: string) {
		return apiRequest<{ accepted: boolean }>(
			`/rides/${rideId}/invitations/accept`,
			{
				method: "POST",
			},
		);
	}

	async declineInvitation(rideId: string) {
		return apiRequest<{ accepted: boolean }>(
			`/rides/${rideId}/invitations/decline`,
			{
				method: "POST",
			},
		);
	}

	async startRide(rideId: string) {
		return apiRequest<{ rideId: string; status: string }>(
			`/rides/${rideId}/start`,
			{
				method: "POST",
			},
		);
	}

	async endRide(rideId: string) {
		return apiRequest<{ rideId: string; status: string }>(
			`/rides/${rideId}/end`,
			{
				method: "POST",
			},
		);
	}

	async leaveRide(rideId: string) {
		return apiRequest<{ rideId: string; joined: boolean }>(
			`/rides/${rideId}/leave`,
			{
				method: "POST",
			},
		);
	}

	async deleteRide(rideId: string) {
		return apiRequest<{ deleted: boolean }>(`/rides/${rideId}`, {
			method: "DELETE",
		});
	}

	async getRideById(rideId: string) {
		return apiRequest<RideByIdResponse>(`/rides/${rideId}`);
	}

	async getRideSnapshot(rideId: string) {
		return apiRequest<RideSnapshotResponse>(`/rides/${rideId}/snapshot`);
	}

	async inviteRiders(rideId: string, invitedRiderIds: string[]) {
		return apiRequest<{ rideId: string; invitedCount: number }>(
			`/rides/${rideId}/invite`,
			{
				method: "POST",
				body: { invitedRiderIds },
			},
		);
	}

	async updateLocation(rideId: string, latitude: number, longitude: number) {
		return apiRequest<{ updated: boolean }>(`/rides/${rideId}/location`, {
			method: "POST",
			body: { latitude, longitude },
		});
	}

	async getRideLocations(rideId: string) {
		return apiRequest<RideLocationsResponse>(`/rides/${rideId}/locations`);
	}

	async searchLocations(query: string) {
		const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

		if (!key || key.trim().length === 0) {
			return [] as string[];
		}

		if (query.trim().length < 3) {
			return [] as string[];
		}

		const endpoint =
			`https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
			`input=${encodeURIComponent(query)}&types=geocode&key=${encodeURIComponent(key)}`;

		const response = await fetch(endpoint);
		const data = (await response.json()) as {
			predictions?: { description?: string }[];
		};

		return (data.predictions || [])
			.map((item) => item.description || "")
			.filter((value) => value.length > 0)
			.slice(0, 5);
	}
}

export default new RideService();
