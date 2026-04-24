import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { PersonalChatMenuAction } from "../../types/chat";

type MenuItem = {
  id: PersonalChatMenuAction;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "danger";
};

interface PersonalChatMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (action: PersonalChatMenuAction) => void;
  isMuted?: boolean;
  isBlocked?: boolean;
}

export function PersonalChatMenuSheet({
  visible,
  onClose,
  onSelectAction,
  isMuted = false,
  isBlocked = false,
}: PersonalChatMenuSheetProps) {
  const { colors, metrics, typography } = useTheme();

  const items: MenuItem[] = React.useMemo(
    () => [
      { id: "voice-call", label: "Voice Call", icon: "call-outline" },
      { id: "video-call", label: "Video Call", icon: "videocam-outline" },
      { id: "clear-chat", label: "Clear Chat", icon: "trash-outline" },
      {
        id: "mute-notifications",
        label: isMuted ? "Unmute Notifications" : "Mute Notifications",
        icon: isMuted ? "notifications-outline" : "notifications-off-outline",
      },
      {
        id: "block-user",
        label: isBlocked ? "User Blocked" : "Block User",
        icon: "ban-outline",
        tone: "danger",
      },
    ],
    [isBlocked, isMuted],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: "flex-end",
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.overlay,
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.xl,
        },
        handle: {
          alignSelf: "center",
          width: 44,
          height: 4,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.border,
          marginBottom: metrics.md,
        },
        item: {
          minHeight: 52,
          borderRadius: metrics.radius.lg,
          paddingHorizontal: metrics.md,
          flexDirection: "row",
          alignItems: "center",
          gap: metrics.sm,
        },
        label: {
          fontSize: typography.sizes.base,
          fontWeight: "500",
          color: colors.textPrimary,
        },
        dangerLabel: {
          color: colors.chatDanger,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {items.map((item) => (
            <Pressable
              android_ripple={{ color: colors.overlayLight }}
              key={item.id}
              onPress={() => onSelectAction(item.id)}
              style={styles.item}
            >
              <Ionicons
                color={item.tone === "danger" ? colors.chatDanger : colors.icon}
                name={item.icon}
                size={metrics.icon.md}
              />
              <Text style={[styles.label, item.tone === "danger" ? styles.dangerLabel : null]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
