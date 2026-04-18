import React from "react";
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import {
  PostCardCaption,
  PostCardImage,
  PostCardStats,
  PostCardUser,
} from "../../types/interactions";

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
  const { colors, metrics, typography, resolvedMode } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          overflow: "hidden",
          marginBottom: metrics.sm,
          borderBottomWidth: 0.5,
          borderBottomColor: "#5b5b5b28",
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: metrics.sm,
          paddingTop: metrics.md,
          paddingBottom: metrics.sm,
        },
        userWrap: {
          flexDirection: "row",
          alignItems: "center",
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
          fontSize: typography.sizes.base,
          fontWeight: "700",
        },
        location: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: "400",
          marginTop: 2,
        },
        time: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: "500",
        },
        media: {
          width: "100%",
          height: metrics.screenWidth * 0.9,
        },
        mediaWrap: {
          overflow: "hidden",
          backgroundColor: colors.chatComposerBg,
        },
        actionsRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.sm,
        },
        leftActions: {
          flexDirection: "row",
          alignItems: "center",
          gap: metrics.md,
        },
        actionButton: {
          flexDirection: "row",
          alignItems: "center",
          gap: metrics.xs,
        },
        actionText: {
          color: colors.textSecondary,
          fontSize: typography.sizes["base"],
          fontWeight: "500",
        },
        captionRow: {
          paddingHorizontal: metrics.md,
          paddingBottom: metrics.md,
          flexDirection: "row",
          flexWrap: "wrap",
        },
        captionUser: {
          color: colors.textPrimary,
          fontSize: typography.sizes["base"],
          fontWeight: "700",
          marginRight: metrics.xs,
        },
        captionText: {
          color: colors.textPrimary,
          fontSize: typography.sizes["base"],
          fontWeight: "400",
          flexShrink: 1,
        },
      }),
    [colors, metrics, typography],
  );

  const defaultFistBumpIcon: ImageSourcePropType =
    resolvedMode === "dark"
      ? require("../../../assets/icons/fist-bump-white.png")
      : require("../../../assets/icons/fist-bump.png");

  const activeFistBumpIcon: ImageSourcePropType = require("../../../assets/icons/fist-bump-color.png");

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
            <Image
              source={stats.isLiked ? activeFistBumpIcon : defaultFistBumpIcon}
              style={{
                width: metrics.icon.md + 6,
                height: metrics.icon.md + 6,
              }}
            />
            <Text style={styles.actionText}>{stats.likeCount}</Text>
          </Pressable>

          <Pressable onPress={onPressComment} style={styles.actionButton}>
            <Ionicons
              color={colors.icon}
              name="chatbubble-outline"
              size={metrics.icon.md + 2}
            />
            <Text style={styles.actionText}>{stats.commentCount}</Text>
          </Pressable>

          <Pressable onPress={onPressShare}>
            <Ionicons
              color={colors.icon}
              name="arrow-redo-outline"
              size={metrics.icon.md + 2}
            />
          </Pressable>
        </View>

        {/* <Pressable onPress={onPressBookmark}>
          <Ionicons
            color={stats.isBookmarked ? colors.primary : colors.icon}
            name={stats.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={metrics.icon.md + 2}
          />
        </Pressable> */}
      </View>

      <View style={styles.captionRow}>
        <Text style={styles.captionUser}>{caption.username}</Text>
        <Text style={styles.captionText}>{caption.text}</Text>
      </View>
    </View>
  );
}
