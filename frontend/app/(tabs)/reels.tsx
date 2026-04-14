import React from "react";
import {
	FlatList,
	Image,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
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
import { useTheme } from "../../src/hooks/useTheme";
import { useReelsFeed } from "../../src/hooks/useReelsFeed";
import { ReelItem } from "../../src/types/reels";

function compactNumber(value: number): string {
	if (value >= 1000) {
		return `${(value / 1000).toFixed(1)}K`;
	}

	return String(value);
}

export default function ReelsScreen() {
	const { colors, metrics, typography } = useTheme();
	const insets = useSafeAreaInsets();
	const { height, width } = useWindowDimensions();
	const { reels, setActiveIndex } = useReelsFeed();
	const [reelHeight, setReelHeight] = React.useState(height);
	const [likedReelIds, setLikedReelIds] = React.useState<
		Record<string, boolean>
	>({});

	const toggleLike = React.useCallback((reelId: string) => {
		setLikedReelIds((prev) => ({
			...prev,
			[reelId]: !prev[reelId],
		}));
	}, []);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				reelContainer: {
					width,
					height: reelHeight,
					backgroundColor: colors.background,
				},
				media: {
					...StyleSheet.absoluteFillObject,
					width,
					height: reelHeight,
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
		[colors, insets.bottom, insets.top, metrics, reelHeight, typography, width],
	);

	const handleMomentumEnd = React.useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const nextIndex = Math.round(
				event.nativeEvent.contentOffset.y / reelHeight,
			);
			setActiveIndex(nextIndex);
		},
		[reelHeight, setActiveIndex],
	);

	const renderReel = React.useCallback(
		({ item }: { item: ReelItem }) => {
			const liked = Boolean(likedReelIds[item.id]);
			const likeIcon = liked
				? require("../../assets/icons/fist-bump-color.png")
				: require("../../assets/icons/fist-bump-white.png");

			const likeCount = liked ? item.likes + 1 : item.likes;

			return (
				<View style={styles.reelContainer}>
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
		[
			colors.primary,
			colors.textInverse,
			likedReelIds,
			metrics.icon.md,
			metrics.icon.sm,
			styles,
			toggleLike,
		],
	);

	return (
		<SafeAreaView edges={["left", "right"]} style={styles.container}>
			<FlatList
				data={reels}
				decelerationRate="fast"
				disableIntervalMomentum
				getItemLayout={(_, index) => ({
					length: reelHeight,
					offset: reelHeight * index,
					index,
				})}
				keyExtractor={(item) => item.id}
				onLayout={(event) => {
					const nextHeight = event.nativeEvent.layout.height;
					if (nextHeight > 0 && nextHeight !== reelHeight) {
						setReelHeight(nextHeight);
					}
				}}
				onMomentumScrollEnd={handleMomentumEnd}
				pagingEnabled
				renderItem={renderReel}
				snapToInterval={reelHeight}
				showsVerticalScrollIndicator={false}
			/>
		</SafeAreaView>
	);
}
