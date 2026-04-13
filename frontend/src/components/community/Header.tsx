import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  onBack: () => void;
  onStartRide: () => void;
}

export function Header({ onBack, onStartRide }: HeaderProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm,
          paddingBottom: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        left: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        backTap: {
          width: metrics.icon.lg + metrics.sm,
          height: metrics.icon.lg + metrics.sm,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: metrics.sm,
        },
        titleWrap: {
          justifyContent: 'center',
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        subtitle: {
          marginTop: 1,
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
          fontWeight: '500',
          letterSpacing: 1.4,
        },
        cta: {
          height: metrics.button.sm.height + 4,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          paddingHorizontal: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.14,
          shadowRadius: 8,
          elevation: 4,
        },
        ctaLabel: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
          marginLeft: metrics.xs,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <View style={styles.left}>
        <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backTap}>
          <Ionicons color={colors.textPrimary} name="arrow-back" size={metrics.icon.lg - 2} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>CHENNAI HUB</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={onStartRide} style={styles.cta}>
        <Ionicons color={colors.textInverse} name="add" size={metrics.icon.sm + 2} />
        <Text style={styles.ctaLabel}>Start Ride</Text>
      </TouchableOpacity>
    </View>
  );
}
