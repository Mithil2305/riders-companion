import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { PostCardCaption, PostCardImage, PostCardStats, PostCardUser } from '../../types/interactions';

type PostCardProps = {
  user: PostCardUser;
  image: PostCardImage;
  caption: PostCardCaption;
  stats: PostCardStats;
  onPressLike?: () => void;
  onPressComment?: () => void;
  onPressShare?: () => void;
  onPressBookmark?: () => void;
};

export function PostCard({
  user,
  image,
  caption,
  stats,
  onPressLike,
  onPressComment,
  onPressShare,
  onPressBookmark,
}: PostCardProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: metrics.radius.xl,
          overflow: 'hidden',
          marginBottom: metrics.md,
          shadowColor: colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.sm,
        },
        userWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          marginRight: metrics.md,
        },
        avatar: {
          width: 42,
          height: 42,
          borderRadius: metrics.radius.full,
          marginRight: metrics.sm,
          backgroundColor: colors.chatComposerBg,
        },
        username: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        location: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '400',
          marginTop: 2,
        },
        time: {
          color: colors.textSecondary,
          fontSize: typography.sizes.lg,
          fontWeight: '500',
        },
        media: {
          width: '100%',
          height: metrics.screenWidth * 0.9,
          borderRadius: metrics.radius.xl,
        },
        mediaWrap: {
          marginHorizontal: metrics.md,
          borderRadius: metrics.radius.xl,
          overflow: 'hidden',
          backgroundColor: colors.chatComposerBg,
        },
        actionsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.sm,
        },
        leftActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        actionButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.xs,
        },
        actionText: {
          color: colors.textSecondary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '500',
        },
        captionRow: {
          paddingHorizontal: metrics.md,
          paddingBottom: metrics.md,
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        captionUser: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '700',
          marginRight: metrics.xs,
        },
        captionText: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '400',
          flexShrink: 1,
          lineHeight: typography.sizes['2xl'] * 1.3,
        },
      }),
    [colors, metrics, typography],
  );

  const likeIconSource = stats.isLiked
    ? require('../../../assets/icons/fist-bump-color.png')
    : require('../../../assets/icons/fist-bump.png');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userWrap}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.location}>{user.location}</Text>
          </View>
        </View>
        <Text style={styles.time}>{user.timeLabel}</Text>
      </View>

      <View style={styles.mediaWrap}>
        <Image source={{ uri: image.uri }} style={styles.media} />
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <Pressable onPress={onPressLike} style={styles.actionButton}>
            <Image source={likeIconSource} style={{ width: 30, height: 30 }} />
            <Text style={styles.actionText}>{stats.likeCount}</Text>
          </Pressable>

          <Pressable onPress={onPressComment} style={styles.actionButton}>
            <Ionicons color={colors.icon} name="chatbubble-outline" size={metrics.icon.md + 2} />
            <Text style={styles.actionText}>{stats.commentCount}</Text>
          </Pressable>

          <Pressable onPress={onPressShare}>
            <Ionicons color={colors.icon} name="arrow-redo-outline" size={metrics.icon.md + 2} />
          </Pressable>
        </View>

        <Pressable onPress={onPressBookmark}>
          <Ionicons
            color={stats.isBookmarked ? colors.primary : colors.icon}
            name={stats.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={metrics.icon.md + 2}
          />
        </Pressable>
      </View>

      <View style={styles.captionRow}>
        <Text style={styles.captionUser}>{caption.username}</Text>
        <Text style={styles.captionText}>{caption.text}</Text>
      </View>
    </View>
  );
}
