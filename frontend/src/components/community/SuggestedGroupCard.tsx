import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../utils/color';
import type { SuggestedGroup } from '../../types/community';

interface SuggestedGroupCardProps {
  item: SuggestedGroup;
  onPress: (id: string) => void;
}

export function SuggestedGroupCard({ item, onPress }: SuggestedGroupCardProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: metrics.screenWidth * 0.75,
          height: 180,
          borderRadius: 24,
          overflow: 'hidden',
          marginRight: metrics.md,
          marginBottom: metrics.sm,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        },
        imageBg: {
          width: '100%',
          height: '100%',
        },
        gradient: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'space-between',
          padding: metrics.md,
        },
        badgeRow: {
          flexDirection: 'row',
        },
        badge: {
          backgroundColor: withAlpha(colors.white, 0.24),
          paddingHorizontal: metrics.sm,
          paddingVertical: 4,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: withAlpha(colors.white, 0.3),
        },
        badgeLabel: {
          color: colors.textInverse,
          fontSize: typography.sizes.xs - 1,
          fontWeight: '800',
          letterSpacing: 0.5,
        },
        body: {
          gap: 4,
        },
        title: {
          color: colors.textInverse,
          fontSize: typography.sizes.xl,
          fontWeight: '800',
          textShadowColor: withAlpha(colors.black, 0.3),
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        },
        footer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        meta: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        metaLabel: {
          marginLeft: 4,
          color: withAlpha(colors.white, 0.82),
          fontSize: typography.sizes.xs,
          fontWeight: '600',
        },
      }),
    [colors, metrics, typography],
  );

  const activeText = item.duration.replace('Days', 'days ago').replace('Day', 'day ago');

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item.id)} style={styles.card}>
      <ImageBackground resizeMode="cover" source={item.image} style={styles.imageBg}>
        <LinearGradient
          colors={[withAlpha(colors.black, 0), withAlpha(colors.black, 0.85)]}
          locations={[0.2, 1]}
          style={styles.gradient}
        >
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{item.badge}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <View style={styles.footer}>
              <View style={styles.meta}>
                <Text style={styles.metaLabel}>Active {activeText}</Text>
              </View>
              <View style={styles.meta}>
                <Ionicons color={withAlpha(colors.white, 0.82)} name="people" size={14} />
                <Text style={styles.metaLabel}>{item.riders}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}
