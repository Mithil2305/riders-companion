import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../utils/color';

interface HeaderProps {
  onBack: () => void;
  onStartRide: () => void;
  selectedLocation: string;
  onChangeLocation: (value: string) => void;
}

export function Header({
	onBack,
	onStartRide,
	selectedLocation,
	onChangeLocation,
}: HeaderProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.background,
        },
        left: {
          flex: 1,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '800',
          letterSpacing: -0.5,
        },
        subtitlePill: {
          marginTop: metrics.xs,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: withAlpha(colors.primary, 0.12),
          paddingHorizontal: metrics.sm,
          paddingVertical: 2,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: withAlpha(colors.primary, 0.2),
          minWidth: 170,
        },
        locationInput: {
          flex: 1,
          color: colors.primary,
          fontSize: typography.sizes.xs,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginLeft: 4,
          paddingVertical: 4,
        },
        cta: {
          height: 40,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          paddingHorizontal: metrics.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        },
        ctaLabel: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: '800',
          marginLeft: 6,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Community</Text>
        </View>
        <View style={styles.subtitlePill}>
          <Ionicons color={colors.primary} name="location" size={metrics.icon.sm - 2} />
          <TextInput
            onChangeText={onChangeLocation}
            placeholder="Filter by location"
            placeholderTextColor={withAlpha(colors.primary, 0.6)}
            style={styles.locationInput}
            value={selectedLocation}
          />
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={onStartRide} style={styles.cta}>
        <Ionicons color={colors.textInverse} name="add" size={metrics.icon.sm + 2} />
        <Text style={styles.ctaLabel}>Start Ride</Text>
      </TouchableOpacity>
    </View>
  );
}
