import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../utils/color';

interface LiveLocationBannerProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function LiveLocationBanner({ enabled, onToggle }: LiveLocationBannerProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        banner: {
          marginHorizontal: metrics.sm,
          marginTop: metrics.xs,
          marginBottom: metrics.xs,
          borderRadius: 20,
          backgroundColor: colors.surface,
          paddingHorizontal: metrics.sm,
          paddingVertical: metrics.sm,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: colors.shadow,
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: 8,
          elevation: 3,
        },
        iconWrap: {
          width: 48,
          height: 48,
          borderRadius: 18,
          backgroundColor: withAlpha(colors.primary, 0.1),
          alignItems: 'center',
          justifyContent: 'center',
        },
        label: {
          flex: 1,
          marginLeft: metrics.sm + 4,
          color: colors.textPrimary,
          fontSize: typography.sizes['lg'],
          fontWeight: '500',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.primary} name="locate" size={26} />
      </View>
      <Text style={styles.label}>Live location sharing ON</Text>
      <Switch
        accessibilityLabel="Toggle live location"
        onValueChange={onToggle}
        thumbColor={colors.textInverse}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={enabled}
      />
    </View>
  );
}
