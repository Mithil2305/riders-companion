import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface StatItem {
  key: string;
  label: string;
  value: number;
}

interface StatsCardProps {
  stats: StatItem[];
  onPressStat?: (statKey: string) => void;
}

function StatValue({ value }: { value: number }) {
  const { colors, typography } = useTheme();
  const [display, setDisplay] = React.useState(0);
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = 0;
    animatedValue.value = withTiming(value, { duration: 900 });
  }, [animatedValue, value]);

  useAnimatedReaction(
    () => animatedValue.value,
    (next) => {
      runOnJS(setDisplay)(Math.round(next));
    },
    [animatedValue],
  );

  return (
    <Text
      style={{
        color: colors.primary,
        fontSize: typography.sizes['3xl'],
        fontWeight: '700',
      }}
    >
      {display}
    </Text>
  );
}

export function StatsCard({ stats, onPressStat }: StatsCardProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: metrics.md,
          paddingHorizontal: metrics.lg,
          gap: metrics.md,
        },
        statItem: {
          flex: 1,
          alignItems: 'center',
          minHeight: 54,
          justifyContent: 'center',
        },
        statLabel: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
          marginTop: metrics.xs,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.card}>
      {stats.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onPressStat?.(item.key)}
          style={styles.statItem}
        >
          <StatValue value={item.value} />
          <Text style={styles.statLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}
