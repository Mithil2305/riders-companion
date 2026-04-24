import { apiRequest } from "./api";

type ProfilePayload = {
	id: string;
	email: string;
	username: string;
	name: string;
	bio: string | null;
	mobileNumber: string | null;
	driverLicenseNumber: string | null;
	profileImageUrl: string | null;
	bannerImageUrl: string | null;
	profileSetupCompletedAt: string | null;
	totalMiles?: string | number;
	createdAt?: string;
	updatedAt?: string;
};

type PublicProfilePayload = {
	id: string;
	username: string;
	name: string;
	bio: string | null;
	profileImageUrl: string | null;
	totalMiles?: string | number;
	followersCount?: number;
	followingCount?: number;
	isFollowing?: boolean;
	isMe?: boolean;
};

type BikePayload = {
	id: string;
	brand: string;
	model: string;
	year: number;
	bikeImageUrl: string | null;
	isPrimary: boolean;
};

class ProfileService {
	async getMyProfile() {
		return apiRequest<{ profile: ProfilePayload; bikes: BikePayload[] }>(
			"/profile/me",
		);
	}

	async getRiderProfile(riderId: string) {
		return apiRequest<{ profile: PublicProfilePayload; bikes: BikePayload[] }>(
			`/profile/riders/${riderId}`,
		);
	}

	async searchRiders(query: string) {
		return apiRequest<{ users: PublicProfilePayload[] }>(
			`/profile/search?q=${encodeURIComponent(query)}`,
		);
	}

	async updateMyProfile(payload: {
		name: string;
		username: string;
		bio?: string;
		mobileNumber?: string;
		driverLicenseNumber?: string;
		profileImageUrl?: string;
		profileImageData?: string;
		profileImageMimeType?: string;
		bannerImageUrl?: string;
		bannerImageData?: string;
		bannerImageMimeType?: string;
	}) {
		return apiRequest<{ profile: ProfilePayload }>("/profile/me", {
			method: "PATCH",
			body: payload,
		});
	}

	async addGarageBike(payload: {
		brand: string;
		model: string;
		year: number;
		bikeImageUrl?: string;
		isPrimary?: boolean;
	}) {
		return apiRequest<{ bike: BikePayload }>("/profile/garage/bikes", {
			method: "POST",
			body: payload,
		});
	}
}

export default new ProfileService();
