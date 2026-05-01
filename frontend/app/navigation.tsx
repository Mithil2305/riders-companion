import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LiveRideTracker } from "../src/components/map";
import { useTheme } from "../src/hooks/useTheme";

type NavigationParams = {
	rideId?: string;
	canEndRide?: string;
};

export default function NavigationScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<NavigationParams>();
	const { colors } = useTheme();

	const rideId = typeof params.rideId === "string" ? params.rideId : "";
	const canEndRide = params.canEndRide === "true";

	return (
		<SafeAreaView
			edges={["top", "left", "right"]}
			style={{ flex: 1, backgroundColor: colors.background }}
		>
			<LiveRideTracker
				rideId={rideId}
				canEndRide={canEndRide}
				onBack={() => router.back()}
				onEndRide={() => router.back()}
			/>
		</SafeAreaView>
	);
}
