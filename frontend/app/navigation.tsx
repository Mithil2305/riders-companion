import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LiveRideTracker } from "../src/components/map";
import { useTheme } from "../src/hooks/useTheme";

type NavigationParams = {
	sourceLabel?: string;
	destinationLabel?: string;
	destinationAvatar?: string;
	speed?: string;
	distance?: string;
	distanceTotal?: string;
	elapsed?: string;
	remaining?: string;
	eta?: string;
};

function parseNumber(value: string | undefined, fallback: number) {
	if (!value) return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export default function NavigationScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<NavigationParams>();
	const { colors } = useTheme();

	const sourceLabel = typeof params.sourceLabel === "string" ? params.sourceLabel : undefined;
	const destinationLabel =
		typeof params.destinationLabel === "string" ? params.destinationLabel : undefined;
	const destinationAvatar =
		typeof params.destinationAvatar === "string" ? params.destinationAvatar : undefined;

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
			<LiveRideTracker
				sourceLabel={sourceLabel}
				destinationLabel={destinationLabel}
				destinationAvatar={destinationAvatar}
				onBack={() => router.back()}
				onEndRide={() => router.back()}
				stats={{
					speedKmh: parseNumber(params.speed, 1),
					distanceKm: parseNumber(params.distance, 0.0),
					distanceTotalKm: parseNumber(params.distanceTotal, 2.1),
					elapsed: params.elapsed ?? "0:34",
					remaining: params.remaining ?? "6 MIN",
					eta: params.eta ?? "8:30 AM",
				}}
			/>
		</SafeAreaView>
	);
}
