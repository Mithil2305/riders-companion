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
	source: string;
	destination: string;
	pickupLocation?: string;
	dropLocation?: string;
	startDate: string;
	endDate?: string;
	days: number;
	budget: number;
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
	source?: string;
	destination?: string;
	startDate?: string;
	endDate?: string | null;
	budget?: number;
	includesFood?: boolean;
	includesFuel?: boolean;
	bikeProvided?: boolean;
	stayArranged?: boolean;
	stayDetails?: string;
};

export type CommunityRide = {
	id: string;
	status: string;
	details: RideDetails;
	joinedCount: number;
	invitedCount: number;
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
		riderId: string;
		name: string;
		latitude: number;
		longitude: number;
		updatedAt: string;
	}[];
	refreshIntervalMinutes: number;
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
