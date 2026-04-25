import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ExploreHeaderProps {
  isLoading?: boolean;
}

export function ExploreHeader({ isLoading = false }: ExploreHeaderProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: metrics.md,
          paddingBottom: metrics.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        left: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Ionicons color={colors.primary} name="search-outline" size={metrics.icon.md} />
        <Text style={styles.title}>Search</Text>
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} size="small" /> : <View style={{ width: metrics.icon.md, height: metrics.icon.md }} />}
    </View>
  );
}
