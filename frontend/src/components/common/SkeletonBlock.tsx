import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface SkeletonBlockProps {
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBlock({ style }: SkeletonBlockProps) {
  const { colors, metrics } = useTheme();
  const opacity = useSharedValue(0.35);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.95, { duration: 700 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        block: {
          borderRadius: metrics.radius.md,
          backgroundColor: colors.surface,
        },
      }),
    [colors, metrics],
  );

  return <Animated.View style={[styles.block, style, animatedStyle]} />;
}
