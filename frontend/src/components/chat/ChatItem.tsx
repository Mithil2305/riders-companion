import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { ChatPreview } from "../../types/chat";
import { StatusBadge } from "./StatusBadge";

interface ChatItemProps {
  item: ChatPreview;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ChatItem({ item, onPress, onLongPress }: ChatItemProps) {
  const { colors, metrics, typography, resolvedMode } = useTheme();
  const isEnded = item.status === "ended";
  const isGroup = item.roomType === "group";

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginHorizontal: metrics.md,
          marginBottom: metrics.md,
          minHeight: 110,
          borderRadius: 22,
          backgroundColor: colors.chatCardBackground,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
          flexDirection: "row",
          alignItems: "center",
          opacity: isEnded ? 0.55 : 1,
          shadowColor: colors.shadow,
          shadowOpacity: resolvedMode === "dark" ? 0.18 : 0.06,
          shadowRadius: 14,
          shadowOffset: {
            width: 0,
            height: 6,
          },
          elevation: 3,
        },
        avatarWrap: {
          width: 62,
          height: 62,
          borderRadius: 22,
          marginRight: metrics.md,
          position: "relative",
          backgroundColor: colors.chatSearchBg,
        },
        dot: {
          position: "absolute",
          right: -2,
          bottom: -2,
          zIndex: 10,
          width: 18,
          height: 18,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.chatOnline,
          borderWidth: 2,
          borderColor: colors.chatCardBackground,
        },
        center: {
          flex: 1,
          gap: metrics.xs,
          position: "relative",
        },
        topRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: metrics.sm,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes["lg"],
          fontWeight: "700",
          flexShrink: 1,
          marginRight: metrics.xs,
        },
        message: {
          color: colors.textSecondary,
          fontSize: typography.sizes["base"],
          fontWeight: "400",
        },
        senderInline: {
          color: colors.chatMetaRed,
          fontSize: typography.sizes["base"],
          fontWeight: "500",
        },
        messageInlineWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: metrics.xs,
          marginTop: 2,
        },
        endedMessageWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: metrics.xs,
          marginTop: metrics.xs,
        },
        endedMessage: {
          color: colors.textTertiary,
          fontSize: typography.sizes["base"],
          fontStyle: "italic",
          fontWeight: "400",
        },
        right: {
          alignItems: "flex-end",
          justifyContent: "space-between",
          alignSelf: "stretch",
          minWidth: 82,
          paddingVertical: metrics.xs,
          gap: metrics.md,
        },
        time: {
          color: isGroup ? colors.textTertiary : colors.chatMetaRed,
          fontSize: typography.sizes.xs,
          fontWeight: "500",
          textTransform: "uppercase",
          lineHeight: typography.sizes.xl,
          textAlign: "right",
        },
        unreadBadge: {
          minWidth: 26,
          height: 26,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: metrics.sm,
        },
        unreadText: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: "700",
        },
        hiddenMeta: {
          width: 1,
          height: 1,
        },
        badgeDiv: {
          position: "absolute",
          top: -20,
          left: 0,
          zIndex: 10,
        },
      }),
    [colors, isEnded, isGroup, metrics, resolvedMode, typography],
  );

  const avatarStyle = React.useMemo<ImageStyle>(
    () => ({
      width: 62,
      height: 62,
      borderRadius: 22,
    }),
    [],
  );

  return (
    <Pressable
      android_ripple={{ color: colors.overlayLight }}
      delayLongPress={240}
      onLongPress={onLongPress}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.avatarWrap}>
        <Image source={{ uri: item.avatar }} style={avatarStyle} />
        {item.isOnline ? <View style={styles.dot} /> : null}
      </View>

      <View style={styles.center}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.name}>
            {item.name}
          </Text>
          <View style={styles.badgeDiv}>
            {item.status ? <StatusBadge status={item.status} /> : null}
          </View>
        </View>

        {item.senderName ? (
          <View style={styles.messageInlineWrap}>
            <Text numberOfLines={1} style={styles.senderInline}>
              {item.senderName}:
            </Text>
            <Text numberOfLines={1} style={styles.message}>
              {item.message}
            </Text>
          </View>
        ) : isEnded ? (
          <View style={styles.endedMessageWrap}>
            <Ionicons
              color={colors.textTertiary}
              name="checkmark-done-outline"
              size={metrics.icon.md}
            />
            <Text numberOfLines={1} style={styles.endedMessage}>
              {item.message}
            </Text>
          </View>
        ) : (
          <Text numberOfLines={1} style={styles.message}>
            {item.message}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        <Text style={styles.time}>{item.time}</Text>
        {item.unreadCount ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        ) : (
          <View style={styles.hiddenMeta} />
        )}
      </View>
    </Pressable>
  );
}
