import { apiRequest } from "./api";

class TrackerService {
	async getFollowers(riderId: string) {
		return apiRequest<{ riderId: string; followers: unknown[] }>(
			`/tracker/followers/${riderId}`,
		);
	}

	async getFollowing(riderId: string) {
		return apiRequest<{ riderId: string; following: unknown[] }>(
			`/tracker/following/${riderId}`,
		);
	}

	async followRider(riderId: string) {
		return apiRequest<{ riderId: string; following: boolean }>(
			`/tracker/${riderId}/follow`,
			{
				method: "POST",
			},
		);
	}
}

export default new TrackerService();
