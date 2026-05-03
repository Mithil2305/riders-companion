import React from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
	useAnimatedScrollHandler,
	useSharedValue,
} from "react-native-reanimated";
import { EmptyState } from "../../src/components/common";
import { ShareSheet } from "../../src/components/share";
import {
	EndOfFeed,
	FeedPost,
	FeedSkeleton,
	HeaderBar,
} from "../../src/components/feed";
import { CommentsSheet } from "../../src/components/comments";
import { useHomeFeed } from "../../src/hooks/useHomeFeed";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import { FeedPostItem } from "../../src/types/feed";

export default function HomeScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const {
		loading,
		refreshing,
		posts,
		likedPostIds,
		onRefresh,
		toggleLike,
		updateCommentCount,
	} = useHomeFeed();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("home");
	const scrollY = useSharedValue(0);

<<<<<<< HEAD
	const [selectedPostId, setSelectedPostId] = React.useState<string | null>(null);
	const [isCommentSheetVisible, setIsCommentSheetVisible] = React.useState(false);
=======
	const [selectedPostId, setSelectedPostId] = React.useState<string | null>(
		null,
	);
	const [isCommentSheetVisible, setIsCommentSheetVisible] =
		React.useState(false);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	const [isShareSheetVisible, setIsShareSheetVisible] = React.useState(false);

	const openCommentSheet = React.useCallback((postId: string) => {
		setSelectedPostId(postId);
		setIsCommentSheetVisible(true);
	}, []);

	const openShareSheet = React.useCallback((postId: string) => {
		setSelectedPostId(postId);
		setIsShareSheetVisible(true);
	}, []);

	const handleCommentsCountChange = React.useCallback(
		(newCount: number) => {
			if (selectedPostId) {
				updateCommentCount(selectedPostId, newCount);
			}
		},
		[selectedPostId, updateCommentCount],
	);

	const openProfile = React.useCallback(
		(riderId: string) => {
			router.push(`/rider/${riderId}`);
		},
		[router],
	);

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
				onAddComment={openCommentSheet}
				onOpenProfile={openProfile}
				onShare={openShareSheet}
				onToggleLike={toggleLike}
				scrollY={scrollY}
			/>
		),
<<<<<<< HEAD
		[openCommentSheet, openProfile, openShareSheet, likedPostIds, scrollY, toggleLike],
=======
		[
			openCommentSheet,
			openProfile,
			openShareSheet,
			likedPostIds,
			scrollY,
			toggleLike,
		],
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
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
					<HeaderBar showBottomBorder={false} showSpinner title="Moments" />
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
				<HeaderBar
					showBottomBorder={false}
					showSpinner={refreshing}
					title="Moments"
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
					initialNumToRender={4}
					keyExtractor={(item) => item.id}
					maxToRenderPerBatch={5}
					onScroll={onScroll}
					removeClippedSubviews
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
					windowSize={7}
				/>
				<CommentsSheet
					contentId={selectedPostId}
					contentType="feed"
					visible={isCommentSheetVisible}
					onClose={() => setIsCommentSheetVisible(false)}
					onCommentsCountChange={handleCommentsCountChange}
				/>
				{(() => {
					const selectedPost = posts.find((p) => p.id === selectedPostId);
					return (
						<ShareSheet
							postId={selectedPostId}
							visible={isShareSheetVisible}
							onClose={() => setIsShareSheetVisible(false)}
							caption={selectedPost?.caption}
							thumbnailUrl={selectedPost?.image}
							resourceType="post"
						/>
					);
				})()}
			</SafeAreaView>
		</Animated.View>
	);
}
