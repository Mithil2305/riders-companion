import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface ToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
}

export function ToggleSwitch({ value, onToggle }: ToggleSwitchProps) {
  const { colors, metrics } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 220 });
  }, [progress, value]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: 58,
          height: 34,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: value ? colors.primary : colors.border,
          backgroundColor: value ? colors.primary : colors.surface,
          justifyContent: 'center',
          paddingHorizontal: 3,
        },
        thumb: {
          width: 26,
          height: 26,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.textInverse,
        },
      }),
    [colors, metrics, value],
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 24 }],
  }));

  return (
    <Pressable onPress={onToggle} style={styles.root}>
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Pressable>
  );
}
