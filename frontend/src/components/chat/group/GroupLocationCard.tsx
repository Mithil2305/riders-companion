import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../utils/color';

interface GroupLocationCardProps {
  label: string;
}

export function GroupLocationCard({ label }: GroupLocationCardProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        mapCard: {
          marginTop: metrics.sm,
          borderRadius: 20,
          overflow: 'hidden',
          height: 210,
          backgroundColor: withAlpha(colors.success, 0.2),
          shadowColor: colors.shadow,
          shadowOpacity: 0.13,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 5,
        },
        mapFill: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: withAlpha(colors.success, 0.24),
        },
        mapBlob: {
          position: 'absolute',
          width: '70%',
          height: '80%',
          borderRadius: 120,
          backgroundColor: withAlpha(colors.success, 0.32),
          left: '16%',
          top: '12%',
          transform: [{ rotate: '-16deg' }],
        },
        labelChip: {
          position: 'absolute',
          left: metrics.sm,
          bottom: metrics.sm,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.xs + 3,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.xs,
        },
        labelText: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '500',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.mapCard}>
      <View style={styles.mapFill} />
      <View style={styles.mapBlob} />
      <View style={styles.labelChip}>
        <Ionicons color={colors.primary} name="location" size={16} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
}
