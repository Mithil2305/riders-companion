import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface StatusSectionProps {
  title: string;
  children: React.ReactNode;
}

export function StatusSection({ title, children }: StatusSectionProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.sm,
          gap: metrics.sm,
        },
        title: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '600',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}
