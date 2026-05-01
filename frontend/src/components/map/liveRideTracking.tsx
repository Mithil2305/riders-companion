/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import {
	ActivityIndicator,
	Image,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import MapView, {
	Marker,
	Polyline,
	PROVIDER_DEFAULT,
	PROVIDER_GOOGLE,
	type LatLng,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useLocation } from "../../hooks/useLocation";
import { useRideTracking } from "../../hooks/useRideTracking";
import { withAlpha } from "../../utils/color";
import { decodePolyline } from "../../utils/navigationStats";

interface LiveRideTrackerProps {
	rideId: string;
	canEndRide?: boolean;
	onBack?: () => void;
	onEndRide: () => void;
}

const DEFAULT_REGION = {
	latitude: 11.0017,
	longitude: 76.9619,
	latitudeDelta: 0.06,
	longitudeDelta: 0.06,
};

const DIRECTIONS_REFRESH_MS = 12000;
const DIRECTIONS_MIN_DISTANCE_METERS = 35;

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").trim();

const haversineMeters = (from: LatLng, to: LatLng) => {
	const toRad = (v: number) => (v * Math.PI) / 180;
	const earthRadius = 6371000;
	const dLat = toRad(to.latitude - from.latitude);
	const dLon = toRad(to.longitude - from.longitude);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(from.latitude)) *
			Math.cos(toRad(to.latitude)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return earthRadius * c;
};

const formatDuration = (seconds: number | null | undefined) => {
	if (!seconds || seconds <= 0) return "—";
	const totalMinutes = Math.max(1, Math.round(seconds / 60));
	if (totalMinutes < 60) {
		return `${totalMinutes} MIN`;
	}
	const hours = Math.floor(totalMinutes / 60);
	const mins = totalMinutes % 60;
	return `${hours}h ${mins}m`;
};

const formatEta = (seconds: number | null | undefined) => {
	if (!seconds || seconds <= 0) return "—";
	const eta = new Date(Date.now() + seconds * 1000);
	const hour = `${eta.getHours()}`.padStart(2, "0");
	const minute = `${eta.getMinutes()}`.padStart(2, "0");
	return `${hour}:${minute}`;
};

export default function LiveRideTracker({
	rideId,
	canEndRide = false,
	onBack,
	onEndRide,
}: LiveRideTrackerProps) {
	const { colors, metrics, typography, resolvedMode } = useTheme();
	const { location: userLocation } = useLocation({ autoRequest: true });

	const palette = React.useMemo(
		() => ({
			headerBg: withAlpha(colors.background, 0.95),
			panelBg: colors.surfaceRaised,
			panelShadow: colors.shadow,
			textPrimary: colors.textPrimary,
			textSecondary: colors.textSecondary,
			primary: colors.primary,
			iconBg: colors.primary,
			iconFg: colors.textInverse,
			dimOverlay:
				resolvedMode === "dark" ? withAlpha(colors.black, 0.28) : "transparent",
		}),
		[colors, resolvedMode],
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				map: {
					...StyleSheet.absoluteFillObject,
				},
				mapDim: {
					...StyleSheet.absoluteFillObject,
					// backgroundColor: palette.dimOverlay,
				},
				header: {
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 64,
					paddingHorizontal: metrics.md,
					flexDirection: "row" as const,
					alignItems: "center" as const,
					justifyContent: "space-between" as const,
					backgroundColor: palette.headerBg,
					borderBottomWidth: 1,
					borderBottomColor: withAlpha(colors.border, 0.5),
				},
				headerTitle: {
					color: palette.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "600" as const,
				},
				headerSpacer: {
					width: metrics.icon.md,
				},
				floatingNav: {
					position: "absolute" as const,
					right: metrics.lg,
					top: "50%",
					transform: [{ translateY: -28 }],
					width: 56,
					height: 56,
					borderRadius: 28,
					backgroundColor: palette.iconBg,
					alignItems: "center" as const,
					justifyContent: "center" as const,
					shadowColor: palette.panelShadow,
					shadowOpacity: 0.2,
					shadowRadius: 8,
					shadowOffset: { width: 0, height: 6 },
					elevation: 6,
				},
				bottomPanel: {
					position: "absolute" as const,
					left: 0,
					right: 0,
					bottom: 0,
					paddingHorizontal: metrics.lg,
					paddingTop: metrics.md,
					paddingBottom: metrics.lg,
					backgroundColor: palette.panelBg,
					borderTopLeftRadius: 20,
					borderTopRightRadius: 20,
					shadowColor: palette.panelShadow,
					shadowOpacity: 0.25,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: -6 },
					elevation: 10,
				},
				metricsRow: {
					flexDirection: "row" as const,
					justifyContent: "space-between" as const,
					marginBottom: metrics.md,
				},
				turnRow: {
					flexDirection: "row" as const,
					alignItems: "center" as const,
					justifyContent: "space-between" as const,
					gap: metrics.sm,
					marginBottom: metrics.md,
				},
				turnLabel: {
					color: palette.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "700" as const,
					textTransform: "uppercase" as const,
					letterSpacing: 0.6,
				},
				turnValue: {
					flex: 1,
					color: palette.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "600" as const,
				},
				metricItem: {
					flex: 1,
					alignItems: "center" as const,
				},
				metricValue: {
					color: palette.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700" as const,
				},
				metricSub: {
					marginTop: 2,
					color: palette.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "600" as const,
				},
				progressBar: {
					height: 6,
					backgroundColor: withAlpha(colors.border, 0.3),
					borderRadius: 3,
					marginBottom: metrics.md,
					overflow: "hidden" as const,
				},
				progressFill: {
					height: "100%" as const,
					backgroundColor: colors.primary,
					borderRadius: 3,
				},
				endRideButton: {
					height: 56,
					borderRadius: metrics.radius.lg,
					backgroundColor: palette.primary,
					flexDirection: "row" as const,
					alignItems: "center" as const,
					justifyContent: "center" as const,
					gap: metrics.sm,
				},
				endRideText: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "700" as const,
				},
				markerWrap: {
					alignItems: "center" as const,
				},
				markerGlow: {
					width: 34,
					height: 34,
					borderRadius: 17,
					backgroundColor: withAlpha(colors.primary, 0.28),
					alignItems: "center" as const,
					justifyContent: "center" as const,
					marginBottom: 6,
				},
				markerCore: {
					width: 26,
					height: 26,
					borderRadius: 13,
					backgroundColor: colors.primary,
					alignItems: "center" as const,
					justifyContent: "center" as const,
				},
				markerAvatar: {
					width: 22,
					height: 22,
					borderRadius: 11,
					backgroundColor: colors.textInverse,
				},
				participantMarker: {
					width: 30,
					height: 30,
					borderRadius: 15,
					backgroundColor: colors.primary,
					borderWidth: 2,
					borderColor: colors.textInverse,
					alignItems: "center" as const,
					justifyContent: "center" as const,
				},
				participantAvatar: {
					width: 26,
					height: 26,
					borderRadius: 13,
					backgroundColor: colors.textInverse,
				},
				markerLabel: {
					marginTop: 6,
					paddingHorizontal: 8,
					paddingVertical: 4,
					backgroundColor: palette.panelBg,
					borderRadius: 6,
					borderWidth: 1,
					borderColor: withAlpha(colors.border, 0.5),
				},
				markerLabelText: {
					color: palette.textPrimary,
					fontSize: typography.sizes.xs,
					fontWeight: "600" as const,
				},
				loadingContainer: {
					flex: 1,
					alignItems: "center" as const,
					justifyContent: "center" as const,
					backgroundColor: colors.background,
				},
				errorContainer: {
					flex: 1,
					alignItems: "center" as const,
					justifyContent: "center" as const,
					backgroundColor: colors.background,
					paddingHorizontal: metrics.lg,
				},
				errorText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					marginTop: metrics.md,
					textAlign: "center" as const,
				},
			}),
		[colors, metrics, palette, typography],
	);

	// Allow rendering even when rideId is not provided.
	// Component will fallback to showing only the map and user location when no ride is active.

	const { snapshot, navigationStats, locations, isLoading, error, refresh } =
		useRideTracking({
			rideId,
			enabled: true,
			pollIntervalMs: 3000,
		});

	const mapRef = React.useRef<MapView>(null);
	const hasCenteredRef = React.useRef(false);
	const followPauseUntilRef = React.useRef(0);
	const lastFollowAtRef = React.useRef(0);

	const [directionsRoute, setDirectionsRoute] = React.useState<LatLng[]>([]);
	const [directionsMeta, setDirectionsMeta] = React.useState<{
		distanceKm: number;
		durationSec: number;
		steps: Array<{
			instruction: string;
			distanceMeters: number;
			maneuver?: string;
		}>;
	} | null>(null);
	const lastDirectionsRef = React.useRef<{
		origin: LatLng | null;
		destination: LatLng | null;
		fetchedAt: number;
	}>({ origin: null, destination: null, fetchedAt: 0 });

	const routePolyline = snapshot?.route.routePolyline || [];
	const sourceCoord = snapshot?.route.sourceCoordinates || null;
	const destCoord = snapshot?.route.destinationCoordinates || null;
	const participants = snapshot?.participants || [];
	const sourceLabel = snapshot?.route.source || "Starting Point";
	const destinationLabel = snapshot?.route.destination || "Destination";

	const displayRoute =
		directionsRoute.length >= 2 ? directionsRoute : routePolyline;
	const remainingKm =
		directionsMeta?.distanceKm ?? navigationStats?.distanceRemainingKm ?? 0;
	const totalKm = Math.max(
		navigationStats?.distanceTotalKm ?? remainingKm,
		remainingKm,
	);
	const etaLabel = directionsMeta?.durationSec
		? formatEta(directionsMeta.durationSec)
		: navigationStats?.eta || "—";
	const remainingLabel = directionsMeta?.durationSec
		? formatDuration(directionsMeta.durationSec)
		: navigationStats?.remainingFormatted || "—";
	const nextStep = directionsMeta?.steps?.[0];
	const nextTurnText = nextStep?.instruction || "Continue";
	const nextTurnDistance = nextStep?.distanceMeters
		? nextStep.distanceMeters >= 1000
			? `${(nextStep.distanceMeters / 1000).toFixed(1)} km`
			: `${Math.round(nextStep.distanceMeters)} m`
		: "";

	// Get the rider's avatar (destination rider if in group ride)
	const destinationRider = participants.find((p) => p.isLeader);
	const destinationAvatar = destinationRider?.avatar || undefined;

	React.useEffect(() => {
		const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
		if (!apiKey || !userLocation || !destCoord) {
			setDirectionsRoute([]);
			setDirectionsMeta(null);
			return;
		}

		const origin = {
			latitude: userLocation.latitude,
			longitude: userLocation.longitude,
		};
		const now = Date.now();
		const last = lastDirectionsRef.current;
		const movedMeters = last.origin
			? haversineMeters(last.origin, origin)
			: DIRECTIONS_MIN_DISTANCE_METERS + 1;
		const destChanged = last.destination
			? haversineMeters(last.destination, destCoord) >
				DIRECTIONS_MIN_DISTANCE_METERS
			: true;

		if (
			now - last.fetchedAt < DIRECTIONS_REFRESH_MS &&
			movedMeters < DIRECTIONS_MIN_DISTANCE_METERS &&
			!destChanged
		) {
			return;
		}

		let cancelled = false;
		lastDirectionsRef.current = {
			origin,
			destination: destCoord,
			fetchedAt: now,
		};

		const fetchDirections = async () => {
			const url =
				"https://maps.googleapis.com/maps/api/directions/json?" +
				`origin=${origin.latitude},${origin.longitude}` +
				`&destination=${destCoord.latitude},${destCoord.longitude}` +
				"&mode=driving" +
				"&units=metric" +
				`&key=${encodeURIComponent(apiKey)}`;
			const response = await fetch(url);
			const data = (await response.json()) as {
				status?: string;
				routes?: Array<{
					overview_polyline?: { points?: string };
					legs?: Array<{
						distance?: { value?: number };
						duration?: { value?: number };
						steps?: Array<{
							html_instructions?: string;
							distance?: { value?: number };
							maneuver?: string;
						}>;
					}>;
				}>;
			};

			if (data.status !== "OK" || !data.routes?.length) {
				return null;
			}

			const route = data.routes[0];
			const polyline = route?.overview_polyline?.points
				? decodePolyline(route.overview_polyline.points)
				: [];
			const leg = route?.legs?.[0];
			const steps = (leg?.steps ?? []).map((step) => ({
				instruction: stripHtml(step.html_instructions || ""),
				distanceMeters: Number(step.distance?.value ?? 0),
				maneuver: step.maneuver,
			}));
			return {
				polyline,
				distanceKm: Number(leg?.distance?.value ?? 0) / 1000,
				durationSec: Number(leg?.duration?.value ?? 0),
				steps,
			};
		};

		fetchDirections()
			.then((result) => {
				if (cancelled || !result) {
					return;
				}
				setDirectionsRoute(result.polyline);
				setDirectionsMeta({
					distanceKm: result.distanceKm,
					durationSec: result.durationSec,
					steps: result.steps,
				});
			})
			.catch(() => {
				if (!cancelled) {
					setDirectionsMeta(null);
					setDirectionsRoute([]);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [destCoord, userLocation]);

	// Auto-center on user location
	React.useEffect(() => {
		if (!mapRef.current || !userLocation || hasCenteredRef.current) return;
		mapRef.current.animateToRegion(
			{
				latitude: userLocation.latitude,
				longitude: userLocation.longitude,
				latitudeDelta: 0.02,
				longitudeDelta: 0.02,
			},
			500,
		);
		hasCenteredRef.current = true;
	}, [userLocation]);

	React.useEffect(() => {
		if (!mapRef.current || !userLocation) return;
		if (Date.now() < followPauseUntilRef.current) return;
		if (Date.now() - lastFollowAtRef.current < 1200) return;

		mapRef.current.animateToRegion(
			{
				latitude: userLocation.latitude,
				longitude: userLocation.longitude,
				latitudeDelta: 0.015,
				longitudeDelta: 0.015,
			},
			450,
		);
		lastFollowAtRef.current = Date.now();
	}, [userLocation]);

	const handleRecenter = React.useCallback(() => {
		if (!mapRef.current || !userLocation) return;
		mapRef.current.animateToRegion(
			{
				latitude: userLocation.latitude,
				longitude: userLocation.longitude,
				latitudeDelta: 0.02,
				longitudeDelta: 0.02,
			},
			500,
		);
	}, [userLocation]);

	// Show loading state
	if (isLoading && !snapshot) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.errorText}>Loading ride data...</Text>
			</View>
		);
	}

	const isValidRideId = Boolean(rideId && rideId.trim().length > 0);

	// Show error state only when a rideId was requested and snapshot isn't available
	if (error && !snapshot && isValidRideId) {
		return (
			<View style={styles.errorContainer}>
				<Ionicons
					name="alert-circle-outline"
					size={48}
					color={colors.textSecondary}
				/>
				<Text style={styles.errorText}>{error}</Text>
				<Pressable
					onPress={refresh}
					style={[styles.endRideButton, { marginTop: metrics.lg, width: 120 }]}
				>
					<Ionicons name="refresh" size={18} color={colors.textInverse} />
					<Text style={styles.endRideText}>Retry</Text>
				</Pressable>
			</View>
		);
	}

	// Render map with real data
	return (
		<View style={styles.container}>
			<MapView
				ref={mapRef}
				style={styles.map}
				provider={
					Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
				}
				initialRegion={DEFAULT_REGION}
				showsUserLocation
				showsMyLocationButton={false}
				showsCompass={false}
				showsScale={false}
				toolbarEnabled={false}
				rotateEnabled={false}
				moveOnMarkerPress={false}
				onPanDrag={() => {
					followPauseUntilRef.current = Date.now() + 5000;
				}}
			>
				{/* Render route polyline */}
				{displayRoute.length >= 2 && (
					<>
						{/* Background layer for visibility */}
						<Polyline
							coordinates={displayRoute}
							strokeColor={withAlpha(colors.primary, 0.28)}
							strokeWidth={9}
							lineJoin="round"
							lineCap="round"
						/>
						{/* Main route line */}
						<Polyline
							coordinates={displayRoute}
							strokeColor={colors.primary}
							strokeWidth={6}
							lineJoin="round"
							lineCap="round"
						/>
					</>
				)}

				{/* Source marker */}
				{sourceCoord && (
					<Marker
						coordinate={sourceCoord}
						anchor={{ x: 0.5, y: 1 }}
						tracksViewChanges={false}
					>
						<View style={styles.markerWrap}>
							<View style={styles.markerCore}>
								<Ionicons
									name="location"
									size={16}
									color={colors.textInverse}
								/>
							</View>
							<View style={styles.markerLabel}>
								<Text style={styles.markerLabelText}>{sourceLabel}</Text>
							</View>
						</View>
					</Marker>
				)}

				{/* Destination marker with avatar */}
				{destCoord && (
					<Marker
						coordinate={destCoord}
						anchor={{ x: 0.5, y: 1 }}
						tracksViewChanges={false}
					>
						<View style={styles.markerWrap}>
							<View style={styles.markerGlow}>
								<View style={styles.markerCore}>
									{destinationAvatar ? (
										<Image
											source={{ uri: destinationAvatar }}
											style={styles.markerAvatar}
										/>
									) : (
										<Ionicons
											name="person"
											size={14}
											color={colors.textInverse}
										/>
									)}
								</View>
							</View>
							<View style={styles.markerLabel}>
								<Text style={styles.markerLabelText}>{destinationLabel}</Text>
							</View>
						</View>
					</Marker>
				)}

				{/* Other participants markers */}
				{locations.map((location) => (
					<Marker
						key={location.riderId}
						coordinate={{
							latitude: location.latitude,
							longitude: location.longitude,
						}}
						anchor={{ x: 0.5, y: 0.5 }}
						tracksViewChanges={false}
					>
						<View style={styles.participantMarker}>
							{location.avatar ? (
								<Image
									source={{ uri: location.avatar }}
									style={styles.participantAvatar}
								/>
							) : (
								<Ionicons name="person" size={14} color={colors.textInverse} />
							)}
						</View>
					</Marker>
				))}
			</MapView>

			{/* Dim overlay */}
			<View pointerEvents="none" style={styles.mapDim} />

			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={onBack} hitSlop={8}>
					<Ionicons
						name="arrow-back"
						size={metrics.icon.md}
						color={colors.textPrimary}
					/>
				</Pressable>
				<Text style={styles.headerTitle}>Live Tracking</Text>
				<View style={styles.headerSpacer} />
			</View>

			{/* Recenter button */}
			<Pressable onPress={handleRecenter} style={styles.floatingNav}>
				<Ionicons name="navigate" size={22} color={palette.iconFg} />
			</Pressable>

			{/* Bottom stats panel */}
			<View style={styles.bottomPanel}>
				<View style={styles.turnRow}>
					<Text style={styles.turnLabel}>Next</Text>
					<Text numberOfLines={1} style={styles.turnValue}>
						{nextTurnText}
					</Text>
					{nextTurnDistance.length > 0 ? (
						<Text style={styles.turnLabel}>{nextTurnDistance}</Text>
					) : null}
				</View>
				{/* Progress bar */}
				{navigationStats && (
					<View style={styles.progressBar}>
						<View
							style={[
								styles.progressFill,
								{
									width: `${navigationStats.progress}%`,
								},
							]}
						/>
					</View>
				)}

				{/* Metrics */}
				<View style={styles.metricsRow}>
					<View style={styles.metricItem}>
						<Text style={styles.metricValue}>
							{navigationStats?.speedKmh.toFixed(1) || "0"}
						</Text>
						<Text style={styles.metricSub}>KM/H</Text>
					</View>
					<View style={styles.metricItem}>
						<Text style={styles.metricValue}>{remainingKm.toFixed(1)}</Text>
						<Text style={styles.metricSub}>/ {totalKm.toFixed(1)} KM</Text>
					</View>
					<View style={styles.metricItem}>
						<Text style={styles.metricValue}>
							{navigationStats?.elapsedFormatted || "0:00"}
						</Text>
						<Text style={styles.metricSub}>/ {remainingLabel}</Text>
					</View>
					<View style={styles.metricItem}>
						<Text style={styles.metricValue}>{etaLabel}</Text>
						<Text style={styles.metricSub}>ETA</Text>
					</View>
				</View>

				{/* End ride button */}
				{canEndRide ? (
					<Pressable onPress={onEndRide} style={styles.endRideButton}>
						<Ionicons name="close" size={18} color={colors.textInverse} />
						<Text style={styles.endRideText}>End Ride</Text>
					</Pressable>
				) : null}
			</View>

			{/* Loading indicator overlay during refresh */}
			{isLoading && snapshot && (
				<View
					style={{
						position: "absolute",
						top: metrics.lg,
						right: metrics.lg,
					}}
				>
					<ActivityIndicator size="small" color={colors.primary} />
				</View>
			)}
		</View>
	);
}
