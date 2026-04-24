import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { SuggestedUser } from '../../types/explore';

interface UserCardProps {
  item: SuggestedUser;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UserCard({ item, index }: UserCardProps) {
  const { colors, metrics, typography } = useTheme();
  const followScale = useSharedValue(1);

  const followStyle = useAnimatedStyle(() => ({
    transform: [{ scale: followScale.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: metrics.screenWidth * 0.4,
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: metrics.md,
          alignItems: 'center',
          gap: metrics.sm,
        },
        avatar: {
          width: metrics.avatar.lg,
          height: metrics.avatar.lg,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        follow: {
          minHeight: metrics.button.sm.height,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'stretch',
          paddingHorizontal: metrics.md,
        },
        followText: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Animated.View entering={FadeInRight.delay(index * 70).duration(320)}>
      <View style={styles.card}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <Text numberOfLines={1} style={styles.name}>
          {item.name}
        </Text>

        <AnimatedPressable
          onPressIn={() => {
            followScale.value = withSpring(0.95, { damping: 14, stiffness: 260 });
          }}
          onPressOut={() => {
            followScale.value = withSpring(1, { damping: 14, stiffness: 260 });
          }}
          style={[styles.follow, followStyle]}
        >
          <Text style={styles.followText}>Follow</Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}
