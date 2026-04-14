import { apiRequest } from "./api";

class GarageService {
	async getGarage() {
		return apiRequest<{ bikes: unknown[] }>("/profile/garage");
	}

	async addVehicle(vehicleData: Record<string, unknown>) {
		return apiRequest("/profile/garage/bikes", {
			method: "POST",
			body: vehicleData,
		});
	}

	async updateVehicle(vehicleId: string, vehicleData: Record<string, unknown>) {
		return apiRequest(`/profile/garage/bikes/${vehicleId}`, {
			method: "PATCH",
			body: vehicleData,
		});
	}

	async deleteVehicle(vehicleId: string) {
		return apiRequest(`/profile/garage/bikes/${vehicleId}`, {
			method: "DELETE",
		});
	}
}

export default new GarageService();
