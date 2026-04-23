import React from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { withAlpha } from "../../../utils/color";
import { RiderLocation } from "../../../types/groupChat";

const RIDER_MARKER_ICON = {
	uri: "https://img.icons8.com/ios-filled/100/1A73E8/navigation.png",
};

const DESTINATION_MARKER_ICON = {
	uri: "https://img.icons8.com/ios-filled/100/D93025/marker.png",
};

const DEFAULT_MAP_CENTER = {
	latitude: 11.0017,
	longitude: 76.9619,
};

interface LiveMapSectionProps {
	riders: RiderLocation[];
	leaderRiderId?: string | null;
	recenterSignal?: number;
	isRideEnded?: boolean;
}

const clampPercent = (value: number) => Math.max(7, Math.min(93, value));

const normalizeRiders = (
	riders: RiderLocation[],
	leaderRiderId?: string | null,
	followLeader = false,
) => {
	if (riders.length === 0) {
		return [] as (RiderLocation & { x: number; y: number })[];
	}

	const latitudes = riders.map((item) => item.latitude);
	const longitudes = riders.map((item) => item.longitude);

	const minLat = Math.min(...latitudes);
	const maxLat = Math.max(...latitudes);
	const minLon = Math.min(...longitudes);
	const maxLon = Math.max(...longitudes);

	const latSpan = Math.max(maxLat - minLat, 0.01);
	const lonSpan = Math.max(maxLon - minLon, 0.01);

	const projected = riders.map((item) => {
		const x = ((item.longitude - minLon) / lonSpan) * 74 + 13;
		const y = 86 - ((item.latitude - minLat) / latSpan) * 72;
		return {
			...item,
			x,
			y,
		};
	});

	if (!followLeader) {
		return projected;
	}

	const leader = projected.find((item) => item.riderId === leaderRiderId);
	if (!leader) {
		return projected;
	}

	const shiftX = 50 - leader.x;
	const shiftY = 50 - leader.y;

	return projected.map((item) => ({
		...item,
		x: clampPercent(item.x + shiftX),
		y: clampPercent(item.y + shiftY),
	}));
};

const buildPathSegments = (points: { x: number; y: number }[]) => {
	if (points.length < 2) {
		return [] as {
			left: number;
			top: number;
			length: number;
			angle: number;
		}[];
	}

	return points.slice(1).map((point, index) => {
		const prev = points[index];
		const dx = point.x - prev.x;
		const dy = point.y - prev.y;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

		return {
			left: prev.x,
			top: prev.y,
			length,
			angle,
		};
	});
};

export function LiveMapSection({
	riders,
	leaderRiderId,
	recenterSignal = 0,
	isRideEnded = false,
}: LiveMapSectionProps) {
	const { colors, metrics, typography } = useTheme();
	const [followLeader, setFollowLeader] = React.useState(true);
	const markerPulse = React.useRef(new Animated.Value(0.72)).current;

	React.useEffect(() => {
		setFollowLeader(true);
	}, [recenterSignal]);

	const ridersSorted = React.useMemo(
		() =>
			[...riders].sort((a, b) => {
				if (a.updatedAt === b.updatedAt) {
					return a.riderId.localeCompare(b.riderId);
				}
				return a.updatedAt.localeCompare(b.updatedAt);
			}),
		[riders],
	);

	const leaderRider = React.useMemo(
		() =>
			ridersSorted.find((entry) => entry.riderId === leaderRiderId) ??
			ridersSorted[0] ??
			null,
		[leaderRiderId, ridersSorted],
	);

	const projected = React.useMemo(
		() => normalizeRiders(ridersSorted, leaderRiderId, followLeader),
		[followLeader, leaderRiderId, ridersSorted],
	);

	const destinationPoint = React.useMemo(() => {
		if (!leaderRider) {
			return { x: 82, y: 24 };
		}

		const leaderProjected =
			projected.find((entry) => entry.riderId === leaderRider.riderId) ?? null;

		if (!leaderProjected) {
			return { x: 82, y: 24 };
		}

		return {
			x: clampPercent(leaderProjected.x + 28),
			y: clampPercent(leaderProjected.y - 22),
		};
	}, [leaderRider, projected]);

	const routeSegments = React.useMemo(() => {
		const leaderProjected =
			leaderRider &&
			projected.find((entry) => entry.riderId === leaderRider.riderId)
				? (projected.find((entry) => entry.riderId === leaderRider.riderId) as {
						x: number;
						y: number;
					})
				: null;

		if (!leaderProjected) {
			return buildPathSegments(projected);
		}

		return buildPathSegments([leaderProjected, destinationPoint]);
	}, [destinationPoint, leaderRider, projected]);

	const mapCenter = React.useMemo(() => {
		if (followLeader && leaderRider) {
			return {
				latitude: leaderRider.latitude,
				longitude: leaderRider.longitude,
			};
		}

		if (ridersSorted.length === 0) {
			return DEFAULT_MAP_CENTER;
		}

		const latSum = ridersSorted.reduce((sum, rider) => sum + rider.latitude, 0);
		const lonSum = ridersSorted.reduce(
			(sum, rider) => sum + rider.longitude,
			0,
		);

		return {
			latitude: latSum / ridersSorted.length,
			longitude: lonSum / ridersSorted.length,
		};
	}, [followLeader, leaderRider, ridersSorted]);

	const mapImageUri = React.useMemo(
		() =>
			`https://staticmap.openstreetmap.de/staticmap.php?center=${mapCenter.latitude.toFixed(
				5,
			)},${mapCenter.longitude.toFixed(5)}&zoom=13&size=1200x700&maptype=mapnik`,
		[mapCenter.latitude, mapCenter.longitude],
	);

	React.useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(markerPulse, {
					toValue: 1,
					duration: 700,
					easing: Easing.out(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.timing(markerPulse, {
					toValue: 0.72,
					duration: 700,
					easing: Easing.in(Easing.quad),
					useNativeDriver: true,
				}),
			]),
		).start();
	}, [markerPulse]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				wrap: {
					marginHorizontal: metrics.md,
					borderRadius: 18,
					overflow: "hidden",
					height: 320,
					borderWidth: 1,
					borderColor: "#EAEAEA",
					backgroundColor: "#E9EEEA",
				},
				mapImage: {
					...StyleSheet.absoluteFillObject,
					width: undefined,
					height: undefined,
				},
				mapTint: {
					...StyleSheet.absoluteFillObject,
					backgroundColor: withAlpha("#AFC6BC", 0.12),
				},
				routeLayer: {
					...StyleSheet.absoluteFillObject,
					paddingHorizontal: metrics.sm,
					paddingVertical: metrics.md,
				},
				routeSegmentShadow: {
					position: "absolute",
					height: 9,
					borderRadius: 999,
					backgroundColor: withAlpha("#1557D3", 0.28),
				},
				routeSegment: {
					position: "absolute",
					height: 6,
					borderRadius: 999,
					backgroundColor: "#1B67FF",
				},
				markerLayer: {
					...StyleSheet.absoluteFillObject,
				},
				markerWrap: {
					position: "absolute",
					width: 32,
					height: 32,
					alignItems: "center",
					justifyContent: "center",
				},
				markerPulse: {
					position: "absolute",
					bottom: 4,
					width: 11,
					height: 11,
					borderRadius: 999,
					backgroundColor: withAlpha("#1b67ff", 0.35),
				},
				markerIcon: {
					width: 25,
					height: 25,
					resizeMode: "contain",
					transform: [{ rotate: "-18deg" }],
				},
				rideChip: {
					position: "absolute",
					top: metrics.sm,
					left: metrics.sm,
					borderRadius: 999,
					paddingHorizontal: metrics.sm,
					paddingVertical: metrics.xs,
					backgroundColor: withAlpha(
						isRideEnded ? colors.error : "#32A852",
						0.18,
					),
					borderWidth: 1,
					borderColor: withAlpha(isRideEnded ? colors.error : "#32A852", 0.45),
				},
				rideChipText: {
					color: isRideEnded ? colors.error : "#2B8A3E",
					fontSize: typography.sizes.xs,
					fontWeight: "800",
					letterSpacing: 0.3,
				},
				speedChip: {
					position: "absolute",
					left: metrics.sm,
					bottom: metrics.sm,
					width: 64,
					height: 64,
					borderRadius: 32,
					backgroundColor: "#FFFFFF",
					alignItems: "center",
					justifyContent: "center",
					borderWidth: 1,
					borderColor: "#EFEFEF",
				},
				speedValue: {
					color: colors.textPrimary,
					fontSize: typography.sizes["2xl"],
					fontWeight: "700",
					lineHeight: typography.sizes["2xl"],
				},
				speedUnit: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "600",
				},
				emptyWrap: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					gap: metrics.xs,
					paddingHorizontal: metrics.lg,
				},
				emptyText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
				},
			}),
		[colors, isRideEnded, metrics, typography],
	);

	return (
		<View style={styles.wrap}>
			<Image source={{ uri: mapImageUri }} style={styles.mapImage} />
			<View style={styles.mapTint} />

			<View style={styles.routeLayer}>
				{routeSegments.map((segment, index) => (
					<React.Fragment key={`segment-${index}`}>
						<View
							style={[
								styles.routeSegmentShadow,
								{
									left: `${segment.left}%`,
									top: `${segment.top}%`,
									width: `${segment.length}%`,
									transform: [
										{ translateY: -4 },
										{ rotate: `${segment.angle}deg` },
									],
								},
							]}
						/>
						<View
							style={[
								styles.routeSegment,
								{
									left: `${segment.left}%`,
									top: `${segment.top}%`,
									width: `${segment.length}%`,
									transform: [
										{ translateY: -3 },
										{ rotate: `${segment.angle}deg` },
									],
								},
							]}
						/>
					</React.Fragment>
				))}
			</View>

			{projected.length === 0 ? (
				<View style={styles.emptyWrap}>
					<Ionicons
						color={withAlpha(colors.textPrimary, 0.6)}
						name="map-outline"
						size={34}
					/>
					<Text style={styles.emptyText}>
						No rider locations yet. Tracking will appear here.
					</Text>
				</View>
			) : (
				<View style={styles.markerLayer}>
					{projected.map((rider) => (
						<View
							key={rider.riderId}
							style={[
								styles.markerWrap,
								{
									left: `${rider.x}%`,
									top: `${rider.y}%`,
									transform: [{ translateX: -11 }, { translateY: -18 }],
								},
							]}
						>
							<Animated.View
								style={[
									styles.markerPulse,
									{ transform: [{ scale: markerPulse }] },
								]}
							/>
							<Image source={RIDER_MARKER_ICON} style={styles.markerIcon} />
						</View>
					))}

					<View
						style={[
							styles.markerWrap,
							{
								left: `${destinationPoint.x}%`,
								top: `${destinationPoint.y}%`,
								transform: [{ translateX: -11 }, { translateY: -18 }],
							},
						]}
					>
						<Image source={DESTINATION_MARKER_ICON} style={styles.markerIcon} />
					</View>
				</View>
			)}

			<View style={styles.rideChip}>
				<Text style={styles.rideChipText}>
					{isRideEnded ? "RIDE ENDED" : "RIDE LIVE"}
				</Text>
			</View>

			<View style={styles.speedChip}>
				<Text style={styles.speedValue}>0</Text>
				<Text style={styles.speedUnit}>km/h</Text>
			</View>
		</View>
	);
}
