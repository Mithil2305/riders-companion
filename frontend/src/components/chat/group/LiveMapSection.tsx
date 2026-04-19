import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { withAlpha } from "../../../utils/color";
import { RiderLocation } from "../../../types/groupChat";

const RIDER_MARKER_ICON = {
	uri: "https://img.icons8.com/ios-filled/100/1A73E8/navigation.png",
};

interface LiveMapSectionProps {
	riders: RiderLocation[];
	lastUpdatedAt?: string | null;
	refreshIntervalMinutes?: number;
}

const normalizeRiders = (riders: RiderLocation[]) => {
	if (riders.length === 0) {
		return [] as Array<RiderLocation & { x: number; y: number }>;
	}

	const latitudes = riders.map((item) => item.latitude);
	const longitudes = riders.map((item) => item.longitude);

	const minLat = Math.min(...latitudes);
	const maxLat = Math.max(...latitudes);
	const minLon = Math.min(...longitudes);
	const maxLon = Math.max(...longitudes);

	const latSpan = Math.max(maxLat - minLat, 0.01);
	const lonSpan = Math.max(maxLon - minLon, 0.01);

	return riders.map((item) => {
		const x = ((item.longitude - minLon) / lonSpan) * 74 + 13;
		const y = 86 - ((item.latitude - minLat) / latSpan) * 72;
		return {
			...item,
			x,
			y,
		};
	});
};

const toUpdatedLabel = (iso?: string | null) => {
	if (!iso) {
		return "Waiting for rider updates";
	}

	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "Waiting for rider updates";
	}

	return `Updated ${date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	})}`;
};

export function LiveMapSection({
	riders,
	lastUpdatedAt,
	refreshIntervalMinutes = 15,
}: LiveMapSectionProps) {
	const { colors, metrics, typography } = useTheme();
	const projected = React.useMemo(() => normalizeRiders(riders), [riders]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				wrap: {
					marginHorizontal: metrics.md,
					flex: 1,
					minHeight: 230,
					borderRadius: 20,
					backgroundColor: withAlpha(colors.success, 0.14),
					borderWidth: 1,
					borderColor: withAlpha(colors.success, 0.26),
					shadowColor: colors.shadow,
					shadowOpacity: 0.1,
					shadowOffset: { width: 0, height: 4 },
					shadowRadius: 10,
					elevation: 4,
					marginBottom: metrics.md,
					padding: metrics.sm,
				},
				mapCanvas: {
					flex: 1,
					borderRadius: 16,
					overflow: "hidden",
					backgroundColor: withAlpha(colors.success, 0.2),
				},
				mapTexture: {
					...StyleSheet.absoluteFillObject,
					backgroundColor: withAlpha(colors.success, 0.2),
				},
				hotspot: {
					position: "absolute",
					borderRadius: 999,
					backgroundColor: withAlpha(colors.success, 0.22),
				},
				hotspotOne: {
					width: 124,
					height: 124,
					top: "10%",
					left: "8%",
				},
				hotspotTwo: {
					width: 92,
					height: 92,
					top: "46%",
					left: "58%",
				},
				textureLine: {
					position: "absolute",
					width: "140%",
					left: "-20%",
					height: 1,
					backgroundColor: withAlpha(colors.success, 0.26),
				},
				lineOne: {
					top: "22%",
				},
				lineTwo: {
					top: "42%",
				},
				lineThree: {
					top: "62%",
				},
				routeLine: {
					position: "absolute",
					left: "19%",
					top: "20%",
					width: "58%",
					height: 3,
					backgroundColor: withAlpha(colors.primary, 0.5),
					transform: [{ rotate: "16deg" }],
					borderRadius: 999,
				},
				routeLineTwo: {
					position: "absolute",
					left: "31%",
					top: "52%",
					width: "38%",
					height: 3,
					backgroundColor: withAlpha(colors.primary, 0.5),
					transform: [{ rotate: "-24deg" }],
					borderRadius: 999,
				},
				markerLayer: {
					...StyleSheet.absoluteFillObject,
					paddingHorizontal: metrics.xs,
					paddingVertical: metrics.xs,
				},
				marker: {
					position: "absolute",
					width: 28,
					height: 28,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "transparent",
					zIndex: 3,
				},
				markerPulse: {
					position: "absolute",
					bottom: 3,
					width: 8,
					height: 8,
					borderRadius: 999,
					backgroundColor: withAlpha(colors.primary, 0.3),
				},
				markerIcon: {
					width: 22,
					height: 22,
					resizeMode: "contain",
					transform: [{ rotate: "-18deg" }],
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
				chipsRow: {
					position: "absolute",
					left: metrics.sm,
					right: metrics.sm,
					bottom: metrics.sm,
					flexDirection: "row",
					justifyContent: "space-between",
					gap: metrics.xs,
				},
				chip: {
					borderRadius: metrics.radius.full,
					paddingVertical: metrics.xs + 1,
					paddingHorizontal: metrics.sm,
					backgroundColor: withAlpha(colors.surface, 0.95),
					borderWidth: 1,
					borderColor: colors.border,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.xs,
					shadowColor: colors.shadow,
					shadowOpacity: 0.08,
					shadowOffset: { width: 0, height: 2 },
					shadowRadius: 6,
					elevation: 3,
					maxWidth: "50%",
				},
				chipText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.xs,
					fontWeight: "600",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<View style={styles.wrap}>
			<View style={styles.mapCanvas}>
				<View style={styles.mapTexture} />
				<View style={[styles.hotspot, styles.hotspotOne]} />
				<View style={[styles.hotspot, styles.hotspotTwo]} />
				<View style={[styles.textureLine, styles.lineOne]} />
				<View style={[styles.textureLine, styles.lineTwo]} />
				<View style={[styles.textureLine, styles.lineThree]} />
				<View style={styles.routeLine} />
				<View style={styles.routeLineTwo} />

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
									styles.marker,
									{
										left: `${rider.x}%`,
										top: `${rider.y}%`,
										transform: [{ translateX: -11 }, { translateY: -18 }],
									},
								]}
							>
								<View style={styles.markerPulse} />
								<Image source={RIDER_MARKER_ICON} style={styles.markerIcon} />
							</View>
						))}
					</View>
				)}

				<View style={styles.chipsRow}>
					<View style={styles.chip}>
						<Ionicons color={colors.primary} name="navigate-circle" size={16} />
						<Text
							style={styles.chipText}
						>{`${riders.length} rider${riders.length === 1 ? "" : "s"}`}</Text>
					</View>

					<View style={styles.chip}>
						<Ionicons color={colors.primary} name="time-outline" size={15} />
						<Text numberOfLines={1} style={styles.chipText}>
							{`${toUpdatedLabel(lastUpdatedAt)} • ${refreshIntervalMinutes}m API`}
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}
