import React from "react";
import { Dimensions, PanResponder } from "react-native";
import { useRouter } from "expo-router";
import {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";

type SwipeSection =
	| "home"
	| "explore"
	| "clips"
	| "ride"
	| "profile"
	| "settings";

const SCREEN_WIDTH = Dimensions.get("window").width;
const EDGE_ACTIVATION_WIDTH = 36;
const TRIGGER_DISTANCE = SCREEN_WIDTH * 0.2;

const nextRouteBySection: Record<SwipeSection, string | null> = {
	home: "/(tabs)/explore",
	explore: "/(tabs)/clips",
	clips: "/(tabs)/ride",
	ride: "/(tabs)/profile",
	profile: "/settings",
	settings: null,
};

export function useTabSwipeNavigation(
	section: SwipeSection,
	options?: { enabled?: boolean },
) {
	const router = useRouter();
	const translateX = useSharedValue(0);
	const [locked, setLocked] = React.useState(false);
	const nextRoute = nextRouteBySection[section];
	const enabled = options?.enabled ?? true;

	const navigateNext = React.useCallback(() => {
		if (!nextRoute) {
			setLocked(false);
			translateX.value = withSpring(0, { damping: 14, stiffness: 230 });
			return;
		}

		router.push(nextRoute);
		setLocked(false);
		translateX.value = 0;
	}, [nextRoute, router, translateX]);

	const panResponder = React.useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponder: (evt, gestureState) => {
					if (!enabled || locked || !nextRoute) {
						return false;
					}

					if (section === "profile") {
						const startX = evt.nativeEvent.pageX;
						if (startX < SCREEN_WIDTH - EDGE_ACTIVATION_WIDTH) {
							return false;
						}
					}

					const horizontal =
						Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2;
					return horizontal && gestureState.dx < -10;
				},
				onPanResponderMove: (_evt, gestureState) => {
					if (gestureState.dx < 0) {
						translateX.value = Math.max(gestureState.dx, -SCREEN_WIDTH * 0.3);
					}
				},
				onPanResponderRelease: (_evt, gestureState) => {
					if (locked) {
						translateX.value = withSpring(0, { damping: 14, stiffness: 230 });
						return;
					}

					if (gestureState.dx <= -TRIGGER_DISTANCE && nextRoute) {
						setLocked(true);
						translateX.value = withTiming(
							-SCREEN_WIDTH,
							{ duration: 210 },
							(finished) => {
								if (finished) {
									runOnJS(navigateNext)();
								}
							},
						);
						return;
					}

					translateX.value = withSpring(0, { damping: 14, stiffness: 230 });
				},
			}),
		[enabled, locked, navigateNext, nextRoute, section, translateX],
	);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	return {
		animatedStyle,
		swipeHandlers: panResponder.panHandlers,
		canSwipeForward: Boolean(nextRoute),
	};
}
