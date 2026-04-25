import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RideTagChip } from '../../types/community';

interface TagChipProps {
  chip: RideTagChip;
}

export function TagChip({ chip }: TagChipProps) {
  const { colors, metrics, typography } = useTheme();

  const iconName = React.useMemo(() => {
    if (chip.icon === 'restaurant') {
      return 'restaurant-outline';
    }
    if (chip.icon === 'bed') {
      return 'bed-outline';
    }
    return 'cafe-outline';
  }, [chip.icon]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.sm,
          paddingVertical: 4,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        label: {
          marginLeft: 4,
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
          fontWeight: '600',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.chip}>
      <Ionicons color={colors.textSecondary} name={iconName} size={metrics.icon.sm - 2} />
      <Text style={styles.label}>{chip.label}</Text>
    </View>
  );
}
