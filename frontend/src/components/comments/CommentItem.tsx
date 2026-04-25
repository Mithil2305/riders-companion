import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { CommentModel } from '../../types/interactions';

type CommentItemProps = {
  comment: CommentModel;
  isOwner: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
  onLike: (commentId: string) => void;
  onReply: (comment: CommentModel) => void;
  onLongPress: (comment: CommentModel) => void;
  expandedReplies?: boolean;
  onToggleReplies?: (commentId: string) => void;
};

export function CommentItem({
  comment,
  isOwner,
  isSelected = false,
  isDimmed = false,
  onLike,
  onReply,
  onLongPress,
  expandedReplies = false,
  onToggleReplies,
}: CommentItemProps) {
  const { colors, metrics, typography } = useTheme();
  const replies = comment.replies || [];
  const replyCount = comment.replyCount || replies.length;
  const hasMoreReplies = replyCount > 1 && !expandedReplies;
  const visibleReplies = expandedReplies ? replies : replies.slice(0, 1);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
          flexDirection: 'row',
        },
        selected: {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 14,
          elevation: 10,
          borderRadius: metrics.radius.md,
        },
        dimmed: {
          opacity: 0.35,
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
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
          marginRight: metrics.sm,
        },
        time: {
          color: colors.textSecondary,
          fontSize: typography.sizes['xs'],
          fontWeight: '500',
        },
        body: {
          color: colors.textPrimary,
          fontSize: typography.sizes['base'],
          lineHeight: typography.sizes['base'] * 1.3,
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
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        reply: {
          color: colors.primary,
          fontSize: typography.sizes['sm'],
          fontWeight: '700',
        },
        repliesContainer: {
          marginTop: metrics.sm,
          marginLeft: metrics.md + 44,
          paddingLeft: metrics.md,
          borderLeftWidth: 2,
          borderLeftColor: colors.border,
        },
        replyItem: {
          flexDirection: 'row',
          marginBottom: metrics.sm,
          paddingVertical: metrics.xs,
        },
        replyAvatar: {
          width: 32,
          height: 32,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.chatComposerBg,
          marginRight: metrics.xs,
        },
        replyContent: {
          flex: 1,
        },
        replyUsername: {
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        replyBody: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          lineHeight: typography.sizes.sm * 1.3,
        },
        viewAllReplies: {
          color: colors.primary,
          fontSize: typography.sizes.sm,
          fontWeight: '600',
          marginTop: metrics.xs,
          paddingVertical: metrics.xs,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <>
      <Pressable
        delayLongPress={350}
        disabled={!isOwner || isDimmed}
        onLongPress={() => onLongPress(comment)}
        style={[styles.container, isSelected && styles.selected, isDimmed && styles.dimmed]}
      >
        <Image source={{ uri: comment?.author?.avatarUrl || "https://i.pravatar.cc/150?img=11" }} style={styles.avatar} />
        <View style={styles.contentWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.username}>{comment?.author?.username || 'Unknown User'}</Text>
            <Text style={styles.time}>{comment?.timeLabel || 'Just now'}</Text>
          </View>
          <Text style={styles.body}>{comment?.content || 'No content available.'}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => onLike(comment?.id)} style={styles.likeWrap}>
              <Ionicons
                color={comment?.likedByMe ? colors.primary : colors.icon}
                name={comment?.likedByMe ? 'flash' : 'flash-outline'}
                size={metrics.icon.md}
              />
              <Text style={styles.likeCount}>{comment?.likeCount || 0}</Text>
            </Pressable>

            <Pressable onPress={() => onReply(comment)}>
              <Text style={styles.reply}>Reply</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>

      {visibleReplies.length > 0 && (
        <View style={styles.repliesContainer}>
          {visibleReplies.map((reply) => (
            <View key={reply.id} style={styles.replyItem}>
              <Image
                source={{ uri: reply?.author?.avatarUrl || 'https://i.pravatar.cc/150?img=11' }}
                style={styles.replyAvatar}
              />
              <View style={styles.replyContent}>
                <Text style={styles.replyUsername}>
                  {reply?.author?.username || 'Unknown User'}
                </Text>
                <Text style={styles.replyBody}>{reply?.content || ''}</Text>
              </View>
            </View>
          ))}
          {hasMoreReplies && onToggleReplies && (
            <Pressable onPress={() => onToggleReplies?.(comment.id)}>
              <Text style={styles.viewAllReplies}>
                View all {replyCount} replies
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}
