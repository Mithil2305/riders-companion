import React from 'react';
import { Image, StyleSheet, Text, View, type ImageStyle } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { ChatMessage } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { colors, metrics, typography } = useTheme();
  const isOutgoing = message.sender === 'me';

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginBottom: metrics.sm,
        },
        rowOutgoing: {
          justifyContent: 'flex-end',
        },
        rowIncoming: {
          justifyContent: 'flex-start',
        },
        bubbleWrap: {
          maxWidth: '75%',
          position: 'relative',
        },
        bubble: {
          borderRadius: 20,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm + 2,
        },
        bubbleIncoming: {
          backgroundColor: colors.chatIncomingBubbleBg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        bubbleOutgoing: {
          backgroundColor: colors.primary,
        },
        textIncoming: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '500',
        },
        textOutgoing: {
          color: colors.textInverse,
          fontSize: typography.sizes.base,
          fontWeight: '500',
        },
        reaction: {
          position: 'absolute',
          right: -11,
          bottom: -9,
          fontSize: typography.sizes.lg,
        },
      }),
    [colors, metrics, typography],
  );

  const avatarStyle = React.useMemo<ImageStyle>(
    () => ({
      width: 48,
      height: 48,
      borderRadius: metrics.radius.full,
      marginRight: metrics.sm,
      marginBottom: metrics.sm,
    }),
    [metrics],
  );

  return (
    <Animated.View
      entering={isOutgoing ? FadeInRight.duration(260) : FadeInLeft.duration(260)}
      style={[styles.row, isOutgoing ? styles.rowOutgoing : styles.rowIncoming]}
    >
      {!isOutgoing && message.avatar ? <Image source={{ uri: message.avatar }} style={avatarStyle} /> : null}

      <View style={styles.bubbleWrap}>
        <View style={[styles.bubble, isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming]}>
          <Text style={isOutgoing ? styles.textOutgoing : styles.textIncoming}>{message.text}</Text>
        </View>

        {message.reaction ? (
          <Animated.Text entering={ZoomIn.springify().damping(11)} style={styles.reaction}>
            {message.reaction}
          </Animated.Text>
        ) : null}
      </View>
    </Animated.View>
  );
}