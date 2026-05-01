import { apiRequest } from "./api";
import type { GarageVehicleInput } from "../types/profile";

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

class GarageService {
	async getGarage() {
		return apiRequest<{ bikes: unknown[] }>("/profile/garage");
	}

	async addVehicle(vehicleData: GarageVehicleInput) {
		const imagePayload = await buildBikeImagePayload(vehicleData.imageUri);
		return apiRequest("/profile/garage/bikes", {
			method: "POST",
			body: {
				brand: vehicleData.brand,
				model: vehicleData.model,
				year: vehicleData.year,
				...imagePayload,
				vehicleType: vehicleData.vehicleType,
			},
		});
	}

	async updateVehicle(
		vehicleId: string,
		vehicleData: Partial<GarageVehicleInput>,
	) {
		const imagePayload = await buildBikeImagePayload(vehicleData.imageUri);
		return apiRequest(`/profile/garage/bikes/${vehicleId}`, {
			method: "PATCH",
			body: {
				brand: vehicleData.brand,
				model: vehicleData.model,
				year: vehicleData.year,
				...imagePayload,
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
