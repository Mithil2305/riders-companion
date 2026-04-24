import React from "react";
import {
	FlatList,
	Image,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { useTheme } from "../../src/hooks/useTheme";
import { useClipsFeed } from "../../src/hooks/useClipsFeed";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { ClipItem } from "../../src/types/clips";

function compactNumber(value: number): string {
	if (value >= 1000) {
		return `${(value / 1000).toFixed(1)}K`;
	}

	return String(value);
}

export default function ClipsScreen() {
	const { colors, metrics, typography } = useTheme();
	const insets = useSafeAreaInsets();
	const { height, width } = useWindowDimensions();
	const { clips, refreshing, setActiveIndex, toggleLike, onRefresh } =
		useClipsFeed();
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("clips");
	const [clipHeight, setClipHeight] = React.useState(height);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				clipContainer: {
					width,
					height: clipHeight,
					backgroundColor: colors.background,
				},
				media: {
					...StyleSheet.absoluteFillObject,
					width,
					height: clipHeight,
				},
				rightRail: {
					position: "absolute",
					right: metrics.md,
					bottom: insets.bottom + 110,
					alignItems: "center",
					gap: metrics.sm,
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
			}),
		[colors, insets.bottom, metrics, clipHeight, typography, width],
	);

	const handleMomentumEnd = React.useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const nextIndex = Math.round(
				event.nativeEvent.contentOffset.y / clipHeight,
			);
			setActiveIndex(nextIndex);
		},
		[clipHeight, setActiveIndex],
	);

	const renderClip = React.useCallback(
		({ item }: { item: ClipItem }) => {
			const liked = Boolean(item.likedByMe);
			const likeIcon = liked
				? require("../../assets/icons/fist-bump-color.png")
				: require("../../assets/icons/fist-bump-white.png");

			const likeCount = item.likes;

			return (
				<View style={styles.clipContainer}>
					<Image
						resizeMode="cover"
						source={{ uri: item.media }}
						style={styles.media}
					/>

					<LinearGradient
						colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)"]}
						end={{ x: 0.5, y: 1 }}
						start={{ x: 0.5, y: 0 }}
						style={StyleSheet.absoluteFillObject}
					/>

					<View style={styles.rightRail}>
						<Image source={{ uri: item.avatar }} style={styles.avatar} />

						<View style={styles.actionItem}>
							<Pressable
								onPress={() => {
									toggleLike(item.id);
								}}
								style={styles.actionIconWrap}
							>
								<Image source={likeIcon} style={styles.likeIconImage} />
							</Pressable>
							<Text style={styles.actionLabel}>{compactNumber(likeCount)}</Text>
						</View>

						<View style={styles.actionItem}>
							<View style={styles.actionIconWrap}>
								<Ionicons
									color={colors.textInverse}
									name="chatbubble"
									size={metrics.icon.md}
								/>
							</View>
							<Text style={styles.actionLabel}>
								{compactNumber(item.comments)}
							</Text>
						</View>

						<View style={styles.actionItem}>
							<View style={styles.actionIconWrap}>
								<Ionicons
									color={colors.textInverse}
									name="paper-plane"
									size={metrics.icon.md}
								/>
							</View>
							<Text style={styles.actionLabel}>
								{compactNumber(item.shares)}
							</Text>
						</View>
					</View>

					<View style={styles.bottomMeta}>
						<Text style={styles.user}>@{item.user}</Text>
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
		},
		[colors.textInverse, metrics.icon.md, metrics.icon.sm, styles, toggleLike],
	);

	return (
		<Animated.View
			style={[styles.container, swipeAnimatedStyle]}
			{...swipeHandlers}
		>
			<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
				<FlatList
					data={clips}
					decelerationRate="fast"
					disableIntervalMomentum
					getItemLayout={(_, index) => ({
						length: clipHeight,
						offset: clipHeight * index,
						index,
					})}
					keyExtractor={(item) => item.id}
					onLayout={(event) => {
						const nextHeight = event.nativeEvent.layout.height;
						if (nextHeight > 0 && nextHeight !== clipHeight) {
							setClipHeight(nextHeight);
						}
					}}
					onMomentumScrollEnd={handleMomentumEnd}
					pagingEnabled
					renderItem={renderClip}
					refreshControl={
						<RefreshControl
							colors={[colors.primary]}
							onRefresh={onRefresh}
							progressBackgroundColor={colors.surface}
							refreshing={refreshing}
							tintColor={colors.primary}
						/>
					}
					snapToInterval={clipHeight}
					showsVerticalScrollIndicator={false}
				/>
			</SafeAreaView>
		</Animated.View>
	);
}
