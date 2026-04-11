import { Platform } from 'react-native';

const API_URL = Platform.select({
  ios: 'http://localhost:3000/api',
  android: 'http://10.0.2.2:3000/api',
  default: 'http://localhost:3000/api',
});

class GarageService {
  async getGarage(userId: string) {
    try {
      const response = await fetch(`${API_URL}/garage/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Get garage error:', error);
      throw error;
    }
  }

  async addVehicle(vehicleData: any) {
    try {
      const response = await fetch(`${API_URL}/garage/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });
      return await response.json();
    } catch (error) {
      console.error('Add vehicle error:', error);
      throw error;
    }
  }

  async updateVehicle(vehicleId: string, vehicleData: any) {
    try {
      const response = await fetch(`${API_URL}/garage/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });
      return await response.json();
    } catch (error) {
      console.error('Update vehicle error:', error);
      throw error;
    }
  }

  async deleteVehicle(vehicleId: string) {
    try {
      const response = await fetch(`${API_URL}/garage/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      console.error('Delete vehicle error:', error);
      throw error;
    }
  }
}

export default new GarageService();
