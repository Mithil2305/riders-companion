import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ChatFilter } from '../../types/chat';

const FILTERS: Array<{ key: ChatFilter; label: string }> = [
  { key: 'mutual', label: 'Mutual' },
  { key: 'new', label: 'New' },
  { key: 'group', label: 'Group' },
];

interface FilterTabsProps {
  activeFilter: ChatFilter;
  onChange: (nextFilter: ChatFilter) => void;
}

export function FilterTabs({ activeFilter, onChange }: FilterTabsProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexDirection: 'row',
          paddingHorizontal: metrics.md,
          gap: metrics.sm,
          marginBottom: metrics.sm,
        },
        tab: {
          minHeight: 44,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.chatTabInactiveBg,
          paddingHorizontal: metrics.lg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        label: {
          fontSize: typography.sizes.lg,
          fontWeight: '500',
          color: colors.textPrimary,
        },
        labelActive: {
          color: colors.textInverse,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      {FILTERS.map((item) => {
        const isActive = item.key === activeFilter;

        return (
          <Pressable
            android_ripple={{ color: colors.overlayLight }}
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.tab, isActive ? styles.tabActive : null]}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}