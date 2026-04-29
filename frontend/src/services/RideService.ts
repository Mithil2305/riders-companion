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

	async getCommunityRides() {
		return apiRequest<CommunityRidesResponse>("/rides/community");
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
