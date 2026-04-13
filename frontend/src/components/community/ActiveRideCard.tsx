import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ActiveRideData } from '../../types/community';
import { AvatarStack } from './AvatarStack';

interface ActiveRideCardProps {
  data: ActiveRideData;
  onOpenRide: () => void;
}

export function ActiveRideCard({ data, onOpenRide }: ActiveRideCardProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginHorizontal: metrics.md,
          padding: metrics.md + 4,
          borderRadius: metrics.radius.xl,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        topRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        badge: {
          backgroundColor: colors.overlayLight,
          borderRadius: metrics.radius.full,
          paddingHorizontal: metrics.sm + 2,
          paddingVertical: metrics.xs,
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          marginBottom: metrics.sm,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          marginRight: metrics.xs,
        },
        badgeLabel: {
          color: colors.primary,
          fontSize: typography.sizes.xs,
          fontWeight: '600',
          letterSpacing: 0.8,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['xl'],
          fontWeight: '700',
          lineHeight: typography.sizes['xl'] + 8,
          maxWidth: metrics.screenWidth * 0.55,
        },
        subtitle: {
          marginTop: metrics.xs,
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        actionIcon: {
          width: 40,
          height: 40,
          borderRadius: metrics.radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        bottomRow: {
          marginTop: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        openBtn: {
          height: metrics.button.md.height,
          borderRadius: metrics.radius.lg,
          backgroundColor: colors.primary,
          paddingHorizontal: metrics.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        openLabel: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text style={styles.badgeLabel}>{data.badge}</Text>
          </View>

          <Text style={styles.title}>{data.title.replace(' -> ', ' ->\n')}</Text>
          <Text style={styles.subtitle}>{data.subtitle}</Text>
        </View>

        <View style={styles.actionIcon}>
          <Ionicons
            color={colors.primary}
            name={data.actionIcon === 'navigate' ? 'navigate-outline' : 'options-outline'}
            size={metrics.icon.md - 4}
          />
        </View>
      </View>

      <View style={styles.bottomRow}>
        <AvatarStack avatars={data.avatars} extraCount={data.extraCount} />
        <TouchableOpacity activeOpacity={0.9} onPress={onOpenRide} style={styles.openBtn}>
          <Text style={styles.openLabel}>Open Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
