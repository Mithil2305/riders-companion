import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { SuggestedRoom } from '../../types/explore';

interface RoomCardProps {
  item: SuggestedRoom;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RoomCard({ item, index }: RoomCardProps) {
  const { colors, metrics, typography } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: metrics.md,
          gap: metrics.sm,
        },
        roomName: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        members: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
        actionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        joinButton: {
          minHeight: metrics.button.sm.height,
          paddingHorizontal: metrics.md,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        joinText: {
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(330)} style={styles.card}>
      <Text style={styles.roomName}>{item.name}</Text>
      <View style={styles.actionRow}>
        <Text style={styles.members}>{item.members} riders online</Text>
        <AnimatedPressable
          onPressIn={() => {
            scale.value = withSpring(0.95, { damping: 12, stiffness: 220 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 12, stiffness: 220 });
          }}
          style={[styles.joinButton, animatedStyle]}
        >
          <Text style={styles.joinText}>Join</Text>
        </AnimatedPressable>
      </View>
      <Ionicons color={colors.primary} name="people-outline" size={metrics.icon.md} />
    </Animated.View>
  );
}