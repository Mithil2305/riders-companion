import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { EmptyState } from '../../src/components/common';
import {
  EndOfFeed,
  FeedPost,
  FeedSkeleton,
  HeaderBar,
} from '../../src/components/feed';
import { useHomeFeed } from '../../src/hooks/useHomeFeed';
import { useTheme } from '../../src/hooks/useTheme';
import { FeedPostItem } from '../../src/types/feed';

export default function HomeScreen() {
  const { colors, metrics, typography } = useTheme();
  const { loading, refreshing, posts, likedPostIds, onRefresh, toggleLike } = useHomeFeed();
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const renderPost = React.useCallback(
    ({ item, index }: { item: FeedPostItem; index: number }) => (
      <FeedPost
        index={index}
        item={item}
        liked={Boolean(likedPostIds[item.id])}
        onToggleLike={toggleLike}
        scrollY={scrollY}
      />
    ),
    [likedPostIds, scrollY, toggleLike],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          gap: metrics.md,
        },
        feedContent: {
          paddingBottom: metrics['3xl'],
          backgroundColor: colors.background,
          paddingTop: metrics.md,
          // paddingHorizontal: metrics.md,
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

  if (loading) {
    return (
      <SafeAreaView edges={['left', 'right' , 'top']} style={styles.container}>
        <HeaderBar showSpinner title="Moments" />
        <FeedSkeleton />
        <Text style={styles.loadingTitle}>Loading your latest moments...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right' , 'top']} style={styles.container}>
      <HeaderBar
        showSpinner={refreshing}
        title="Moments"
        titleIcon={require('../../assets/icons/feed-plus.png')}
      />

      <Animated.FlatList
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="images-outline"
              subtitle="Start sharing rides to populate your feed."
              title="No moments yet"
            />
          </View>
        }
        ListFooterComponent={<EndOfFeed />}
        contentContainerStyle={styles.feedContent}
        data={posts}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
