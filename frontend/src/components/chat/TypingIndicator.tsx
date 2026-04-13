import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

function Dot({ delay }: { delay: number }) {
  const { colors, metrics } = useTheme();
  const opacity = useSharedValue(0.25);

  React.useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(withTiming(1, { duration: 420 }), -1, true));
  }, [delay, opacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[stylesFactory(metrics).dot, { backgroundColor: colors.textSecondary }, dotStyle]} />;
}

const stylesFactory = (metrics: ReturnType<typeof useTheme>['metrics']) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: metrics.xs,
      paddingHorizontal: metrics.md,
      paddingVertical: metrics.sm,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: metrics.radius.full,
    },
  });

export function TypingIndicator() {
  const { metrics } = useTheme();
  const styles = React.useMemo(() => stylesFactory(metrics), [metrics]);

  return (
    <View style={styles.root}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}