import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ProfileIdentityProps {
  coverImage: string;
  avatar: string;
  name: string;
  username: string;
  bio: string;
}

export function ProfileIdentity({ coverImage, avatar, name, username, bio }: ProfileIdentityProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        coverImage: {
          width: '100%',
          height: 180,
        },
        avatar: {
          width: 102,
          height: 102,
          borderRadius: 51,
          borderWidth: 4,
          borderColor: colors.textInverse,
          alignSelf: 'center',
          marginTop: -51,
          backgroundColor: colors.surface,
        },
        identityBlock: {
          alignItems: 'center',
          marginTop: metrics.sm,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
          textAlign: 'center',
        },
        username: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          textAlign: 'center',
        },
        bio: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
          lineHeight: typography.sizes.base * 1.45,
          maxWidth: '88%',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <>
      <Image source={{ uri: coverImage }} style={styles.coverImage} />
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.identityBlock}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.bio}>{bio}</Text>
      </View>
    </>
  );
}
