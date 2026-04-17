import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { CommentModel } from '../../types/interactions';

type CommentItemProps = {
  comment: CommentModel;
  onLike: (commentId: string) => void;
  onReply: (commentId: string) => void;
};

export function CommentItem({ comment, onLike, onReply }: CommentItemProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
          flexDirection: 'row',
        },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.chatComposerBg,
          marginRight: metrics.sm,
        },
        contentWrap: {
          flex: 1,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: metrics.xs,
          flexWrap: 'wrap',
        },
        username: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '700',
          marginRight: metrics.sm,
        },
        time: {
          color: colors.textSecondary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '500',
        },
        body: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          lineHeight: typography.sizes['2xl'] * 1.3,
          marginBottom: metrics.sm,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        likeWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.xs,
        },
        likeCount: {
          color: colors.textSecondary,
          fontSize: typography.sizes.xl,
          fontWeight: '500',
        },
        reply: {
          color: colors.primary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.container}>
      <Image source={{ uri: comment.author.avatarUrl }} style={styles.avatar} />
      <View style={styles.contentWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.username}>{comment.author.username}</Text>
          <Text style={styles.time}>{comment.timeLabel}</Text>
        </View>
        <Text style={styles.body}>{comment.content}</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => onLike(comment.id)} style={styles.likeWrap}>
            <Ionicons
              color={comment.likedByMe ? colors.primary : colors.icon}
              name={comment.likedByMe ? 'flash' : 'flash-outline'}
              size={metrics.icon.md}
            />
            <Text style={styles.likeCount}>{comment.likeCount}</Text>
          </Pressable>

          <Pressable onPress={() => onReply(comment.id)}>
            <Text style={styles.reply}>Reply</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
