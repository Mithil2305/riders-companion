import { apiRequest } from "./api";
import type { GarageVehicleInput } from "../types/profile";

class GarageService {
	async getGarage() {
		return apiRequest<{ bikes: unknown[] }>("/profile/garage");
	}

	async addVehicle(vehicleData: GarageVehicleInput) {
		return apiRequest("/profile/garage/bikes", {
			method: "POST",
			body: {
				brand: vehicleData.brand,
				model: vehicleData.model,
				year: vehicleData.year,
				bikeImageUrl: vehicleData.imageUri,
				vehicleType: vehicleData.vehicleType,
			},
		});
	}

	async updateVehicle(vehicleId: string, vehicleData: Partial<GarageVehicleInput>) {
		return apiRequest(`/profile/garage/bikes/${vehicleId}`, {
			method: "PATCH",
			body: {
				brand: vehicleData.brand,
				model: vehicleData.model,
				year: vehicleData.year,
				bikeImageUrl: vehicleData.imageUri,
				vehicleType: vehicleData.vehicleType,
			},
		});
	}

	async deleteVehicle(vehicleId: string) {
		return apiRequest(`/profile/garage/bikes/${vehicleId}`, {
			method: "DELETE",
		});
	}
}

export default new GarageService();
