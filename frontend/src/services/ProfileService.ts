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
};

type PublicProfilePayload = {
	id: string;
	username: string;
	name: string;
	bio: string | null;
	profileImageUrl: string | null;
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
		return apiRequest<{ profile: PublicProfilePayload }>(
			`/profile/riders/${riderId}`,
		);
	}

	async updateMyProfile(payload: {
		name: string;
		username: string;
		bio?: string;
		mobileNumber?: string;
		driverLicenseNumber?: string;
		profileImageUrl?: string;
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
