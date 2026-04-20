import React from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
	useAnimatedScrollHandler,
	useSharedValue,
} from "react-native-reanimated";
import { EmptyState } from "../../src/components/common";
import {
	EndOfFeed,
	FeedPost,
	FeedSkeleton,
	HeaderBar,
} from "../../src/components/feed";
import { useHomeFeed } from "../../src/hooks/useHomeFeed";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import { FeedPostItem } from "../../src/types/feed";
import { CommentsSheet } from "@/src/components/comments";
import { ShareSheet } from "@/src/components/share";

export default function HomeScreen() {
	const { colors, metrics, typography } = useTheme();
	const {
		loading,
		refreshing,
		posts,
		likedPostIds,
		onRefresh,
		toggleLike,
		addComment,
	} = useHomeFeed();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("home");
	const scrollY = useSharedValue(0);

	const [activeCommentsPostId, setActiveCommentsPostId] = React.useState<
		string | null
	>(null);
	const [activeSharePostId, setActiveSharePostId] = React.useState<
		string | null
	>(null);

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
				onAddComment={addComment}
				onToggleLike={toggleLike}
				scrollY={scrollY}
				onPressComment={() => setActiveCommentsPostId(item.id)}
				onPressShare={() => setActiveSharePostId(item.id)}
			/>
		),
		[addComment, likedPostIds, scrollY, toggleLike],
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
					paddingBottom: metrics["3xl"],
					backgroundColor: colors.background,
					paddingTop: metrics.md,
					// paddingHorizontal: metrics.md,
				},
				emptyWrap: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics["2xl"],
				},
				loadingTitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
					marginTop: metrics.lg,
				},
			}),
		[colors, metrics, typography],
	);

	if (loading) {
		return (
			<Animated.View
				style={[styles.container, swipeAnimatedStyle]}
				{...swipeHandlers}
			>
				<SafeAreaView edges={["left", "right", "top"]} style={styles.container}>
					<HeaderBar showSpinner title="Moments" />
					<FeedSkeleton />
					<Text style={styles.loadingTitle}>
						Loading your latest moments...
					</Text>
				</SafeAreaView>
			</Animated.View>
		);
	}

	return (
		<Animated.View
			style={[styles.container, swipeAnimatedStyle]}
			{...swipeHandlers}
		>
			<SafeAreaView edges={["left", "right", "top"]} style={styles.container}>
				<HeaderBar showSpinner={refreshing} title="Moments" />

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
		</Animated.View>
	);
}
