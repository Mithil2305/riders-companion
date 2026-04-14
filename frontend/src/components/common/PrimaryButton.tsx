import React from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";

interface PrimaryButtonProps {
	title: string;
	onPress: () => void;
	disabled?: boolean;
	loading?: boolean;
	style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
	title,
	onPress,
	disabled = false,
	loading = false,
	style,
}: PrimaryButtonProps) {
	const { colors, metrics, typography } = useTheme();
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePressIn = () => {
		scale.value = withTiming(0.975, { duration: 90 });
	};

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 14, stiffness: 260 });
	};

	const isDisabled = disabled || loading;
	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				button: {
					minHeight: 54,
					borderRadius: metrics.radius.xl,
					backgroundColor: colors.buttonPrimaryBg,
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: metrics.lg,
					paddingVertical: metrics.sm,
					shadowColor: colors.buttonPrimaryGlow,
					shadowOffset: { width: 0, height: 10 },
					shadowOpacity: 0.32,
					shadowRadius: 16,
					elevation: 5,
				},
				disabled: {
					opacity: 0.68,
				},
				buttonText: {
					color: colors.buttonPrimaryText,
					fontSize: typography.sizes.base,
					fontWeight: "700",
					letterSpacing: 0.4,
					lineHeight: 22,
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<AnimatedPressable
			style={[
				styles.button,
				style,
				animatedStyle,
				isDisabled && styles.disabled,
			]}
			android_ripple={{ color: colors.overlayLight }}
			disabled={isDisabled}
			hitSlop={4}
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
		>
			{loading ? (
				<ActivityIndicator color={colors.buttonPrimaryText} />
			) : (
				<Text style={styles.buttonText}>{title}</Text>
			)}
		</AnimatedPressable>
	);
}
