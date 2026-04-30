import React, { useCallback, useEffect, useRef, useState } from "react";
import RideService from "../services/RideService";
import { RideSnapshot, RideLocation } from "../contexts/RideContext";
import { useLocation } from "./useLocation";
import { calculateNavigationStats, NavigationStats } from "../utils/navigationStats";

interface UseRideTrackingOptions {
  rideId: string;
  enabled?: boolean;
  pollIntervalMs?: number; // Default: 3000ms (3 seconds)
  rideStartTime?: number; // Optional: override ride start time
}

interface UseRideTrackingResult {
  snapshot: RideSnapshot | null;
  locations: RideLocation[];
  navigationStats: NavigationStats | null;
  isLoading: boolean;
  error: string | null;
  isTracking: boolean;
  refresh: () => Promise<void>;
}

const API_TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Wrap async function with timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) =>
    (timeoutId = setTimeout(
      () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
      timeoutMs
    ))
  );

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Hook for managing real-time ride tracking
 * - Fetches ride snapshot and locations periodically
 * - Tracks device location and uploads to backend
 * - Calculates navigation stats (speed, distance, ETA, etc.)
 * - Works independently without requiring RideProvider
 */
export function useRideTracking({
  rideId,
  enabled = true,
  pollIntervalMs = 3000,
  rideStartTime: externalStartTime,
}: UseRideTrackingOptions): UseRideTrackingResult {
  const { location } = useLocation({ autoRequest: true });

  // Validate rideId early
  const isValidRideId = rideId && rideId.trim().length > 0;

  const [snapshot, setSnapshot] = useState<RideSnapshot | null>(null);
  const [locations, setLocations] = useState<RideLocation[]>([]);
  const [navigationStats, setNavigationStats] = useState<NavigationStats | null>(null);
  const [isLoading, setIsLoading] = useState(isValidRideId); // Only load if rideId is valid
  const [error, setError] = useState<string | null>(
    isValidRideId ? null : "No ride ID provided"
  ); // Set error if no rideId
  const [isTracking, setIsTracking] = useState(false);

  // Track ride start time locally
  const rideStartTimeRef = useRef<number>(externalStartTime || Date.now());

  const pollIntervalRef = useRef<NodeJS.Timer | null>(null);
  const locationUploadIntervalRef = useRef<NodeJS.Timer | null>(null);
  const lastLocationUploadRef = useRef<{ latitude: number; longitude: number } | null>(null);

  /**
   * Fetch and update ride snapshot and locations
   */
  const fetchRideData = useCallback(async () => {
    if (!isValidRideId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [snapshotData, locationsData] = await Promise.all([
        withTimeout(RideService.getRideSnapshot(rideId), API_TIMEOUT_MS),
        withTimeout(RideService.getRideLocations(rideId), API_TIMEOUT_MS),
      ]);

      const fullSnapshot: RideSnapshot = {
        ...snapshotData.snapshot,
        locations: locationsData.locations,
      };

      setSnapshot(fullSnapshot);
      setLocations(locationsData.locations);
      setIsTracking(fullSnapshot.rideStatus === "active");

      // Calculate navigation stats using local startTime and current location
      if (location) {
        const stats = calculateNavigationStats(
          { latitude: location.latitude, longitude: location.longitude },
          locationsData.locations,
          fullSnapshot.route,
          rideStartTimeRef.current
        );
        setNavigationStats(stats);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to fetch ride data. Please check your connection.";
      setError(message);
      console.error("Error fetching ride data:", err);
      // Still set snapshot to null on error to show error state
      setSnapshot(null);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [rideId, isValidRideId, location]);

  /**
   * Upload current device location to backend
   */
  const uploadLocation = useCallback(async () => {
    if (!location || !rideId) return;

    const currentCoords = {
      latitude: location.latitude,
      longitude: location.longitude,
    };

    // Check if location has changed significantly or enough time has passed
    const lastUpload = lastLocationUploadRef.current;
    const hasSignificantChange =
      !lastUpload ||
      Math.abs(currentCoords.latitude - lastUpload.latitude) > 0.0001 ||
      Math.abs(currentCoords.longitude - lastUpload.longitude) > 0.0001;

    if (!hasSignificantChange) {
      return; // Skip upload if location hasn't changed much
    }

    try {
      await RideService.updateLocation(
        rideId,
        currentCoords.latitude,
        currentCoords.longitude
      );
      lastLocationUploadRef.current = currentCoords;
    } catch (err) {
      console.error("Error uploading location:", err);
    }
  }, [location, rideId]);

  /**
   * Manual refresh of ride data
   */
  const refresh = useCallback(async () => {
    await fetchRideData();
    await uploadLocation();
  }, [fetchRideData, uploadLocation]);

  /**
   * Set up polling interval for ride data
   */
  useEffect(() => {
    if (!enabled || !isValidRideId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchRideData();

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      fetchRideData();
    }, pollIntervalMs);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, rideId, isValidRideId, pollIntervalMs, fetchRideData]);

  /**
   * Set up location upload interval
   */
  useEffect(() => {
    if (!enabled || !rideId || !location || !isTracking) {
      if (locationUploadIntervalRef.current) {
        clearInterval(locationUploadIntervalRef.current);
        locationUploadIntervalRef.current = null;
      }
      return;
    }

    // Upload immediately
    uploadLocation();

    // Set up upload interval (more frequent than polling to ensure real-time tracking)
    locationUploadIntervalRef.current = setInterval(() => {
      uploadLocation();
    }, 1000); // Upload every second if location changes

    return () => {
      if (locationUploadIntervalRef.current) {
        clearInterval(locationUploadIntervalRef.current);
        locationUploadIntervalRef.current = null;
      }
    };
  }, [enabled, rideId, location, isTracking, uploadLocation]);

  /**
   * Update ride start time if external value changes
   */
  useEffect(() => {
    if (externalStartTime) {
      rideStartTimeRef.current = externalStartTime;
    }
  }, [externalStartTime]);

  return {
    snapshot,
    locations,
    navigationStats,
    isLoading,
    error,
    isTracking,
    refresh,
  };
}
