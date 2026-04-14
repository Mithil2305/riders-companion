import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../utils/color';

interface GroupChatHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  onOpenMenu: () => void;
}

export function GroupChatHeader({ title, subtitle, onBack, onOpenMenu }: GroupChatHeaderProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm,
          paddingBottom: metrics.md,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        leftTap: {
          width: 36,
          height: 36,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        center: {
          flex: 1,
          marginLeft: metrics.sm,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        subtitle: {
          marginTop: 2,
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '500',
        },
        right: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
          marginLeft: metrics.sm,
          position: 'relative',
        },
        activeBadge: {
          position: 'absolute',
          top: 0,
          right: 30,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.xs,
          backgroundColor: withAlpha(colors.success, 0.15),
          borderRadius: metrics.radius.full,
          paddingHorizontal: metrics.sm,
          paddingVertical: 4,
        },
        dot: {
          width: 10,
          height: 10,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.success,
        },
        badgeText: {
          color: colors.success,
          fontSize: typography.sizes.xs,
          fontWeight: '600',
          letterSpacing: 0.4,
        },
        menuTap: {
          width: 34,
          height: 34,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable accessibilityLabel="Back" onPress={onBack} style={styles.leftTap}>
          <Ionicons color={colors.textPrimary} name="arrow-back" size={26} />
        </Pressable>

        <View style={styles.center}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.right}>
          <View style={styles.activeBadge}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>ACTIVE RIDE</Text>
          </View>

          <Pressable accessibilityLabel="Open menu" onPress={onOpenMenu} style={styles.menuTap}>
            <Ionicons color={colors.textPrimary} name="ellipsis-vertical" size={22} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
