import React from "react";
import {
	ActivityIndicator,
	Image,
	type ImageSourcePropType,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
	Extrapolation,
	FadeInDown,
	type SharedValue,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";
import { StreamingVideo } from "../common";
import { FeedPostItem } from "../../types/feed";

interface FeedPostProps {
	item: FeedPostItem;
	index: number;
	liked: boolean;
	onToggleLike: (postId: string) => void;
	onAddComment: (postId: string, commentText?: string) => void;
	onShare: (postId: string) => void;
	onOpenProfile?: (riderId: string) => void;
	scrollY: SharedValue<number>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FeedPost({
	item,
	index,
	liked,
	onToggleLike,
	onAddComment,
	onShare,
	onOpenProfile,
	scrollY,
}: FeedPostProps) {
	const { colors, metrics, typography, resolvedMode } = useTheme();
	const [imageLoading, setImageLoading] = React.useState(
		item.mediaType !== "VIDEO",
	);
	const [showBumpPulse, setShowBumpPulse] = React.useState(false);
	const lastTapRef = React.useRef(0);

	const imageScale = useSharedValue(1);
	const likeScale = useSharedValue(1);
	const likeProgress = useSharedValue(liked ? 1 : 0);
	const bumpPulse = useSharedValue(0);

	React.useEffect(() => {
		likeProgress.value = withTiming(liked ? 1 : 0, { duration: 220 });
	}, [likeProgress, liked]);

	const imageAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: imageScale.value }],
	}));

	const parallaxStyle = useAnimatedStyle(() => {
		const cardTop = index * (metrics.screenWidth * 0.96 + metrics.xl);
		const translateY = interpolate(
			scrollY.value,
			[cardTop - metrics.screenHeight, cardTop + metrics.screenHeight],
			[-14, 14],
			Extrapolation.CLAMP,
		);

		return {
			transform: [{ translateY }],
		};
	});

	const likeAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: likeScale.value }],
	}));

	const bumpPulseStyle = useAnimatedStyle(() => {
		const scale = interpolate(
			bumpPulse.value,
			[0, 1],
			[0.85, 1.25],
			Extrapolation.CLAMP,
		);
		const opacity = interpolate(
			bumpPulse.value,
			[0, 0.4, 1],
			[0, 0.95, 0],
			Extrapolation.CLAMP,
		);

		return {
			opacity,
			transform: [{ scale }],
		};
	});

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor:
						colors.background === "#181515" ? colors.card : colors.surface,
					marginBottom: metrics.lg,
					paddingBottom: metrics.md,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: metrics.md,
					paddingBottom: metrics.sm,
				},
				userInfo: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				avatar: {
					width: 34,
					height: 34,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.surface,
				},
				username: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				time: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
				},
				mediaWrap: {
					width: "100%",
					height: metrics.screenWidth * 0.9,
					backgroundColor: colors.surface,
					overflow: "hidden",
					// borderRadius: colors.background === '#181515' ? 0 : metrics.radius.md,
				},
				media: {
					width: "100%",
					height: "100%",
				},
				imageLoading: {
					...StyleSheet.absoluteFillObject,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.surface,
				},
				actionsRow: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.sm,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				},
				leftActions: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.md,
				},
				passiveAction: {
					opacity: 0.92,
				},
				metaWrap: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					gap: metrics.xs,
				},
				likes: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				caption: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					lineHeight: typography.sizes.sm * typography.lineHeights.normal,
				},
				captionUser: {
					color: colors.textPrimary,
					fontWeight: "700",
				},
				comments: {
					color: colors.textTertiary,
					fontSize: typography.sizes.sm,
				},
				bumpPulse: {
					position: "absolute",
					alignSelf: "center",
					top: "42%",
				},
			}),
		[colors, metrics, typography],
	);

	const likeCount = item.likes;
	const isVideoPost = item.mediaType === "VIDEO";

	const defaultFistBumpIcon: ImageSourcePropType =
		resolvedMode === "dark"
			? require("../../../assets/icons/fist-bump-white.png")
			: require("../../../assets/icons/fist-bump.png");

	const activeFistBumpIcon: ImageSourcePropType = require("../../../assets/icons/fist-bump-color.png");

	const runBumpPulse = React.useCallback(() => {
		setShowBumpPulse(true);
		bumpPulse.value = 0;
		bumpPulse.value = withTiming(1, { duration: 440 }, (finished) => {
			if (finished) {
				runOnJS(setShowBumpPulse)(false);
			}
		});
	}, [bumpPulse]);

	const handleImageTap = React.useCallback(() => {
		const now = Date.now();

		if (now - lastTapRef.current < 280) {
			if (!liked) {
				onToggleLike(item.id);
			}
			runBumpPulse();
		}

		lastTapRef.current = now;
	}, [item.id, liked, onToggleLike, runBumpPulse]);

	const openProfile = React.useCallback(() => {
		if (item.riderId) {
			onOpenProfile?.(item.riderId);
		}
	}, [item.riderId, onOpenProfile]);

	return (
		<Animated.View
			entering={FadeInDown.delay(index * 90).duration(360)}
			style={styles.card}
		>
			<View style={styles.header}>
				<View style={styles.userInfo}>
					<Pressable disabled={!item.riderId} onPress={openProfile}>
						<Image source={{ uri: item.avatar }} style={styles.avatar} />
					</Pressable>
					<Pressable disabled={!item.riderId} onPress={openProfile}>
						<Text style={styles.username}>{item.user}</Text>
						<Text style={styles.time}>{item.time}</Text>
					</Pressable>
				</View>
			</View>

			<AnimatedPressable
				onPress={handleImageTap}
				onPressIn={() => {
					imageScale.value = withSpring(1.03, { damping: 14, stiffness: 200 });
				}}
				onPressOut={() => {
					imageScale.value = withSpring(1, { damping: 14, stiffness: 200 });
				}}
				style={styles.mediaWrap}
			>
				{isVideoPost ? (
					<Animated.View style={[styles.media, parallaxStyle, imageAnimatedStyle]}>
						<StreamingVideo
							contentFit="cover"
							muted
							shouldPlay={false}
							style={styles.media}
							uri={item.image}
						/>
					</Animated.View>
				) : (
					<Animated.Image
						fadeDuration={150}
						onLoadEnd={() => setImageLoading(false)}
						progressiveRenderingEnabled
						source={{ uri: item.image }}
						style={[styles.media, parallaxStyle, imageAnimatedStyle]}
					/>
				)}

				{imageLoading && !isVideoPost ? (
					<View style={styles.imageLoading}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{showBumpPulse ? (
					<Animated.View
						pointerEvents="none"
						style={[styles.bumpPulse, bumpPulseStyle]}
					>
						<Image
							source={activeFistBumpIcon}
							style={{ width: metrics.icon.xl * 1.5, height: metrics.icon.xl * 1.5 }}
						/>
					</Animated.View>
				) : null}
			</AnimatedPressable>

			<View style={styles.actionsRow}>
				<View style={styles.leftActions}>
					<Pressable
						android_ripple={{ color: colors.overlayLight }}
						onPress={() => onAddComment(item.id)}
						style={styles.passiveAction}
					>
						<Ionicons
							color={colors.icon}
							name="chatbubble-outline"
							size={metrics.icon.md - 2}
						/>
					</Pressable>

					<Pressable
						android_ripple={{ color: colors.overlayLight }}
						onPress={() => onShare(item.id)}
						style={styles.passiveAction}
					>
						<Ionicons
							color={colors.icon}
							name="share-social-outline"
							size={metrics.icon.md - 2}
						/>
					</Pressable>
				</View>

				<Pressable
					android_ripple={{ color: colors.overlayLight }}
					onPress={() => onToggleLike(item.id)}
					style={styles.passiveAction}
				>
					<Image
						source={liked ? activeFistBumpIcon : defaultFistBumpIcon}
						style={{ width: metrics.icon.md + 6, height: metrics.icon.md + 6 }}
					/>
				</Pressable>
			</View>

			<View style={styles.metaWrap}>
				<AnimatedPressable
					style={likeAnimatedStyle}
					onPress={() => {
						onToggleLike(item.id);
					}}
					onPressIn={() => {
						likeScale.value = withSpring(0.82, { damping: 10, stiffness: 320 });
					}}
					onPressOut={() => {
						likeScale.value = withSpring(
							1.05,
							{ damping: 10, stiffness: 320 },
							() => {
								likeScale.value = withSpring(1, {
									damping: 12,
									stiffness: 260,
								});
							},
						);
					}}
				>
					<Text style={[styles.likes]}>
						{likeCount} bumps
					</Text>
				</AnimatedPressable>
				<Text numberOfLines={2} style={styles.caption}>
					<Text style={styles.captionUser}>{item.user} </Text>
					{item.caption}
				</Text>
				<Pressable onPress={() => onAddComment(item.id)}>
					<Text style={styles.comments}>View all {item.comments} comments</Text>
				</Pressable>
			</View>
		</Animated.View>
	);
}
