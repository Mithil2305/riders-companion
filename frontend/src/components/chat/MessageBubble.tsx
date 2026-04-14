import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInLeft,
  FadeInRight,
  ZoomIn,
} from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";
import { PersonalChatMessage } from "../../types/chat";

interface MessageBubbleProps {
  message: PersonalChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { colors, metrics, typography } = useTheme();
  const isOutgoing = message.sender === "me";

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          marginBottom: metrics.sm,
        },
        rowOutgoing: {
          alignItems: "flex-end",
          justifyContent: "flex-end",
        },
        rowIncoming: {
          alignItems: "flex-start",
          justifyContent: "flex-start",
        },
        bubbleWrap: {
          maxWidth: "84%",
          position: "relative",
        },
        bubble: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
        },
        bubbleIncoming: {
          borderRadius: 22,
          backgroundColor: colors.chatIncomingBubbleBg,
          shadowColor: colors.shadow,
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        },
        bubbleOutgoing: {
          backgroundColor: colors.chatOutgoingBubbleBg,
          borderRadius: message.kind === "image" ? 0 : 22,
          borderBottomLeftRadius: 22,
          borderBottomRightRadius: 22,
        },
        textIncoming: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: "400",
          lineHeight: 24,
        },
        textOutgoing: {
          color: colors.textInverse,
          fontSize: typography.sizes.base,
          fontWeight: "400",
          lineHeight: 24,
        },
        image: {
          width: "100%",
          aspectRatio: 1.75,
        },
        imageWrap: {
          overflow: "hidden",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
        },
        metaRow: {
          marginTop: metrics.xs,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: metrics.xs,
        },
        metaIncoming: {
          justifyContent: "flex-start",
        },
        timeText: {
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
          fontWeight: "500",
        },
        reaction: {
          position: "absolute",
          right: -11,
          bottom: -9,
          fontSize: typography.sizes.lg,
        },
      }),
    [colors, metrics, typography],
  );

  const tickIcon =
    message.delivery === "read"
      ? "checkmark-done"
      : message.delivery === "delivered"
        ? "checkmark-done-outline"
        : "checkmark";

  const hasText =
    message.kind === "text" ||
    (typeof message.text === "string" && message.text.trim().length > 0);

  return (
    <Animated.View
      entering={
        isOutgoing ? FadeInRight.duration(260) : FadeInLeft.duration(260)
      }
      style={[styles.row, isOutgoing ? styles.rowOutgoing : styles.rowIncoming]}
    >
      <View style={styles.bubbleWrap}>
        {message.kind === "image" ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: message.imageUrl }} style={styles.image} />
          </View>
        ) : null}
        {hasText ? (
          <View
            style={[
              styles.bubble,
              isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
            ]}
          >
            <Text
              style={isOutgoing ? styles.textOutgoing : styles.textIncoming}
            >
              {message.text}
            </Text>
          </View>
        ) : null}

        <View style={[styles.metaRow, isOutgoing ? null : styles.metaIncoming]}>
          <Text style={styles.timeText}>{message.timeLabel}</Text>
          {isOutgoing ? (
            <Ionicons
              color={colors.chatMetaRed}
              name={tickIcon}
              size={metrics.icon.sm - 2}
            />
          ) : null}
        </View>

        {message.reaction ? (
          <Animated.Text
            entering={ZoomIn.springify().damping(11)}
            style={styles.reaction}
          >
            {message.reaction}
          </Animated.Text>
        ) : null}
      </View>
    </Animated.View>
  );
}
