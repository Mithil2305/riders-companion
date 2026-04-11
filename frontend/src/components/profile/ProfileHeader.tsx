import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProfileUser } from '../../types/profile';
import { useTheme } from '../../hooks/useTheme';

interface ProfileHeaderProps {
  user: ProfileUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          gap: metrics.sm,
        },
        avatar: {
          width: metrics.avatar.xl + metrics.sm,
          height: metrics.avatar.xl + metrics.sm,
          borderRadius: metrics.radius.full,
          borderWidth: 3,
          borderColor: colors.surface,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes['3xl'],
          fontWeight: '700',
          textAlign: 'center',
        },
        username: {
          color: colors.textSecondary,
          fontSize: typography.sizes.xl,
          textAlign: 'center',
        },
        bio: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          textAlign: 'center',
          lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
          paddingHorizontal: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.container}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
    </Animated.View>
  );
}
