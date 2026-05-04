import { useState, useEffect, useCallback, useRef } from "react";
import RideService from "../services/RideService";
import { RideSnapshot, RideLocation } from "../contexts/RideContext";
import { useLocation } from "./useLocation";
import { useWebSocket } from "./useWebSocket";
import {
	calculateNavigationStats,
	NavigationStats,
} from "../utils/navigationStats";
import { isUuid } from "../utils/isUuid";

interface UseRideTrackingOptions {
	rideId: string;
	enabled?: boolean;
	pollIntervalMs?: number;
	rideStartTime?: number;
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

const API_TIMEOUT_MS = 10000;
const FALLBACK_POLL_INTERVAL_MS = 12000;
const LOCATION_UPLOAD_INTERVAL_MS = 2000;

async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
): Promise<T> {
	let timeoutId: NodeJS.Timeout | null = null;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(
			() => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
			timeoutMs,
		);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

const normalizeRideStatus = (status: string | null | undefined) => {
	const normalized = String(status || "").toUpperCase();
	return normalized === "PLANNING" ? "PENDING" : normalized;
};

export function useRideTracking({
	rideId,
	enabled = true,
	pollIntervalMs = 3000,
	rideStartTime: externalStartTime,
}: UseRideTrackingOptions): UseRideTrackingResult {
	const { location } = useLocation({ autoRequest: true });
	const {
		isConnected,
		lastMessage,
		sendMessage: sendWsMessage,
	} = useWebSocket();

	const isValidRideId = isUuid(rideId);

	const [snapshot, setSnapshot] = useState<RideSnapshot | null>(null);
	const [locations, setLocations] = useState<RideLocation[]>([]);
	const [navigationStats, setNavigationStats] =
		useState<NavigationStats | null>(null);
	const [isLoading, setIsLoading] = useState(isValidRideId);
	const [error, setError] = useState<string | null>(
		isValidRideId ? null : "No ride ID provided",
	);
	const [isTracking, setIsTracking] = useState(false);
	const [isRideMissing, setIsRideMissing] = useState(false);

	const rideStartTimeRef = useRef<number>(externalStartTime || Date.now());
	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const locationUploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastLocationUploadRef = useRef<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const missingRideLoggedRef = useRef(false);

	const applySnapshot = useCallback((nextSnapshot: RideSnapshot) => {
		const normalizedStatus = normalizeRideStatus(nextSnapshot.rideStatus);
		const normalizedSnapshot: RideSnapshot = {
			...nextSnapshot,
			rideStatus: normalizedStatus,
		};

		setSnapshot(normalizedSnapshot);
		setLocations(normalizedSnapshot.locations);
		setIsTracking(normalizedStatus === "ACTIVE");
		setError(null);
	}, []);

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

			applySnapshot({
				...snapshotData.snapshot,
				locations: locationsData.locations,
			});
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to fetch ride data. Please check your connection.";
			const isNotFound = /ride not found/i.test(message);
			setError(message);
			if (isNotFound) {
				setIsRideMissing(true);
				if (!missingRideLoggedRef.current) {
					missingRideLoggedRef.current = true;
					console.warn("Ride not found for tracking:", rideId);
				}
			} else {
				console.error("Error fetching ride data:", err);
			}
			setSnapshot(null);
			setLocations([]);
			setIsTracking(false);
		} finally {
			setIsLoading(false);
		}
	}, [applySnapshot, isValidRideId, rideId]);

	const uploadLocation = useCallback(async () => {
		if (!location || !rideId || !isTracking) {
			return;
		}

		const currentCoords = {
			latitude: location.latitude,
			longitude: location.longitude,
		};
		const lastUpload = lastLocationUploadRef.current;
		const hasSignificantChange =
			!lastUpload ||
			Math.abs(currentCoords.latitude - lastUpload.latitude) > 0.00003 ||
			Math.abs(currentCoords.longitude - lastUpload.longitude) > 0.00003;

		if (!hasSignificantChange) {
			return;
		}

		try {
			const sentViaWebSocket =
				isConnected &&
				sendWsMessage("LOCATION_UPDATE", {
					rideId,
					latitude: currentCoords.latitude,
					longitude: currentCoords.longitude,
					accuracy: location.accuracy,
					altitude: location.altitude,
					heading: location.heading,
					speed: location.speed,
					timestamp: location.timestamp,
				});

			if (!sentViaWebSocket) {
				await RideService.updateLocation(
					rideId,
					currentCoords.latitude,
					currentCoords.longitude,
				);
			}

			lastLocationUploadRef.current = currentCoords;
		} catch (err) {
			console.error("Error uploading location:", err);
		}
	}, [isConnected, isTracking, location, rideId, sendWsMessage]);

	const refresh = useCallback(async () => {
		await fetchRideData();
		await uploadLocation();
	}, [fetchRideData, uploadLocation]);

	useEffect(() => {
		if (externalStartTime) {
			rideStartTimeRef.current = externalStartTime;
		}
	}, [externalStartTime]);

	useEffect(() => {
		if (!enabled || !isValidRideId || isRideMissing) {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
				pollIntervalRef.current = null;
			}
			setIsLoading(false);
			return;
		}

		void fetchRideData();

		if (!isConnected) {
			const intervalMs = Math.max(pollIntervalMs, FALLBACK_POLL_INTERVAL_MS);
			pollIntervalRef.current = setInterval(() => {
				void fetchRideData();
			}, intervalMs);
		}

		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
				pollIntervalRef.current = null;
			}
		};
	}, [
		enabled,
		fetchRideData,
		isConnected,
		isRideMissing,
		isValidRideId,
		pollIntervalMs,
	]);

	useEffect(() => {
		if (!enabled || !isValidRideId || !isConnected || isRideMissing) {
			return;
		}

		sendWsMessage("RIDE_JOIN", { rideId });
		sendWsMessage("RIDE_SNAPSHOT", { rideId });

		return () => {
			sendWsMessage("RIDE_LEAVE", { rideId });
		};
	}, [
		enabled,
		isConnected,
		isRideMissing,
		isValidRideId,
		rideId,
		sendWsMessage,
	]);

	useEffect(() => {
		if (!lastMessage || typeof lastMessage.type !== "string") {
			return;
		}

		const payload = (lastMessage.payload || {}) as Record<string, unknown>;
		if (
			typeof payload.rideId === "string" &&
			payload.rideId.length > 0 &&
			payload.rideId !== rideId
		) {
			return;
		}

		if (
			lastMessage.type === "RIDE_JOINED" ||
			lastMessage.type === "RIDE_SNAPSHOT"
		) {
			if (payload.snapshot) {
				applySnapshot(payload.snapshot as RideSnapshot);
				setIsLoading(false);
			}
			return;
		}

		if (
			lastMessage.type === "RIDE_SYNC_REQUIRED" ||
			lastMessage.type === "RIDE_STARTED" ||
			lastMessage.type === "RIDE_ENDED"
		) {
			void fetchRideData();
			return;
		}

		if (lastMessage.type === "LOCATION_UPDATE") {
			const nextLocation = payload as unknown as RideLocation;
			setLocations((prev) => {
				const index = prev.findIndex(
					(entry) => entry.riderId === nextLocation.riderId,
				);

				if (index === -1) {
					return [...prev, nextLocation];
				}

				const next = [...prev];
				next[index] = nextLocation;
				return next;
			});
		}
	}, [applySnapshot, fetchRideData, lastMessage, rideId]);

	useEffect(() => {
		if (!snapshot || !location) {
			setNavigationStats(null);
			return;
		}

		setNavigationStats(
			calculateNavigationStats(
				{ latitude: location.latitude, longitude: location.longitude },
				locations,
				snapshot.route,
				rideStartTimeRef.current,
			),
		);
	}, [location, locations, snapshot]);

	useEffect(() => {
		if (!enabled || !rideId || !location || !isTracking) {
			if (locationUploadIntervalRef.current) {
				clearInterval(locationUploadIntervalRef.current);
				locationUploadIntervalRef.current = null;
			}
			return;
		}

		void uploadLocation();

		locationUploadIntervalRef.current = setInterval(() => {
			void uploadLocation();
		}, LOCATION_UPLOAD_INTERVAL_MS);

		return () => {
			if (locationUploadIntervalRef.current) {
				clearInterval(locationUploadIntervalRef.current);
				locationUploadIntervalRef.current = null;
			}
		};
	}, [enabled, isTracking, location, rideId, uploadLocation]);

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
