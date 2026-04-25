import React from "react";
import {
	AppState,
	FlatList,
	Image,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../src/hooks/useTheme";
import { useClipsFeed } from "../../src/hooks/useClipsFeed";
import { usePlaybackSettings } from "../../src/hooks/usePlaybackSettings";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { ClipItem } from "../../src/types/clips";
import { ClipsSkeleton } from "../../src/components/clips";
import { CommentSheet } from "../../src/components/feed";
import {
	ShareSheet,
	StreamingVideo,
} from "../../src/components/common";
import ClipService from "../../src/services/ClipService";
import {
	getVideoPreloadRadius,
} from "../../src/utils/videoPlayback";

function compactNumber(value: number): string {
	if (value >= 1000) {
		return `${(value / 1000).toFixed(1)}K`;
	}

	return String(value);
}

function ClipFeedCard({
	shouldRenderVideo,
	shouldPlay,
	clipHeight,
	colors,
	item,
	metrics,
	onBump,
	onOpenComments,
	onOpenShare,
	onToggleLike,
	router,
	typography,
	width,
}: {
	shouldRenderVideo: boolean;
	shouldPlay: boolean;
	clipHeight: number;
	colors: ReturnType<typeof useTheme>["colors"];
	item: ClipItem;
	metrics: ReturnType<typeof useTheme>["metrics"];
	onBump: (clipId: string) => void;
	onOpenComments: (item: ClipItem) => void;
	onOpenShare: (item: ClipItem) => void;
	onToggleLike: (clipId: string) => void;
	router: ReturnType<typeof useRouter>;
	typography: ReturnType<typeof useTheme>["typography"];
	width: number;
}) {
	const insets = useSafeAreaInsets();
	const [pausedByUser, setPausedByUser] = React.useState(false);
	const [showBumpPulse, setShowBumpPulse] = React.useState(false);
	const lastTapRef = React.useRef(0);
	const singleTapTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const bumpPulse = useSharedValue(0);
	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				clipContainer: {
					width,
					height: clipHeight,
					backgroundColor: colors.background,
				},
				media: {
					...StyleSheet.absoluteFillObject,
					width,
					height: clipHeight,
					backgroundColor: colors.background,
				},
				tapSurface: {
					...StyleSheet.absoluteFillObject,
					zIndex: 1,
				},
				rightRail: {
					position: "absolute",
					right: metrics.md,
					bottom: insets.bottom + 110,
					alignItems: "center",
					gap: metrics.sm,
					zIndex: 3,
				},
				avatar: {
					width: metrics.avatar.md + 2,
					height: metrics.avatar.md + 2,
					borderRadius: metrics.radius.full,
					borderWidth: 2,
					borderColor: colors.textInverse,
					backgroundColor: colors.surface,
				},
				actionItem: {
					alignItems: "center",
					gap: metrics.xs,
				},
				actionIconWrap: {
					width: metrics.button.md.height,
					height: metrics.button.md.height,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.overlay,
				},
				likeIconImage: {
					width: metrics.icon.lg,
					height: metrics.icon.lg,
				},
				actionLabel: {
					color: colors.textInverse,
					fontSize: typography.sizes.xs,
					fontWeight: "600",
					textShadowColor: colors.shadow,
					textShadowOffset: { width: 0, height: 1 },
					textShadowRadius: 3,
				},
				bottomMeta: {
					position: "absolute",
					left: metrics.md,
					right: metrics.xl + metrics.avatar.md,
					bottom: insets.bottom + metrics.lg,
					gap: metrics.sm,
					zIndex: 3,
				},
				user: {
					color: colors.textInverse,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
					textShadowColor: colors.shadow,
					textShadowOffset: { width: 0, height: 1 },
					textShadowRadius: 4,
				},
				caption: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					lineHeight: typography.sizes.base * typography.lineHeights.normal,
					textShadowColor: colors.shadow,
					textShadowOffset: { width: 0, height: 1 },
					textShadowRadius: 4,
				},
				musicRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.xs,
				},
				music: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
					textShadowColor: colors.shadow,
					textShadowOffset: { width: 0, height: 1 },
					textShadowRadius: 3,
				},
				centerFeedback: {
					position: "absolute",
					top: "50%",
					left: "50%",
					marginLeft: -36,
					marginTop: -36,
					width: 72,
					height: 72,
					borderRadius: 36,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "rgba(0,0,0,0.34)",
					zIndex: 2,
				},
				centerIcon: {
					width: 34,
					height: 34,
				},
			}),
		[clipHeight, colors, insets.bottom, metrics, typography, width],
	);

	const effectiveShouldPlay = shouldPlay && !pausedByUser;
	const liked = Boolean(item.likedByMe);
	const likeIcon = liked
		? require("../../assets/icons/fist-bump-color.png")
		: require("../../assets/icons/fist-bump-white.png");
	const bumpPulseStyle = useAnimatedStyle(() => ({
		opacity: bumpPulse.value,
		transform: [{ scale: 0.72 + bumpPulse.value * 0.56 }],
	}));

	const runBumpPulse = React.useCallback(() => {
		setShowBumpPulse(true);
		bumpPulse.value = 0;
		bumpPulse.value = withTiming(1, { duration: 420 }, (finished) => {
			if (finished) {
				runOnJS(setShowBumpPulse)(false);
			}
		});
	}, [bumpPulse]);

	React.useEffect(() => {
		if (effectiveShouldPlay) {
			return;
		}

		setPausedByUser(false);
		if (singleTapTimeoutRef.current) {
			clearTimeout(singleTapTimeoutRef.current);
			singleTapTimeoutRef.current = null;
		}
	}, [effectiveShouldPlay]);

	React.useEffect(() => {
		return () => {
			if (singleTapTimeoutRef.current) {
				clearTimeout(singleTapTimeoutRef.current);
			}
		};
	}, []);

	const handleSurfaceTap = React.useCallback(() => {
		if (!effectiveShouldPlay) {
			return;
		}

		const now = Date.now();
		if (now - lastTapRef.current < 280) {
			if (singleTapTimeoutRef.current) {
				clearTimeout(singleTapTimeoutRef.current);
				singleTapTimeoutRef.current = null;
			}
			if (!liked) {
				onBump(item.id);
			}
			runBumpPulse();
			lastTapRef.current = 0;
			return;
		}

		lastTapRef.current = now;
		singleTapTimeoutRef.current = setTimeout(() => {
			setPausedByUser((current) => !current);
			singleTapTimeoutRef.current = null;
		}, 280);
	}, [effectiveShouldPlay, item.id, liked, onBump, runBumpPulse]);

	return (
		<View style={styles.clipContainer}>
			{shouldRenderVideo ? (
				<StreamingVideo
					contentFit="cover"
					muted={!effectiveShouldPlay}
					shouldPlay={effectiveShouldPlay}
					style={styles.media}
					uri={item.media}
				/>
			) : (
				<View style={styles.media} />
			)}

			<LinearGradient
				colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)"]}
				end={{ x: 0.5, y: 1 }}
				start={{ x: 0.5, y: 0 }}
				style={StyleSheet.absoluteFillObject}
			/>

			<Pressable onPress={handleSurfaceTap} style={styles.tapSurface} />

			{showBumpPulse ? (
				<Animated.View style={[styles.centerFeedback, bumpPulseStyle]}>
					<Image
						source={require("../../assets/icons/fist-bump-color.png")}
						style={styles.centerIcon}
					/>
				</Animated.View>
			) : null}

			{shouldPlay && pausedByUser ? (
				<View style={styles.centerFeedback}>
					<Ionicons
						color={colors.textInverse}
						name="play"
						size={metrics.icon.xl + 10}
					/>
				</View>
			) : null}

			<View style={styles.rightRail}>
				<Pressable
					disabled={!item.riderId}
					onPress={() => item.riderId && router.push(`/rider/${item.riderId}`)}
				>
					<Image source={{ uri: item.avatar }} style={styles.avatar} />
				</Pressable>

				<View style={styles.actionItem}>
					<Pressable
						onPress={() => {
							onToggleLike(item.id);
						}}
						style={styles.actionIconWrap}
					>
						<Image source={likeIcon} style={styles.likeIconImage} />
					</Pressable>
					<Text style={styles.actionLabel}>{compactNumber(item.likes)}</Text>
				</View>

				<View style={styles.actionItem}>
					<Pressable
						onPress={() => onOpenComments(item)}
						style={styles.actionIconWrap}
					>
						<Ionicons
							color={colors.textInverse}
							name="chatbubble"
							size={metrics.icon.md}
						/>
					</Pressable>
					<Text style={styles.actionLabel}>{compactNumber(item.comments)}</Text>
				</View>

				<View style={styles.actionItem}>
					<Pressable
						onPress={() => onOpenShare(item)}
						style={styles.actionIconWrap}
					>
						<Ionicons
							color={colors.textInverse}
							name="paper-plane"
							size={metrics.icon.md}
						/>
					</Pressable>
					<Text style={styles.actionLabel}>{compactNumber(item.shares)}</Text>
				</View>
			</View>

			<View style={styles.bottomMeta}>
				<Pressable
					disabled={!item.riderId}
					onPress={() => item.riderId && router.push(`/rider/${item.riderId}`)}
				>
					<Text style={styles.user}>@{item.user}</Text>
				</Pressable>
				<Text numberOfLines={2} style={styles.caption}>
					{item.caption}
				</Text>

				<View style={styles.musicRow}>
					<Ionicons
						color={colors.textInverse}
						name="musical-notes-outline"
						size={metrics.icon.sm}
					/>
					<Text numberOfLines={1} style={styles.music}>
						{item.music}
					</Text>
				</View>
			</View>
		</View>
	);
}

export default function ClipsScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams<{ clipId?: string | string[] }>();
	const isFocused = useIsFocused();
	const { height, width } = useWindowDimensions();
	const {
		clips,
		activeIndex,
		bumpClip,
		refreshing,
		setActiveIndex,
		toggleLike,
		updateCommentCount,
		incrementShareCount,
		onRefresh,
	} = useClipsFeed();
	const { dataSaverEnabled } = usePlaybackSettings();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("clips");
	const [clipHeight, setClipHeight] = React.useState(height);
	const [appState, setAppState] = React.useState(AppState.currentState);
	const [selectedClip, setSelectedClip] = React.useState<ClipItem | null>(null);
	const [isCommentSheetVisible, setIsCommentSheetVisible] = React.useState(false);
	const [isShareSheetVisible, setIsShareSheetVisible] = React.useState(false);
	const listRef = React.useRef<FlatList<ClipItem>>(null);
	const targetClipId =
		typeof params.clipId === "string" ? params.clipId : params.clipId?.[0];
	const canPlayClips = isFocused && appState === "active";
	const preloadRadius = getVideoPreloadRadius(dataSaverEnabled);
	const selectedCommentService = React.useMemo(() => {
		if (!selectedClip || selectedClip.sourcePostId) {
			return undefined;
		}

		return {
			getComments: ClipService.getComments.bind(ClipService),
			addComment: ClipService.commentOnClip.bind(ClipService),
		};
	}, [selectedClip]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
			}),
		[colors],
	);

	const onViewableItemsChanged = React.useRef(
		({
			viewableItems,
		}: {
			viewableItems: { index: number | null; item: ClipItem }[];
		}) => {
			const firstFullyVisible = viewableItems.find(
				(entry) => entry.index != null,
			);
			if (firstFullyVisible?.index != null) {
				setActiveIndex(firstFullyVisible.index);
			}
		},
	);

	const viewabilityConfig = React.useRef({
		itemVisiblePercentThreshold: 80,
		minimumViewTime: 120,
	});

	React.useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextState) => {
			setAppState(nextState);
		});

		return () => {
			subscription.remove();
		};
	}, []);

	React.useEffect(() => {
		if (!targetClipId || clips.length === 0) {
			return;
		}

		const targetIndex = clips.findIndex((item) => item.id === targetClipId);
		if (targetIndex < 0) {
			return;
		}

		setActiveIndex(targetIndex);
		const timer = setTimeout(() => {
			listRef.current?.scrollToIndex({
				index: targetIndex,
				animated: false,
			});
		}, 0);

		return () => clearTimeout(timer);
	}, [clips, setActiveIndex, targetClipId]);

	const handleScrollToIndexFailed = React.useCallback(
		(info: { index: number }) => {
			const offset = Math.max(0, info.index * clipHeight);
			listRef.current?.scrollToOffset({
				offset,
				animated: false,
			});
			setTimeout(() => {
				listRef.current?.scrollToIndex({
					index: info.index,
					animated: false,
				});
			}, 120);
		},
		[clipHeight],
	);

	const renderClip = React.useCallback(
		({ index, item }: { index: number; item: ClipItem }) => {
			const distanceFromActive = Math.abs(index - activeIndex);
			const shouldRenderVideo = distanceFromActive <= preloadRadius;
			const shouldPlay =
				index === activeIndex && canPlayClips;

			return (
				<ClipFeedCard
					clipHeight={clipHeight}
					colors={colors}
					item={item}
					metrics={metrics}
					onBump={bumpClip}
					onOpenComments={(clip) => {
						setSelectedClip(clip);
						setIsCommentSheetVisible(true);
					}}
					onOpenShare={(clip) => {
						setSelectedClip(clip);
						setIsShareSheetVisible(true);
					}}
					onToggleLike={toggleLike}
					router={router}
					shouldPlay={shouldPlay}
					shouldRenderVideo={shouldRenderVideo}
					typography={typography}
					width={width}
				/>
			);
		},
		[
			activeIndex,
			bumpClip,
			canPlayClips,
			clipHeight,
			colors,
			metrics,
			preloadRadius,
			router,
			toggleLike,
			typography,
			width,
		],
	);

	return (
		<Animated.View
			style={[styles.container, swipeAnimatedStyle]}
			{...swipeHandlers}
		>
			<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
				{clips.length === 0 && !refreshing ? (
					<ClipsSkeleton />
				) : (
					<FlatList
						data={clips}
						decelerationRate="fast"
						disableIntervalMomentum
						getItemLayout={(_, index) => ({
							length: clipHeight,
							offset: clipHeight * index,
							index,
						})}
						initialNumToRender={3}
						keyExtractor={(item) => item.id}
						maxToRenderPerBatch={3}
						onLayout={(event) => {
							const nextHeight = event.nativeEvent.layout.height;
							if (nextHeight > 0 && nextHeight !== clipHeight) {
								setClipHeight(nextHeight);
							}
						}}
						onScrollToIndexFailed={handleScrollToIndexFailed}
						onViewableItemsChanged={onViewableItemsChanged.current}
						pagingEnabled
						ref={listRef}
						refreshControl={
							<RefreshControl
								colors={[colors.primary]}
								onRefresh={onRefresh}
								progressBackgroundColor={colors.surface}
								refreshing={refreshing}
								tintColor={colors.primary}
							/>
						}
						removeClippedSubviews
						renderItem={renderClip}
						showsVerticalScrollIndicator={false}
						snapToAlignment="start"
						snapToInterval={clipHeight}
						viewabilityConfig={viewabilityConfig.current}
						windowSize={3}
					/>
				)}
				<CommentSheet
					commentService={selectedCommentService}
					postId={selectedClip?.sourcePostId ?? selectedClip?.id ?? null}
					visible={isCommentSheetVisible}
					onClose={() => setIsCommentSheetVisible(false)}
					onCommentAdded={(newCount) => {
						if (selectedClip) {
							updateCommentCount(selectedClip.id, newCount);
						}
					}}
				/>
				<ShareSheet
					onClose={() => setIsShareSheetVisible(false)}
					onShared={() => {
						if (selectedClip) {
							incrementShareCount(selectedClip.id);
						}
					}}
					postId={selectedClip?.sourcePostId ?? selectedClip?.id ?? null}
					resourceType={selectedClip?.sourcePostId ? "post" : "clip"}
					visible={isShareSheetVisible}
				/>
			</SafeAreaView>
		</Animated.View>
	);
}
