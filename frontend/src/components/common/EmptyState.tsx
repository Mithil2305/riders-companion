import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function EmptyState({
  title,
  subtitle,
  icon = 'sparkles-outline',
}: EmptyStateProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: metrics['2xl'],
          paddingHorizontal: metrics.lg,
          gap: metrics.sm,
        },
        iconWrap: {
          width: metrics.avatar.lg,
          height: metrics.avatar.lg,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
          textAlign: 'center',
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
          lineHeight: typography.sizes.sm * typography.lineHeights.normal,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.primary} name={icon} size={metrics.icon.lg} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
