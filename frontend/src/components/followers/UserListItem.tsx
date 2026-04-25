import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TrackerUser } from '../../types/profile';
import { useTheme } from '../../hooks/useTheme';

interface UserListItemProps {
  user: TrackerUser;
  index: number;
  onToggleFollow: (userId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UserListItem({ user, index, onToggleFollow, onOpenProfile }: UserListItemProps) {
  const { colors, metrics, typography } = useTheme();
  const scale = useSharedValue(1);
  const progress = useSharedValue(user.isFollowing ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(user.isFollowing ? 1 : 0, { duration: 200 });
  }, [progress, user.isFollowing]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: progress.value > 0.5 ? 0.94 : 1,
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          padding: metrics.md,
          gap: metrics.md,
          minHeight: 76,
        },
        avatar: {
          width: metrics.avatar.md,
          height: metrics.avatar.md,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
        },
        info: {
          flex: 1,
          gap: 2,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        sub: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
        followButton: {
          minHeight: 48,
          minWidth: 104,
          paddingHorizontal: metrics.md,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: user.isFollowing ? colors.border : colors.primary,
          backgroundColor: user.isFollowing ? colors.surface : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        followText: {
          color: user.isFollowing ? colors.textPrimary : colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography, user.isFollowing],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(260)} style={styles.card}>
      <Pressable onPress={() => onOpenProfile?.(user.id)}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
      </Pressable>
      <Pressable onPress={() => onOpenProfile?.(user.id)} style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.sub}>{user.isFollowing ? 'Following' : 'Rider nearby'}</Text>
      </Pressable>
      <AnimatedPressable
        onPress={() => onToggleFollow(user.id)}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 12, stiffness: 220 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 220 });
        }}
        style={[styles.followButton, buttonStyle]}
      >
        <Text style={styles.followText}>{user.isFollowing ? 'Following' : 'Follow'}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}
