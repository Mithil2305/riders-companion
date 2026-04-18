import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "../src/hooks/useTheme";
import { PostCard } from "../src/components/feed/PostCard";
import { PostCardModel } from "../src/types/interactions";
import { mockExplorePosts } from "../src/utils/mocks/explore";
import { CommentsSheet } from "@/src/components/comments";
import { ShareSheet } from "@/src/components/share";

function shufflePosts(posts: PostCardModel[]): PostCardModel[] {
  const items = [...posts];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

export default function ExplorePostsScreen() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const { colors, metrics, typography } = useTheme();
  const [likedPostIds, setLikedPostIds] = React.useState<
    Record<string, boolean>
  >({});
  const [activeCommentsPostId, setActiveCommentsPostId] = React.useState<
    string | null
  >(null);
  const [activeSharePostId, setActiveSharePostId] = React.useState<
    string | null
  >(null);

  const posts = React.useMemo(() => {
    const selectedPost =
      mockExplorePosts.find((post) => post.id === postId) ??
      mockExplorePosts[0];
    const remainingPosts = mockExplorePosts.filter(
      (post) => post.id !== selectedPost.id,
    );

    return [selectedPost, ...shufflePosts(remainingPosts)];
  }, [postId]);

  const toggleLike = React.useCallback((id: string) => {
    setLikedPostIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm,
          paddingBottom: metrics.sm,
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        backButton: {
          width: 36,
          height: 36,
          borderRadius: metrics.radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: "700",
        },
        headerSpacer: {
          width: 36,
          height: 36,
        },
        listContent: {
          paddingTop: metrics.md,
          paddingBottom: metrics["xl"],
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons
            color={colors.icon}
            name="chevron-back"
            size={metrics.icon.md}
          />
        </Pressable>
        <Text style={styles.title}>Explore Posts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            caption={item.caption}
            image={item.image}
            onPressLike={() => toggleLike(item.id)}
            stats={{
              ...item.stats,
              isLiked: Boolean(likedPostIds[item.id]),
            }}
            onPressComment={() => setActiveCommentsPostId(item.id)}
            onPressShare={() => setActiveSharePostId(item.id)}
            user={item.user}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <CommentsSheet
        onClose={() => {
          setActiveCommentsPostId(null);
        }}
        postId={activeCommentsPostId ?? "home-post"}
        visible={activeCommentsPostId !== null}
      />

      <ShareSheet
        onClose={() => {
          setActiveSharePostId(null);
        }}
        postId={activeSharePostId ?? "home-post"}
        visible={activeSharePostId !== null}
      />
    </SafeAreaView>
  );
}
