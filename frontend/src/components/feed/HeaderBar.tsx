import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { IconButton } from '../common';

interface HeaderBarProps {
  title?: string;
}

export function HeaderBar({ title = 'Moments' }: HeaderBarProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.md,
          paddingBottom: metrics.sm,
        },
        left: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.xl,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        right: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <View style={styles.left}>
        <Ionicons color={colors.primary} name="flash-outline" size={metrics.icon.md} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.right}>
        <IconButton icon="chatbubble-ellipses-outline" />
        <IconButton icon="notifications-outline" />
      </View>
    </View>
  );
}
