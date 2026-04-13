import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RideItem } from '../../types/community';
import { TagChip } from './TagChip';

interface RideCardProps {
  item: RideItem;
  mode: 'nearby' | 'myRides';
  onPrimaryAction?: (id: string) => void;
}

export function RideCard({ item, mode, onPrimaryAction }: RideCardProps) {
  const { colors, metrics, typography } = useTheme();
  const isMyRide = mode === 'myRides';
  const isCompleted = isMyRide && item.status === 'completed';
  const isActionDisabled = isMyRide || isCompleted;

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: metrics.radius.xl,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: metrics.md,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 3,
          opacity: isCompleted ? 0.7 : 1,
        },
        topRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        routeWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          maxWidth: metrics.screenWidth * 0.58,
        },
        route: {
          color: colors.textPrimary,
          fontSize: typography.sizes['lg'],
          fontWeight: '600',
        },
        levelTag: {
          marginLeft: metrics.sm,
          borderRadius: metrics.radius.sm,
          backgroundColor: colors.overlayLight,
          paddingHorizontal: metrics.xs + 2,
          paddingVertical: 2,
        },
        levelLabel: {
          color: colors.primary,
          fontSize: typography.sizes.xs - 2,
          fontWeight: '600',
        },
        priceWrap: {
          alignItems: 'flex-end',
        },
        price: {
          color: colors.primary,
          fontSize: typography.sizes['xl'],
          fontWeight: '700',
        },
        perDay: {
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
          fontWeight: '500',
          letterSpacing: 0.8,
        },
        startsAt: {
          marginTop: metrics.sm,
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        tagsRow: {
          marginTop: metrics.md,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: metrics.sm,
        },
        bottomRow: {
          marginTop: metrics.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        joinedWrap: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        joinedText: {
          marginLeft: metrics.sm,
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        actionBtn: {
          minWidth: 104,
          height: metrics.button.sm.height,
          borderRadius: metrics.radius.lg,
          borderWidth: 1,
          borderColor: isMyRide ? colors.borderDark : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          paddingHorizontal: metrics.md,
        },
        actionLabel: {
          color: isMyRide ? colors.textTertiary : colors.primary,
          fontSize: typography.sizes.lg,
          fontWeight: '600',
        },
        statusActive: {
          color: colors.primary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        statusEnded: {
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
          fontWeight: '700',
          letterSpacing: 0.8,
        },
        endedBadge: {
          borderRadius: metrics.radius.full,
          paddingHorizontal: metrics.sm,
          paddingVertical: 4,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
      }),
    [colors, isCompleted, metrics, typography],
  );

  const actionLabel = isMyRide ? 'View' : 'Join';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.routeWrap}>
          <Text style={styles.route}>{item.route}</Text>
          {item.levelTag ? (
            <View style={styles.levelTag}>
              <Text style={styles.levelLabel}>{item.levelTag}</Text>
            </View>
          ) : null}
        </View>

        {isMyRide ? (
          item.status === 'active' ? (
            <Text style={styles.statusActive}>{item.statusLabel || 'Active'}</Text>
          ) : (
            <View style={styles.endedBadge}>
              <Text style={styles.statusEnded}>{item.statusLabel || 'ENDED'}</Text>
            </View>
          )
        ) : (
          <View style={styles.priceWrap}>
            <Text style={styles.price}>{item.pricePerDay}</Text>
            <Text style={styles.perDay}>PER DAY</Text>
          </View>
        )}
      </View>

      <Text style={styles.startsAt}>{item.startsAt}</Text>

      <View style={styles.tagsRow}>
        {item.tags.map((tag) => (
          <TagChip chip={tag} key={tag.id} />
        ))}
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.joinedWrap}>
          <Ionicons color={colors.textSecondary} name="person" size={metrics.icon.sm + 2} />
          <Text style={styles.joinedText}>{item.joinedText}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={isActionDisabled ? 1 : 0.8}
          disabled={isActionDisabled}
          onPress={() => onPrimaryAction?.(item.id)}
          style={styles.actionBtn}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
