import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Badge } from '../../types/profile';
import { useTheme } from '../../hooks/useTheme';

interface BadgeItemProps {
  badge: Badge;
  index: number;
}

export function BadgeItem({ badge, index }: BadgeItemProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        item: {
          width: '31%',
          borderRadius: metrics.radius.lg,
          borderWidth: 1,
          borderColor: badge.unlocked ? colors.primary : colors.border,
          backgroundColor: colors.card,
          minHeight: 92,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: metrics.xs,
          paddingVertical: metrics.sm,
          shadowColor: badge.unlocked ? colors.primary : colors.shadow,
          shadowOpacity: badge.unlocked ? 0.36 : 0,
          shadowRadius: badge.unlocked ? 10 : 0,
          shadowOffset: { width: 0, height: 2 },
          elevation: badge.unlocked ? 6 : 0,
        },
        label: {
          color: badge.unlocked ? colors.textPrimary : colors.textTertiary,
          fontSize: typography.sizes.xs,
          textAlign: 'center',
          marginTop: metrics.xs,
          fontWeight: '600',
        },
      }),
    [badge.unlocked, colors, metrics, typography],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(300)} style={styles.item}>
      <Ionicons
        color={badge.unlocked ? colors.primary : colors.textTertiary}
        name={badge.unlocked ? 'ribbon' : 'ribbon-outline'}
        size={metrics.icon.md}
      />
      <Text style={styles.label}>{badge.title}</Text>
    </Animated.View>
  );
}
