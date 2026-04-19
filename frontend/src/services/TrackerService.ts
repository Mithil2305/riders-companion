import { apiRequest } from "./api";

class TrackerService {
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
