import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ChatFilter } from '../../types/chat';

const FILTERS: Array<{ key: ChatFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'personal', label: 'Personal' },
  { key: 'group', label: 'Group' },
  { key: 'ended', label: 'Ended' },
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
          paddingHorizontal: metrics.md,
          marginBottom: metrics.sm,
        },
        content: {
          gap: metrics.xs,
          paddingRight: metrics.md,
        },
        tab: {
          minHeight: 30,
          minWidth: 58,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.chatTabInactiveBg,
          paddingHorizontal: metrics.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        label: {
          fontSize: typography.sizes.sm,
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
      <ScrollView contentContainerStyle={styles.content} horizontal showsHorizontalScrollIndicator={false}>
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
      </ScrollView>
    </View>
  );
}