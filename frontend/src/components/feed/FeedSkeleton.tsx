import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

export function FeedSkeleton() {
  const { colors, metrics } = useTheme();
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        list: {
          paddingTop: metrics.sm,
          gap: metrics.lg,
        },
        card: {
          backgroundColor: colors.background,
          overflow: 'hidden',
          paddingBottom: metrics.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderDark,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
          paddingBottom: metrics.sm,
          gap: metrics.sm,
        },
        avatar: {
          width: 34,
          height: 34,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
        },
        lines: {
          flex: 1,
          gap: metrics.xs,
        },
        lineShort: {
          width: metrics.screenWidth * 0.28,
          height: metrics.sm,
          borderRadius: metrics.radius.sm,
          backgroundColor: colors.surface,
        },
        lineTiny: {
          width: metrics.screenWidth * 0.16,
          height: metrics.sm,
          borderRadius: metrics.radius.sm,
          backgroundColor: colors.surface,
        },
        image: {
          width: '100%',
          height: metrics.screenWidth * 0.9,
          backgroundColor: colors.surface,
        },
        footer: {
          padding: metrics.md,
          gap: metrics.sm,
        },
        footerLine: {
          width: '70%',
          height: metrics.sm,
          borderRadius: metrics.radius.sm,
          backgroundColor: colors.surface,
        },
      }),
    [colors, metrics],
  );

  return (
    <View style={styles.list}>
      {[1, 2].map((id) => (
        <Animated.View key={id} style={[styles.card, shimmerStyle]}>
          <View style={styles.header}>
            <View style={styles.avatar} />
            <View style={styles.lines}>
              <View style={styles.lineShort} />
              <View style={styles.lineTiny} />
            </View>
          </View>
          <View style={styles.image} />
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <View style={styles.footerLine} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
