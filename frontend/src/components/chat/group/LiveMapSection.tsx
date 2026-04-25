import React from "react";
import {
	ActivityIndicator,
	Animated,
	Easing,
	Image,
	Platform,
	StyleSheet,
	Text,
	View,
} from "react-native";
import MapView, {
	Marker,
	Polyline,
	PROVIDER_GOOGLE,
	PROVIDER_DEFAULT,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { withAlpha } from "../../../utils/color";
import { RiderLocation } from "../../../types/groupChat";

const RIDER_MARKER_ICON = { uri: "https://img.icons8.com/ios-filled/100/1A73E8/navigation.png" };
const DESTINATION_MARKER_ICON = { uri: "https://img.icons8.com/ios-filled/100/D93025/marker.png" };
const SOURCE_MARKER_ICON = { uri: "https://img.icons8.com/ios-filled/100/32A852/marker.png" };

const DEFAULT_REGION = { latitude: 11.0017, longitude: 76.9619, latitudeDelta: 0.08, longitudeDelta: 0.08 };

type LatLng = { latitude: number; longitude: number };

// ── Google Encoded Polyline Decoder ──────────────────────────────────────────
// https://developers.google.com/maps/documentation/utilities/polylinealgorithm
function decodePolyline(encoded: string): LatLng[] {
	const points: LatLng[] = [];
	let index = 0;
	const len = encoded.length;
	let lat = 0;
	let lng = 0;
	while (index < len) {
		let shift = 0;
		let result = 0;
		let byte: number;
		do {
			byte = encoded.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);
		const dLat = result & 1 ? ~(result >> 1) : result >> 1;
		lat += dLat;
		shift = 0;
		result = 0;
		do {
			byte = encoded.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);
		const dLng = result & 1 ? ~(result >> 1) : result >> 1;
		lng += dLng;
		points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
	}
	return points;
}

// ── Geocoding API ─────────────────────────────────────────────────────────────
async function geocodePlace(label: string, apiKey: string): Promise<LatLng | null> {
	if (!label || label.trim().length < 3) return null;
	try {
		const url =
			"https://maps.googleapis.com/maps/api/geocode/json?address=" +
			encodeURIComponent(label.trim()) +
			"&key=" + encodeURIComponent(apiKey);
		const res = await fetch(url);
		const data = (await res.json()) as {
			status: string;
			results?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
		};
		if (data.status !== "OK" || !data.results?.length) return null;
		const loc = data.results[0]?.geometry?.location;
		if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;
		return { latitude: loc.lat, longitude: loc.lng };
	} catch { return null; }
}

// ── Directions API — actual road-following route ───────────────────────────────
async function fetchRoutePolyline(origin: LatLng, destination: LatLng, apiKey: string): Promise<LatLng[]> {
	try {
		const url =
			"https://maps.googleapis.com/maps/api/directions/json?" +
			"origin=" + origin.latitude + "," + origin.longitude +
			"&destination=" + destination.latitude + "," + destination.longitude +
			"&mode=driving" +
			"&key=" + encodeURIComponent(apiKey);
		const res = await fetch(url);
		const data = (await res.json()) as {
			status: string;
			routes?: { overview_polyline?: { points?: string } }[];
		};
		if (data.status !== "OK" || !data.routes?.length) return [];
		const encoded = data.routes[0]?.overview_polyline?.points;
		if (!encoded) return [];
		return decodePolyline(encoded);
	} catch { return []; }
}

// ── Camera helpers ────────────────────────────────────────────────────────────
const regionForPoints = (points: LatLng[]) => {
	if (points.length === 0) return DEFAULT_REGION;
	const lats = points.map((p) => p.latitude);
	const lngs = points.map((p) => p.longitude);
	const minLat = Math.min(...lats), maxLat = Math.max(...lats);
	const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
	return {
		latitude: (minLat + maxLat) / 2,
		longitude: (minLng + maxLng) / 2,
		latitudeDelta: Math.max(maxLat - minLat, 0.012) * 2.4,
		longitudeDelta: Math.max(maxLng - minLng, 0.012) * 2.4,
	};
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface LiveMapSectionProps {
	riders: RiderLocation[];
	leaderRiderId?: string | null;
	recenterSignal?: number;
	isRideEnded?: boolean;
	/** false → pre-ride: road route preview; true → live rider tracking */
	rideStarted?: boolean;
	sourceLabel?: string;
	destinationLabel?: string;
	lastUpdatedAt?: string | null;
}

// ── Rider Marker ──────────────────────────────────────────────────────────────
interface RiderMarkerViewProps { isLeader: boolean; markerPulse: Animated.Value; }

const RiderMarkerView = React.memo(function RiderMarkerView({ isLeader, markerPulse }: RiderMarkerViewProps) {
	return (
		<View style={markerStyles.wrap}>
			<Animated.View
				style={[markerStyles.pulse, isLeader && markerStyles.leaderPulse, { transform: [{ scale: markerPulse }] }]}
			/>
			<Image source={RIDER_MARKER_ICON} style={markerStyles.icon} />
		</View>
	);
});

const markerStyles = StyleSheet.create({
	wrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
	pulse: { position: "absolute", bottom: 4, width: 13, height: 13, borderRadius: 999, backgroundColor: withAlpha("#1b67ff", 0.35) },
	leaderPulse: { backgroundColor: withAlpha("#E83A3A", 0.38), width: 16, height: 16 },
	icon: { width: 26, height: 26, resizeMode: "contain", transform: [{ rotate: "-18deg" }] },
});

// ── Main Component ────────────────────────────────────────────────────────────
export function LiveMapSection({
	riders, leaderRiderId, recenterSignal = 0,
	isRideEnded = false, rideStarted = false,
	sourceLabel, destinationLabel,
}: LiveMapSectionProps) {
	const { colors, metrics, typography } = useTheme();
	const mapRef = React.useRef<MapView>(null);
	const markerPulse = React.useRef(new Animated.Value(0.72)).current;
	const [sourceCoord, setSourceCoord] = React.useState<LatLng | null>(null);
	const [destCoord, setDestCoord] = React.useState<LatLng | null>(null);
	const [routePoints, setRoutePoints] = React.useState<LatLng[]>([]);
	const [loading, setLoading] = React.useState(false);

	// Step 1 — geocode both place name labels
	React.useEffect(() => {
		const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
		if (!apiKey) return;
		let cancelled = false;
		setLoading(true);
		Promise.all([
			sourceLabel ? geocodePlace(sourceLabel, apiKey) : Promise.resolve(null),
			destinationLabel ? geocodePlace(destinationLabel, apiKey) : Promise.resolve(null),
		]).then(([src, dst]) => {
			if (cancelled) return;
			setSourceCoord(src);
			setDestCoord(dst);
		});
		return () => { cancelled = true; };
	}, [sourceLabel, destinationLabel]);

	// Step 2 — fetch real road route from Directions API once coords are ready
	React.useEffect(() => {
		const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
		if (!apiKey || !sourceCoord || !destCoord) { setLoading(false); return; }
		let cancelled = false;
		setLoading(true);
		fetchRoutePolyline(sourceCoord, destCoord, apiKey).then((pts) => {
			if (cancelled) return;
			setRoutePoints(pts);
			setLoading(false);
		});
		return () => { cancelled = true; };
	}, [sourceCoord, destCoord]);

	const ridersSorted = React.useMemo(
		() => [...riders].sort((a, b) =>
			a.updatedAt === b.updatedAt ? a.riderId.localeCompare(b.riderId) : a.updatedAt.localeCompare(b.updatedAt)
		),
		[riders],
	);

	const leaderRider = React.useMemo(
		() => ridersSorted.find((r) => r.riderId === leaderRiderId) ?? ridersSorted[0] ?? null,
		[leaderRiderId, ridersSorted],
	);

	React.useEffect(() => {
		const anim = Animated.loop(Animated.sequence([
			Animated.timing(markerPulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
			Animated.timing(markerPulse, { toValue: 0.72, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
		]));
		anim.start();
		return () => anim.stop();
	}, [markerPulse]);

	// Recenter signal:
	//   Pre-ride  → snap to source pin (start location)
	//   Live ride → snap to organizer/leader's live GPS position
	React.useEffect(() => {
		if (!mapRef.current || recenterSignal === 0) return;

		if (!rideStarted) {
			// Pre-ride: zoom to the source/start location
			if (sourceCoord) {
				mapRef.current.animateToRegion(
					{ latitude: sourceCoord.latitude, longitude: sourceCoord.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 },
					500,
				);
			}
		} else {
			// Live ride: zoom to organizer's current position
			if (leaderRider) {
				mapRef.current.animateToRegion(
					{ latitude: leaderRider.latitude, longitude: leaderRider.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 },
					500,
				);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [recenterSignal]);

	// Fit camera to road route (preview mode)
	React.useEffect(() => {
		if (!mapRef.current || rideStarted || routePoints.length === 0) return;
		mapRef.current.animateToRegion(regionForPoints(routePoints), 700);
	}, [rideStarted, routePoints]);

	// Fit camera to all riders + destination (live mode)
	React.useEffect(() => {
		if (!mapRef.current || !rideStarted || ridersSorted.length === 0) return;
		const pts = ridersSorted.map((r) => ({ latitude: r.latitude, longitude: r.longitude }));
		if (destCoord) pts.push(destCoord);
		mapRef.current.animateToRegion(regionForPoints(pts), 600);
	}, [rideStarted, ridersSorted, destCoord]);

	// Live polyline: simple line from cluster of riders toward fixed destination
	const livePolylineCoords = React.useMemo<LatLng[]>(() => {
		if (!rideStarted || ridersSorted.length === 0) return [];
		const pts = ridersSorted.map((r) => ({ latitude: r.latitude, longitude: r.longitude }));
		if (destCoord) pts.push(destCoord);
		return pts;
	}, [rideStarted, ridersSorted, destCoord]);

	const styles = React.useMemo(() => StyleSheet.create({
		wrap: { marginHorizontal: metrics.md, borderRadius: 18, overflow: "hidden", height: 320, borderWidth: 1, borderColor: "#EAEAEA", backgroundColor: "#E9EEEA" },
		map: { ...StyleSheet.absoluteFillObject },
		rideChip: { position: "absolute", top: metrics.sm, left: metrics.sm, borderRadius: 999, paddingHorizontal: metrics.sm, paddingVertical: metrics.xs, backgroundColor: withAlpha(isRideEnded ? colors.error : rideStarted ? "#32A852" : "#1B67FF", 0.18), borderWidth: 1, borderColor: withAlpha(isRideEnded ? colors.error : rideStarted ? "#32A852" : "#1B67FF", 0.45) },
		rideChipText: { color: isRideEnded ? colors.error : rideStarted ? "#2B8A3E" : "#1553B6", fontSize: typography.sizes.xs, fontWeight: "800", letterSpacing: 0.3 },
		speedChip: { position: "absolute", left: metrics.sm, bottom: metrics.sm, width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#EFEFEF" },
		speedValue: { color: colors.textPrimary, fontSize: typography.sizes["2xl"], fontWeight: "700", lineHeight: typography.sizes["2xl"] },
		speedUnit: { color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: "600" },
		emptyWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: metrics.xs, paddingHorizontal: metrics.lg, backgroundColor: "#E9EEEA" },
		emptyText: { color: colors.textSecondary, fontSize: typography.sizes.sm, textAlign: "center" },
		loadingOverlay: { position: "absolute", top: metrics.sm, right: metrics.sm, backgroundColor: withAlpha("#FFFFFF", 0.85), borderRadius: 99, padding: 6 },
		pinLabel: { position: "absolute", backgroundColor: "#FFFFFF", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, top: -22, alignSelf: "center", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
		pinLabelText: { fontSize: 10, fontWeight: "700", color: "#111827", maxWidth: 110 },
	}), [colors, isRideEnded, rideStarted, metrics, typography]);

	const chipLabel = isRideEnded ? "RIDE ENDED" : rideStarted ? "RIDE LIVE" : "ROUTE PREVIEW";
	const showEmpty = rideStarted && ridersSorted.length === 0;
	const showSpeedChip = rideStarted || isRideEnded;

	return (
		<View style={styles.wrap}>
			<MapView
				ref={mapRef} style={styles.map}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
				initialRegion={DEFAULT_REGION}
				showsUserLocation={false} showsMyLocationButton={false}
				showsCompass={false} showsScale={false}
				toolbarEnabled={false} moveOnMarkerPress={false}
				rotateEnabled={false} mapType="standard"
			>
				{/* PRE-RIDE: real road route polyline from Directions API */}
				{!rideStarted && routePoints.length >= 2 && (
					<>
						<Polyline coordinates={routePoints} strokeColor={withAlpha("#1557D3", 0.28)} strokeWidth={9} lineJoin="round" lineCap="round" />
						<Polyline coordinates={routePoints} strokeColor="#1B67FF" strokeWidth={6} lineJoin="round" lineCap="round" />
					</>
				)}
				{/* LIVE: connecting line from riders toward destination */}
				{rideStarted && livePolylineCoords.length >= 2 && (
					<>
						<Polyline coordinates={livePolylineCoords} strokeColor={withAlpha("#1557D3", 0.28)} strokeWidth={9} lineJoin="round" lineCap="round" />
						<Polyline coordinates={livePolylineCoords} strokeColor="#1B67FF" strokeWidth={6} lineJoin="round" lineCap="round" />
					</>
				)}
				{/* PRE-RIDE: green source pin */}
				{!rideStarted && sourceCoord && (
					<Marker coordinate={sourceCoord} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
						<View>
							<View style={styles.pinLabel}><Text style={styles.pinLabelText} numberOfLines={1} ellipsizeMode="tail">{sourceLabel ?? "Start"}</Text></View>
							<Image source={SOURCE_MARKER_ICON} style={{ width: 26, height: 26, resizeMode: "contain" }} />
						</View>
					</Marker>
				)}
				{/* LIVE: rider markers with pulse */}
				{rideStarted && ridersSorted.map((rider) => (
					<Marker key={rider.riderId} coordinate={{ latitude: rider.latitude, longitude: rider.longitude }} title={rider.name} anchor={{ x: 0.5, y: 0.9 }} tracksViewChanges={false}>
						<RiderMarkerView isLeader={rider.riderId === leaderRider?.riderId} markerPulse={markerPulse} />
					</Marker>
				))}
				{/* Destination pin — geocoded once, never moves */}
				{destCoord && (
					<Marker coordinate={destCoord} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
						<View>
							<View style={styles.pinLabel}><Text style={styles.pinLabelText} numberOfLines={1} ellipsizeMode="tail">{destinationLabel ?? "Destination"}</Text></View>
							<Image source={DESTINATION_MARKER_ICON} style={{ width: 26, height: 26, resizeMode: "contain" }} />
						</View>
					</Marker>
				)}
			</MapView>

			{showEmpty && (
				<View style={styles.emptyWrap}>
					<Ionicons color={withAlpha(colors.textPrimary, 0.6)} name="map-outline" size={34} />
					<Text style={styles.emptyText}>No rider locations yet. Tracking will appear here.</Text>
				</View>
			)}
			{loading && (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="small" color={colors.primary} />
				</View>
			)}
			<View style={styles.rideChip}><Text style={styles.rideChipText}>{chipLabel}</Text></View>
			{showSpeedChip && (
				<View style={styles.speedChip}>
					<Text style={styles.speedValue}>0</Text>
					<Text style={styles.speedUnit}>km/h</Text>
				</View>
			)}
		</View>
	);
}
