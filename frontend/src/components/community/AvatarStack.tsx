import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { AvatarItem } from '../../types/community';

interface AvatarStackProps {
  avatars: AvatarItem[];
  extraCount: number;
}

export function AvatarStack({ avatars, extraCount }: AvatarStackProps) {
  const { colors, metrics, typography } = useTheme();

  const palette = React.useMemo(
    () => [colors.primary, colors.secondary, colors.icon, colors.textSecondary],
    [colors],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: metrics.xs,
        },
        avatar: {
          width: metrics.avatar.sm,
          height: metrics.avatar.sm,
          borderRadius: metrics.radius.full,
          borderWidth: 2,
          borderColor: colors.card,
          marginLeft: -metrics.sm,
          alignItems: 'center',
          justifyContent: 'center',
        },
        initials: {
          color: colors.textInverse,
          fontSize: typography.sizes.xs,
          fontWeight: '700',
        },
        countWrap: {
          marginLeft: -metrics.sm,
          minWidth: metrics.avatar.sm,
          height: metrics.avatar.sm,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: metrics.sm,
        },
        count: {
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
          fontWeight: '500',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.row}>
      {avatars.map((avatar, index) => (
        <View key={avatar.id} style={[styles.avatar, { backgroundColor: palette[index % palette.length] }]}>
          <Text style={styles.initials}>{avatar.name}</Text>
        </View>
      ))}
      <View style={styles.countWrap}>
        <Text style={styles.count}>+{extraCount}</Text>
      </View>
    </View>
  );
}
