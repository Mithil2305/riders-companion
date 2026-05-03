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
	coverImageUrl: string | null;
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

const SEARCH_CACHE_TTL_MS = 15_000;
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
const MY_PROFILE_CACHE_TTL_MS = 20_000;

let myProfileCache: {
	data: { profile: ProfilePayload; bikes: BikePayload[] };
	fetchedAt: number;
} | null = null;
let myProfileInFlight: Promise<{
	profile: ProfilePayload;
	bikes: BikePayload[];
}> | null = null;
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

type SearchResponse = { users: PublicProfilePayload[] };

const riderSearchCache = new Map<
	string,
	{ data: SearchResponse; fetchedAt: number }
>();
const riderSearchInFlight = new Map<string, Promise<SearchResponse>>();

class ProfileService {
	async getMyProfile() {
<<<<<<< HEAD
=======
<<<<<<< HEAD
		return apiRequest<{ profile: ProfilePayload; bikes: BikePayload[] }>(
			"/profile/me",
		);
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		const now = Date.now();
		if (
			myProfileCache &&
			now - myProfileCache.fetchedAt < MY_PROFILE_CACHE_TTL_MS
		) {
			return myProfileCache.data;
		}

		if (myProfileInFlight) {
			return myProfileInFlight;
		}

		myProfileInFlight = apiRequest<{
			profile: ProfilePayload;
			bikes: BikePayload[];
		}>("/profile/me")
			.then((data) => {
				myProfileCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				myProfileInFlight = null;
			});

		return myProfileInFlight;
	}

	peekMyProfileCache() {
		return myProfileCache?.data ?? null;
	}

	clearMyProfileCache() {
		myProfileCache = null;
		myProfileInFlight = null;
	}

	async preloadMyProfile() {
		try {
			await this.getMyProfile();
		} catch {
			// Best-effort warmup.
		}
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	}

	async getRiderProfile(riderId: string) {
		return apiRequest<{ profile: PublicProfilePayload; bikes: BikePayload[] }>(
			`/profile/riders/${riderId}`,
		);
	}

	async searchRiders(query: string) {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) {
			return { users: [] };
		}

		const now = Date.now();
		const cached = riderSearchCache.get(normalizedQuery);
		if (cached && now - cached.fetchedAt < SEARCH_CACHE_TTL_MS) {
			return cached.data;
		}

		const existingRequest = riderSearchInFlight.get(normalizedQuery);
		if (existingRequest) {
			return existingRequest;
		}

		const request = apiRequest<SearchResponse>(
			`/profile/search?q=${encodeURIComponent(query)}`,
		)
			.then((data) => {
				riderSearchCache.set(normalizedQuery, {
					data,
					fetchedAt: Date.now(),
				});
				return data;
			})
			.finally(() => {
				riderSearchInFlight.delete(normalizedQuery);
			});

		riderSearchInFlight.set(normalizedQuery, request);
		return request;
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
<<<<<<< HEAD
		this.clearMyProfileCache();
=======
<<<<<<< HEAD
=======
		this.clearMyProfileCache();
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
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
<<<<<<< HEAD
		this.clearMyProfileCache();
=======
<<<<<<< HEAD
=======
		this.clearMyProfileCache();
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		const readBlobAsDataUrl = async (blob: Blob) =>
			new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onerror = () => reject(new Error("Failed to convert media."));
				reader.onloadend = () => {
					if (typeof reader.result === "string") {
						resolve(reader.result);
						return;
					}
					reject(new Error("Failed to read selected media."));
				};
				reader.readAsDataURL(blob);
			});

		const buildBikeImagePayload = async (imageUri?: string) => {
			if (!imageUri) {
				return {} as const;
			}
			if (/^data:/i.test(imageUri)) {
				return { bikeImageData: imageUri } as const;
			}
			if (/^https?:\/\//i.test(imageUri)) {
				return { bikeImageUrl: imageUri } as const;
			}
			const response = await fetch(imageUri);
			const blob = await response.blob();
			const dataUrl = await readBlobAsDataUrl(blob);
			return { bikeImageData: dataUrl } as const;
		};

		const imagePayload = await buildBikeImagePayload(payload.bikeImageUrl);

		return apiRequest<{ bike: BikePayload }>("/profile/garage/bikes", {
			method: "POST",
			body: {
				brand: payload.brand,
				model: payload.model,
				year: payload.year,
				isPrimary: payload.isPrimary,
				...imagePayload,
			},
		});
	}
}

export default new ProfileService();
