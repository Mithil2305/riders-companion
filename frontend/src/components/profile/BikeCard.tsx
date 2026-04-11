import React from 'react';
import { Image, ImageStyle, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

export interface Bike {
  id: string;
  brand: string;
  model: string;
  year: string;
  image: string;
}

interface BikeCardProps {
  bike: Bike;
}

export function BikeCard({ bike }: BikeCardProps) {
  const { colors, metrics, typography } = useTheme();
  const bikeImageStyle: ImageStyle = React.useMemo(
    () => ({
      width: 58,
      height: 58,
      borderRadius: metrics.radius.lg,
      backgroundColor: colors.surface,
    }),
    [colors, metrics],
  );
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: metrics.radius.xl,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.borderDark,
          padding: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        content: {
          flex: 1,
          gap: 2,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
        year: {
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
        },
      }),
    [colors, metrics, typography],
  );

  const imageSource =
    bike.image.length > 0
      ? { uri: bike.image }
      : require('../../../assets/icons/fist-bump-white.png');

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
      <Image source={imageSource} style={bikeImageStyle} />
      <View style={styles.content}>
        <Text style={styles.title}>{bike.brand}</Text>
        <Text style={styles.subtitle}>{bike.model}</Text>
        <Text style={styles.year}>Year {bike.year}</Text>
      </View>
    </Animated.View>
  );
}
