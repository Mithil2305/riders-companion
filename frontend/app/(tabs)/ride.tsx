import React from "react";
import Animated from "react-native-reanimated";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { RideDetailsScreen } from "../ride-details";

export default function RideScreen() {
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("ride");

	return (
		<Animated.View
			style={[{ flex: 1 }, swipeAnimatedStyle]}
			{...swipeHandlers}
		>
			<RideDetailsScreen
				actionPlacement="inline"
				forcedRideType="group"
				showBackButton={false}
				showSafetySection={false}
				showTypeBadge={false}
			/>
		</Animated.View>
	);
}
