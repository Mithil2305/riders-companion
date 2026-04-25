import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";

export function ClipsSkeleton() {
	const { colors, metrics } = useTheme();
	const { height, width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const opacity = useSharedValue(0.35);

	React.useEffect(() => {
		opacity.value = withRepeat(withTiming(0.9, { duration: 750 }), -1, true);
	}, [opacity]);

	const shimmer = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				clip: {
					width,
					height: height - insets.top,
					backgroundColor: colors.background,
				},
				media: {
					...StyleSheet.absoluteFillObject,
					backgroundColor: colors.surface,
				},
				rightRail: {
					position: "absolute",
					right: metrics.md,
					bottom: insets.bottom + 110,
					alignItems: "center",
					gap: metrics.lg,
				},
				circle: {
					width: 44,
					height: 44,
					borderRadius: 22,
					backgroundColor: colors.surface,
				},
				smallCircle: {
					width: 12,
					height: 12,
					borderRadius: 6,
					backgroundColor: colors.surface,
					marginTop: metrics.xs,
				},
				bottomMeta: {
					position: "absolute",
					left: metrics.md,
					right: metrics.xl + 60,
					bottom: insets.bottom + metrics.lg,
					gap: metrics.sm,
				},
				lineWide: {
					width: "60%",
					height: 14,
					borderRadius: metrics.radius.sm,
					backgroundColor: colors.surface,
				},
				lineMedium: {
					width: "80%",
					height: 12,
					borderRadius: metrics.radius.sm,
					backgroundColor: colors.surface,
				},
				lineShort: {
					width: "40%",
					height: 10,
					borderRadius: metrics.radius.sm,
					backgroundColor: colors.surface,
				},
			}),
		[colors, height, insets.bottom, insets.top, metrics, width],
	);

	return (
		<View style={styles.container}>
			<Animated.View style={[styles.clip, shimmer]}>
				<View style={styles.media} />
				<View style={styles.rightRail}>
					<View style={styles.circle} />
					{[1, 2, 3].map((i) => (
						<View key={i} style={{ alignItems: "center" }}>
							<View style={styles.circle} />
							<View style={styles.smallCircle} />
						</View>
					))}
				</View>
				<View style={styles.bottomMeta}>
					<View style={styles.lineWide} />
					<View style={styles.lineMedium} />
					<View style={styles.lineShort} />
				</View>
			</Animated.View>
		</View>
	);
}
