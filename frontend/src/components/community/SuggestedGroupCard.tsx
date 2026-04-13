import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
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
          width: metrics.screenWidth * 0.78,
          borderRadius: metrics.radius.xl,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          marginRight: metrics.md,
          marginBottom: metrics.sm,
        },
        imageWrap: {
          height: 150,
          position: 'relative',
        },
        image: {
          width: '100%',
          height: '100%',
        },
        badge: {
          position: 'absolute',
          top: metrics.sm,
          left: metrics.sm,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          paddingHorizontal: metrics.sm,
          paddingVertical: metrics.xs,
        },
        badgeLabel: {
          color: colors.textInverse,
          fontSize: typography.sizes.xs - 2,
          fontWeight: '700',
        },
        body: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        footer: {
          marginTop: metrics.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        meta: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        metaLabel: {
          marginLeft: metrics.xs,
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
          fontWeight: '500',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item.id)} style={styles.card}>
      <View style={styles.imageWrap}>
        <Image resizeMode="cover" source={item.image} style={styles.image} />
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{item.badge}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.footer}>
          <View style={styles.meta}>
            <Ionicons color={colors.textSecondary} name="time-outline" size={metrics.icon.sm - 2} />
            <Text style={styles.metaLabel}>{item.duration}</Text>
          </View>
          <View style={styles.meta}>
            <Ionicons color={colors.textSecondary} name="people-outline" size={metrics.icon.sm - 2} />
            <Text style={styles.metaLabel}>{item.riders}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
