import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInLeft,
  FadeInRight,
  ZoomIn,
} from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";
import { PersonalChatMessage } from "../../types/chat";
import { toRideInvitePreview } from "../../utils/rideInviteMessage";
import {
  parseSharedContentMessage,
  toSharedContentPreview,
} from "../../utils/sharedContentMessage";
import { useRouter } from "expo-router";

interface MessageBubbleProps {
  message: PersonalChatMessage;
  onInviteAction?: (messageId: string, action: "join" | "reject") => void;
}

export function MessageBubble({ message, onInviteAction }: MessageBubbleProps) {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();
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
          borderRadius: message.kind === "image" ? 0 : message.kind === "invite" ? 18 : 22,
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
        inviteWrap: {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isOutgoing ? colors.overlayLight : colors.border,
          backgroundColor: isOutgoing ? colors.chatOutgoingBubbleBg : colors.surface,
          padding: metrics.md,
          gap: metrics.xs,
        },
        inviteBadge: {
          alignSelf: "flex-start",
          borderRadius: metrics.radius.full,
          paddingHorizontal: metrics.sm,
          paddingVertical: 4,
          backgroundColor: isOutgoing ? colors.overlay : colors.chatDateBadgeBg,
        },
        inviteBadgeText: {
          color: isOutgoing ? colors.textInverse : colors.chatDateBadgeText,
          fontSize: typography.sizes.xs,
          fontWeight: "700",
          letterSpacing: 0.4,
        },
        inviteTitle: {
          color: isOutgoing ? colors.textInverse : colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: "700",
        },
        inviteSubtitle: {
          color: isOutgoing ? colors.textInverse : colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: "500",
        },
        inviteActionRow: {
          marginTop: metrics.xs,
          flexDirection: "row",
          gap: metrics.xs,
        },
        inviteActionBtn: {
          flex: 1,
          minHeight: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: metrics.sm,
        },
        inviteJoinBtn: {
          backgroundColor: colors.success,
        },
        inviteRejectBtn: {
          backgroundColor: colors.warning,
        },
        inviteActionText: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: "700",
        },
        sharedWrap: {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isOutgoing ? colors.overlayLight : colors.border,
          backgroundColor: isOutgoing ? colors.chatOutgoingBubbleBg : colors.surface,
          overflow: "hidden",
          width: 220,
        },
        sharedThumb: {
          width: "100%",
          height: 120,
          backgroundColor: colors.surface,
        },
        sharedMeta: {
          padding: metrics.sm,
          gap: 2,
        },
        sharedBadge: {
          alignSelf: "flex-start",
          borderRadius: metrics.radius.full,
          paddingHorizontal: metrics.sm,
          paddingVertical: 2,
          backgroundColor: isOutgoing ? colors.overlay : colors.chatDateBadgeBg,
        },
        sharedBadgeText: {
          color: isOutgoing ? colors.textInverse : colors.chatDateBadgeText,
          fontSize: typography.sizes.xs,
          fontWeight: "700",
          letterSpacing: 0.4,
        },
        sharedTitle: {
          color: isOutgoing ? colors.textInverse : colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: "700",
        },
        sharedCaption: {
          color: isOutgoing ? colors.textInverse : colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: "500",
        },
      }),
    [colors, message.kind, metrics, typography],
  );

  const tickIcon =
    message.delivery === "read"
      ? "checkmark-done"
      : message.delivery === "delivered"
        ? "checkmark-done-outline"
        : "checkmark";

  const hasText =
    message.kind === "text" ||
    (message.kind === "image" &&
      typeof message.text === "string" &&
      message.text.trim().length > 0);

  const inviteLabel =
    message.kind === "invite"
      ? toRideInvitePreview(message.invite, isOutgoing ? "sender" : "receiver")
      : null;

  const sharedPayload =
    message.kind === "shared-content" ? message.shared : null;

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
        {message.kind === "invite" ? (
          <View
            style={[
              styles.bubble,
              isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
            ]}
          >
            <View style={styles.inviteWrap}>
              <View style={styles.inviteBadge}>
                <Text style={styles.inviteBadgeText}>RIDE INVITE</Text>
              </View>
              <Text numberOfLines={1} style={styles.inviteTitle}>
                {message.invite.roomName}
              </Text>
              <Text style={styles.inviteSubtitle}>{inviteLabel}</Text>
              {message.sender === "other" && message.invite.status === "pending" ? (
                <View style={styles.inviteActionRow}>
                  <Pressable
                    onPress={() => onInviteAction?.(message.id, "join")}
                    style={[styles.inviteActionBtn, styles.inviteJoinBtn]}
                  >
                    <Text style={styles.inviteActionText}>Join</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onInviteAction?.(message.id, "reject")}
                    style={[styles.inviteActionBtn, styles.inviteRejectBtn]}
                  >
                    <Text style={styles.inviteActionText}>Reject</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        ) : sharedPayload ? (
          <Pressable
            onPress={() => {
              if (sharedPayload.resourceType === "clip") {
                router.push({
                  pathname: "/(tabs)/clips",
                  params: { clipId: sharedPayload.resourceId },
                });
              } else {
                router.push(`/post/${sharedPayload.resourceId}`);
              }
            }}
            style={[
              styles.bubble,
              isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
            ]}
          >
            <View style={styles.sharedWrap}>
              {sharedPayload.thumbnailUrl ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: sharedPayload.thumbnailUrl }}
                  style={styles.sharedThumb}
                />
              ) : null}
              <View style={styles.sharedMeta}>
                <View style={styles.sharedBadge}>
                  <Text style={styles.sharedBadgeText}>
                    {sharedPayload.resourceType === "clip" ? "CLIP" : "POST"}
                  </Text>
                </View>
                {sharedPayload.title ? (
                  <Text numberOfLines={1} style={styles.sharedTitle}>
                    {sharedPayload.title}
                  </Text>
                ) : null}
                {sharedPayload.caption ? (
                  <Text numberOfLines={2} style={styles.sharedCaption}>
                    {sharedPayload.caption}
                  </Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        ) : hasText ? (
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
