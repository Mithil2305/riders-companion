import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../utils/color';

export function LiveMapSection() {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginHorizontal: metrics.md,
          height: Math.min(metrics.screenHeight * 0.43, 390),
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          overflow: 'hidden',
          backgroundColor: withAlpha(colors.success, 0.18),
          borderWidth: 1,
          borderColor: withAlpha(colors.success, 0.28),
          shadowColor: colors.shadow,
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 5,
          marginBottom: metrics.md,
        },
        mapTexture: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: withAlpha(colors.success, 0.24),
        },
        routeLine: {
          position: 'absolute',
          left: '18%',
          top: '16%',
          width: '56%',
          height: 4,
          backgroundColor: withAlpha(colors.primary, 0.8),
          transform: [{ rotate: '23deg' }],
          borderRadius: 999,
        },
        routeLineTwo: {
          position: 'absolute',
          left: '42%',
          top: '46%',
          width: '32%',
          height: 4,
          backgroundColor: withAlpha(colors.primary, 0.8),
          transform: [{ rotate: '-34deg' }],
          borderRadius: 999,
        },
        marker: {
          position: 'absolute',
          width: 38,
          height: 38,
          borderRadius: 19,
          borderWidth: 2,
          borderColor: colors.textInverse,
          overflow: 'hidden',
          backgroundColor: colors.surface,
        },
        markerOne: {
          left: '18%',
          top: '20%',
        },
        markerTwo: {
          left: '58%',
          top: '30%',
        },
        markerThree: {
          left: '34%',
          top: '62%',
        },
        chip: {
          position: 'absolute',
          left: metrics.md,
          bottom: metrics.md,
          borderRadius: metrics.radius.full,
          paddingVertical: metrics.xs + 2,
          paddingHorizontal: metrics.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.xs,
          shadowColor: colors.shadow,
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: 8,
          elevation: 4,
        },
        chipText: {
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '600',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.mapTexture} />
      <View style={styles.routeLine} />
      <View style={styles.routeLineTwo} />

      <View style={[styles.marker, styles.markerOne]}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/women/65.jpg' }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <View style={[styles.marker, styles.markerTwo]}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/men/39.jpg' }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <View style={[styles.marker, styles.markerThree]}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/men/13.jpg' }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <View style={styles.chip}>
        <Ionicons color={colors.primary} name="navigate-circle" size={18} />
        <Text style={styles.chipText}>Group Live Tracking</Text>
      </View>
    </View>
  );
}
