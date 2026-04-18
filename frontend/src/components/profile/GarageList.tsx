import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface GarageListBike {
  id: string;
  image: string;
  model: string;
}

interface GarageListProps {
  bikes: GarageListBike[];
}

export function GarageList({ bikes }: GarageListProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        list: {
          gap: metrics.md,
          marginTop: metrics.sm,
        },
        card: {
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        image: {
          width: 76,
          height: 76,
          borderRadius: 12,
          backgroundColor: colors.surface,
        },
        content: {
          flex: 1,
          gap: metrics.xs,
        },
        nickname: {
          color: colors.primary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        model: {
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        action: {
          width: 46,
          height: 46,
          borderRadius: 23,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
        },
        addCard: {
          minHeight: 56,
          borderRadius: 14,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: metrics.sm,
        },
        addText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
      }),
    [colors, metrics, typography],
  );

  const nicknameMap = ['Lightning Bolt', 'Thunder Beast'];

  return (
    <View style={styles.list}>
      {bikes.map((bike, index) => (
        <Pressable
          key={bike.id}
          style={({ pressed }) => [
            styles.card,
            pressed && {
              shadowColor: colors.shadow,
              shadowOpacity: 0.12,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        >
          <Image source={{ uri: bike.image }} style={styles.image} />
          <View style={styles.content}>
            <Text style={styles.nickname}>{`Tag: ${nicknameMap[index] ?? bike.model}`}</Text>
            <Text style={styles.model}>{bike.model}</Text>
          </View>
          <Pressable style={styles.action}>
            <Ionicons color={colors.textInverse} name="rocket-sharp" size={22} />
          </Pressable>
        </Pressable>
      ))}

      <Pressable style={styles.addCard}>
        <Ionicons color={colors.textSecondary} name="file-tray-outline" size={30} />
        <Text style={styles.addText}>Add Vehicle</Text>
      </Pressable>
    </View>
  );
}
