import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

export function GroupChatClosedState() {
  const { colors, metrics, typography } = useTheme();

  const [isViewChatEnabled, setIsViewChatEnabled] = useState(false);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: metrics.md,
          paddingTop: metrics.lg,
          paddingBottom: metrics.lg,
          alignItems: "center",
        },
        iconWrap: {
          width: 74,
          height: 74,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.chatEndedBadgeBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: metrics.md,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes["lg"],
          fontWeight: "700",
          marginBottom: metrics.xs,
          textAlign: "center",
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: "center",
          lineHeight: 30,
          marginBottom: metrics.lg,
          maxWidth: 520,
        },
        action: {
          minHeight: 56,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          paddingHorizontal: metrics.xl,
          alignItems: "center",
          justifyContent: "center",
        },
        actionText: {
          color: colors.textInverse,
          fontSize: typography.sizes.base,
          fontWeight: "700",
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={[styles.root, isViewChatEnabled && { display: "none" }]}>
      <View style={styles.iconWrap}>
        <Ionicons
          color={colors.textTertiary}
          name="chatbox-ellipses-outline"
          size={metrics.icon.lg}
        />
      </View>

      <Text style={styles.title}>This chat is closed.</Text>
      <Text style={styles.subtitle}>
        The trip has ended. History remains visible for your reference.
      </Text>

      <Pressable
        onPress={() => setIsViewChatEnabled(true)}
        style={styles.action}
      >
        <Text style={styles.actionText}>View Trip Chat</Text>
      </Pressable>
    </View>
  );
}
