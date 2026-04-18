import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type ProfileStatKey = 'moments' | 'trackers' | 'tracking';

interface ProfileStatItem {
  key: ProfileStatKey;
  label: string;
  value: number;
}

interface ProfileStatsRowProps {
  stats: ProfileStatItem[];
  onPressStat: (key: ProfileStatKey) => void;
}

export function ProfileStatsRow({ stats, onPressStat }: ProfileStatsRowProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        statsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: metrics.lg,
        },
        statItem: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 46,
          borderRadius: metrics.radius.md,
        },
        statItemPressed: {
          backgroundColor: colors.surface,
        },
        statValue: {
          color: colors.textPrimary,
          fontSize: typography.sizes.xl,
          fontWeight: '700',
        },
        statLabel: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.statsRow}>
      {stats.map((item) => (
        <Pressable
          key={item.key}
          disabled={item.key === 'moments'}
          onPress={() => onPressStat(item.key)}
          style={({ pressed }) => [
            styles.statItem,
            pressed && item.key !== 'moments' && styles.statItemPressed,
          ]}
        >
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
