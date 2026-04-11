import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/common';
import {
  FeedPost,
  FeedSkeleton,
  HeaderBar,
  StoryItem,
} from '../../src/components/feed';
import { useHomeFeed } from '../../src/hooks/useHomeFeed';
import { useTheme } from '../../src/hooks/useTheme';
import { FeedPostItem, Story } from '../../src/types/feed';

export default function HomeScreen() {
  const { colors, metrics, typography } = useTheme();
  const { loading, refreshing, posts, stories, likedPostIds, onRefresh, toggleLike } = useHomeFeed();

  const storyItemSize = metrics.avatar.lg + metrics.md;

  const renderStoryItem = React.useCallback(
    ({ item }: { item: Story }) => <StoryItem item={item} />,
    [],
  );

  const renderPost = React.useCallback(
    ({ item, index }: { item: FeedPostItem; index: number }) => (
      <FeedPost
        index={index}
        item={item}
        liked={Boolean(likedPostIds[item.id])}
        onToggleLike={toggleLike}
      />
    ),
    [likedPostIds, toggleLike],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        headerSection: {
          gap: metrics.sm,
          paddingBottom: metrics.sm,
        },
        storiesContent: {
          paddingHorizontal: metrics.md,
          gap: metrics.sm,
          paddingBottom: metrics.sm,
        },
        feedContent: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics['3xl'],
        },
        emptyWrap: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics['2xl'],
        },
        loadingTitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
          marginTop: metrics.lg,
        },
      }),
    [colors, metrics, typography],
  );

  const listHeader = React.useMemo(
    () => (
      <View style={styles.headerSection}>
        <HeaderBar title="Moments" />

        <FlatList
          contentContainerStyle={styles.storiesContent}
          data={stories}
          decelerationRate="fast"
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderStoryItem}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={storyItemSize}
        />
      </View>
    ),
    [renderStoryItem, stories, storyItemSize, styles.headerSection, styles.storiesContent],
  );

  if (loading) {
    return (
      <SafeAreaView edges={['left', 'right' , 'top']} style={styles.container}>
        <HeaderBar title="Moments" />
        <FeedSkeleton />
        <Text style={styles.loadingTitle}>Loading your latest moments...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right' , 'top']} style={styles.container}>
      <FlatList
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="images-outline"
              subtitle="Start sharing rides to populate your feed."
              title="No moments yet"
            />
          </View>
        }
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.feedContent}
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={onRefresh}
            progressBackgroundColor={colors.surface}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
