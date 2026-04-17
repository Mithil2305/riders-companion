import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ShareUser } from '../../types/interactions';

type ShareUserItemProps = {
  user: ShareUser;
  onPress: (userId: string) => void;
};

export function ShareUserItem({ user, onPress }: ShareUserItemProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          width: '25%',
          alignItems: 'center',
          marginBottom: metrics.md,
        },
        avatar: {
          width: 68,
          height: 68,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.chatComposerBg,
          marginBottom: metrics.sm,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '600',
          textAlign: 'center',
        },
        username: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '400',
          textAlign: 'center',
          marginTop: 2,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Pressable onPress={() => onPress(user.id)} style={styles.wrapper}>
      <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      <Text numberOfLines={1} style={styles.name}>
        {user.name}
      </Text>
      <Text numberOfLines={1} style={styles.username}>
        {user.username}
      </Text>
    </Pressable>
  );
}
