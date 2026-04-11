import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access location was denied');
      return false;
    }
    return true;
  };

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
      });
    } catch (err) {
      setError('Error getting location');
    } finally {
      setLoading(false);
    }
  }, []);

  const startWatching = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
        });
      }
    );
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    startWatching,
  };
}
