import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface CollapsibleSectionProps {
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

export function CollapsibleSection({
  title,
  isCollapsed,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        title: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '600',
        },
        listWrap: {
          marginTop: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <Pressable android_ripple={{ color: colors.overlayLight }} onPress={onToggle} style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          color={colors.textSecondary}
          name={isCollapsed ? 'chevron-forward-outline' : 'chevron-down-outline'}
          size={metrics.icon.md}
        />
      </Pressable>

      {!isCollapsed ? <View style={styles.listWrap}>{children}</View> : null}
    </View>
  );
}
