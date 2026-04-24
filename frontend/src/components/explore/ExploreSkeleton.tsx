import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";

export function ExploreSkeleton() {
	const { colors, metrics } = useTheme();
	const opacity = useSharedValue(0.35);

	React.useEffect(() => {
		opacity.value = withRepeat(withTiming(0.9, { duration: 750 }), -1, true);
	}, [opacity]);

	const shimmer = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const cellSize = (metrics.screenWidth - metrics.md * 2 - metrics.xs * 2) / 3;

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
					paddingHorizontal: metrics.md,
					gap: metrics.md,
					paddingTop: metrics.sm,
				},
				searchBar: {
					height: 44,
					borderRadius: metrics.radius.lg,
					backgroundColor: colors.surface,
					width: "100%",
				},
				grid: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: metrics.xs,
				},
				cell: {
					width: cellSize,
					height: cellSize,
					borderRadius: metrics.radius.md,
					backgroundColor: colors.surface,
				},
				tallCell: {
					width: cellSize,
					height: cellSize * 2 + metrics.xs,
					borderRadius: metrics.radius.md,
					backgroundColor: colors.surface,
				},
				wideCell: {
					width: cellSize * 2 + metrics.xs,
					height: cellSize,
					borderRadius: metrics.radius.md,
					backgroundColor: colors.surface,
				},
			}),
		[cellSize, colors, metrics],
	);

	return (
		<Animated.View style={[styles.container, shimmer]}>
			<View style={styles.searchBar} />
			<View style={styles.grid}>
				{/* Row 1: 3 equal cells */}
				<View style={styles.cell} />
				<View style={styles.cell} />
				<View style={styles.cell} />

				{/* Row 2: tall + 2 stacked */}
				<View style={styles.tallCell} />
				<View style={{ gap: metrics.xs }}>
					<View style={styles.cell} />
					<View style={styles.cell} />
				</View>

				{/* Row 3: 3 equal cells */}
				<View style={styles.cell} />
				<View style={styles.cell} />
				<View style={styles.cell} />

				{/* Row 4: wide + 1 */}
				<View style={styles.wideCell} />
				<View style={styles.cell} />
			</View>
		</Animated.View>
	);
}
