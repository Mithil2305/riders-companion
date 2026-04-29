import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";

type MotionSample = {
	latitude: number;
	longitude: number;
	timestampMs: number;
};

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const haversineDistanceMeters = (from: MotionSample, to: MotionSample) => {
	const lat1 = toRadians(from.latitude);
	const lat2 = toRadians(to.latitude);
	const dLat = toRadians(to.latitude - from.latitude);
	const dLon = toRadians(to.longitude - from.longitude);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_RADIUS_METERS * c;
};

const lerp = (from: number, to: number, alpha: number) =>
	from + (to - from) * alpha;

const normalizeHeading = (value: number | null) => {
	if (value == null || Number.isNaN(value)) {
		return null;
	}

	const normalized = value % 360;
	return normalized < 0 ? normalized + 360 : normalized;
};

interface LocationData {
	latitude: number;
	longitude: number;
	altitude: number | null;
	accuracy: number | null;
	speed: number | null;
	heading: number | null;
	timestamp: string;
}

interface UseLocationOptions {
	autoRequest?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
	const { autoRequest = true } = options;
	const [location, setLocation] = useState<LocationData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [hasPermission, setHasPermission] = useState(false);

	const watcherRef = useRef<Location.LocationSubscription | null>(null);
	const appStateRef = useRef(AppState.currentState);
	const previousSampleRef = useRef<MotionSample | null>(null);
	const smoothedRef = useRef<{ latitude: number; longitude: number } | null>(
		null,
	);

	const requestPermission = useCallback(async () => {
		const current = await Location.getForegroundPermissionsAsync();
		if (current.status === "granted") {
			setHasPermission(true);
			return true;
		}

		const { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			setError("Permission to access location was denied");
			setHasPermission(false);
			return false;
		}

		setHasPermission(true);
		return true;
	}, []);

	const mapLocation = useCallback(
		(current: Location.LocationObject): LocationData => {
			const timestampMs =
				typeof current.timestamp === "number" ? current.timestamp : Date.now();
			const currentSample: MotionSample = {
				latitude: current.coords.latitude,
				longitude: current.coords.longitude,
				timestampMs,
			};

			let speedKmh =
				typeof current.coords.speed === "number" &&
				Number.isFinite(current.coords.speed)
					? Math.max(0, current.coords.speed) * 3.6
					: null;

			const previousSample = previousSampleRef.current;
			if ((speedKmh == null || speedKmh < 0.5) && previousSample) {
				const distanceMeters = haversineDistanceMeters(
					previousSample,
					currentSample,
				);
				const durationSeconds =
					(currentSample.timestampMs - previousSample.timestampMs) / 1000;
				if (durationSeconds > 0) {
					const computed = (distanceMeters / durationSeconds) * 3.6;
					if (Number.isFinite(computed) && computed >= 0) {
						speedKmh = computed;
					}
				}
			}

			previousSampleRef.current = currentSample;

			const alpha =
				typeof current.coords.accuracy === "number" &&
				current.coords.accuracy > 30
					? 0.25
					: 0.42;
			const previousSmoothed = smoothedRef.current;
			const nextSmoothed = previousSmoothed
				? {
						latitude: lerp(
							previousSmoothed.latitude,
							current.coords.latitude,
							alpha,
						),
						longitude: lerp(
							previousSmoothed.longitude,
							current.coords.longitude,
							alpha,
						),
					}
				: {
						latitude: current.coords.latitude,
						longitude: current.coords.longitude,
					};

			smoothedRef.current = nextSmoothed;

			return {
				latitude: nextSmoothed.latitude,
				longitude: nextSmoothed.longitude,
				altitude:
					typeof current.coords.altitude === "number"
						? current.coords.altitude
						: null,
				accuracy:
					typeof current.coords.accuracy === "number"
						? current.coords.accuracy
						: null,
				speed:
					speedKmh != null && Number.isFinite(speedKmh)
						? Number(speedKmh.toFixed(2))
						: null,
				heading: normalizeHeading(
					typeof current.coords.heading === "number"
						? current.coords.heading
						: null,
				),
				timestamp: new Date(timestampMs).toISOString(),
			};
		},
		[],
	);

	const stopWatching = useCallback(() => {
		watcherRef.current?.remove();
		watcherRef.current = null;
	}, []);

	const getCurrentLocation = useCallback(async () => {
		setLoading(true);
		try {
			const granted = await requestPermission();
			if (!granted) {
				return null;
			}

			const current = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.BestForNavigation,
			});
			const mapped = mapLocation(current);
			setLocation(mapped);
			setError(null);
			return mapped;
		} catch {
			setError("Error getting location");
			return null;
		} finally {
			setLoading(false);
		}
	}, [mapLocation, requestPermission]);

	const startWatching = useCallback(async () => {
		const granted = await requestPermission();
		if (!granted || appStateRef.current !== "active") {
			return null;
		}

		stopWatching();

		const subscription = await Location.watchPositionAsync(
			{
				accuracy: Location.Accuracy.BestForNavigation,
				timeInterval: 2000,
				distanceInterval: 3,
				mayShowUserSettingsDialog: true,
			},
			(current) => {
				const mapped = mapLocation(current);
				setLocation(mapped);
				setError(null);
			},
		);

		watcherRef.current = subscription;
		return subscription;
	}, [mapLocation, requestPermission, stopWatching]);

	useEffect(() => {
		const sub = AppState.addEventListener("change", (nextState) => {
			appStateRef.current = nextState;
			if (nextState !== "active") {
				stopWatching();
			}
		});

		return () => {
			sub.remove();
			stopWatching();
		};
	}, [stopWatching]);

	useEffect(() => {
		if (!autoRequest) {
			return;
		}

		void getCurrentLocation();
	}, [autoRequest, getCurrentLocation]);

	return {
		location,
		error,
		loading,
		hasPermission,
		getCurrentLocation,
		startWatching,
		stopWatching,
	};
}
