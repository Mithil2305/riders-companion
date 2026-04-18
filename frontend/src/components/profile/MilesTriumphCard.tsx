import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface MilesTriumphCardProps {
  totalDistance: number;
  milestoneTarget: number;
  progressMiles: number;
  animatedProgressStyle: any;
}

export function MilesTriumphCard({
  totalDistance,
  milestoneTarget,
  progressMiles,
  animatedProgressStyle,
}: MilesTriumphCardProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingHorizontal: 0,
          gap: metrics.sm,
        },
        sectionTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        hugeValue: {
          color: colors.primary,
          fontSize: 40,
          fontWeight: '700',
          textAlign: 'center',
          marginTop: metrics.md,
        },
        subText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
        },
        progressTrack: {
          marginTop: metrics.sm,
          height: 9,
          borderRadius: metrics.radius.full,
          backgroundColor: "#eca6a64a",
          overflow: 'hidden',
          width: '54%',
          alignSelf: 'center',
        },
        progressFill: {
          height: '100%',
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
        },
        progressCaption: {
          marginTop: metrics.sm,
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          textAlign: 'center',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.card}>
      <View style={styles.sectionTitleRow}>
        <Ionicons color={colors.primary} name="trophy-outline" size={metrics.icon.md} />
        <Text style={styles.sectionTitle}>Miles Triumph</Text>
      </View>
      <Text style={styles.hugeValue}>{totalDistance} KM</Text>
      <Text style={styles.subText}>Total Distance Traveled</Text>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
      </View>
      <Text style={styles.progressCaption}>
        {Math.round(progressMiles * 100)}% to next milestone ({milestoneTarget} KM)
      </Text>
    </View>
  );
}
