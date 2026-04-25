import React from "react"
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated"
import { useTheme } from "../../hooks/useTheme"
import { StreamingVideo } from "../common"
import { TrendingClip } from "../../types/explore"

const { width: SCREEN_W } = Dimensions.get("window")
const COLUMN_COUNT = 3
const GAP = 3

interface MasonryGridProps {
	clips: TrendingClip[]
	clipAspects: Map<string, number>
	onEndReached?: () => void
	hasMore?: boolean
	isLoadingMore?: boolean
	onSelectClip?: (clip: TrendingClip) => void
	onLongPressClip?: (clip: TrendingClip) => void
}

interface MasonryItem {
	clip: TrendingClip
	height: number
	index: number
}

interface MasonryColumn {
	items: MasonryItem[]
	totalHeight: number
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
const AnimatedImage = Animated.createAnimatedComponent(Image)

function MasonryTile({
	item,
	onSelect,
	onLongPress,
}: {
	item: MasonryItem
	onSelect?: (clip: TrendingClip) => void
	onLongPress?: (clip: TrendingClip) => void
}) {
	const { colors } = useTheme()
	const scale = useSharedValue(1)
	const imageOpacity = useSharedValue(0)
	const [loading, setLoading] = React.useState(true)
	const isVideo = item.clip.type === "clip" || item.clip.mediaType === "video"
	const [previewPlaying, setPreviewPlaying] = React.useState(false)

	React.useEffect(() => {
		if (isVideo) {
			setLoading(false)
			imageOpacity.value = 1
		}
	}, [imageOpacity, isVideo, item.clip.id])

	React.useEffect(() => {
		if (!isVideo || item.index > 5) {
			setPreviewPlaying(false)
			return
		}

		setPreviewPlaying(true)
		const timer = setTimeout(() => {
			setPreviewPlaying(false)
		}, 2600)

		return () => {
			clearTimeout(timer)
		}
	}, [isVideo, item.index, item.clip.id])

	const pressStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}))

	const imageStyle = useAnimatedStyle(() => ({
		opacity: imageOpacity.value,
	}))

	return (
		<AnimatedPressable
			onLongPress={() => onLongPress?.(item.clip)}
			onPress={() => onSelect?.(item.clip)}
			onPressIn={() => {
				scale.value = withSpring(0.97, { damping: 16, stiffness: 220 })
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 16, stiffness: 220 })
			}}
			style={[
				{
					width: "100%",
					height: item.height,
					marginBottom: GAP,
					backgroundColor: colors.surface,
					overflow: "hidden",
					borderRadius: 4,
				},
				pressStyle,
			]}
		>
			{isVideo ? (
				<Animated.View style={[{ width: "100%", height: "100%" }, imageStyle]}>
					<StreamingVideo
						contentFit="cover"
						muted
						shouldPlay={previewPlaying}
						style={{ width: "100%", height: "100%" }}
						uri={item.clip.thumbnail}
					/>
				</Animated.View>
			) : (
				<AnimatedImage
					source={{ uri: item.clip.thumbnail }}
					style={[{ width: "100%", height: "100%" }, imageStyle]}
					resizeMode="cover"
					onLoad={() => {
						setLoading(false)
						imageOpacity.value = withTiming(1, {
							duration: 220,
							easing: Easing.out(Easing.quad),
						})
					}}
				/>
			)}
			{loading && (
				<View
					style={{
						...StyleSheet.absoluteFillObject,
						backgroundColor: colors.surface,
						opacity: 0.85,
					}}
				/>
			)}
			{isVideo && (
				<View
					style={{
						position: "absolute",
						top: 6,
						right: 6,
						backgroundColor: colors.overlay,
						borderRadius: 4,
						paddingHorizontal: 4,
						paddingVertical: 2,
					}}
				>
					<Ionicons name="play" size={12} color={colors.textInverse} />
				</View>
			)}
		</AnimatedPressable>
	)
}

export function MasonryGrid({
	clips,
	clipAspects,
	onEndReached,
	hasMore,
	isLoadingMore,
	onSelectClip,
	onLongPressClip,
}: MasonryGridProps) {
	const { colors } = useTheme()
	const scrollRef = React.useRef<ScrollView>(null)
	const [nearBottom, setNearBottom] = React.useState(false)

	const columnWidth =
		(SCREEN_W - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT

	const columns = React.useMemo<MasonryColumn[]>(() => {
		const cols: MasonryColumn[] = Array.from({ length: COLUMN_COUNT }, () => ({
			items: [],
			totalHeight: 0,
		}))

		clips.forEach((clip, index) => {
			const shortestIdx = cols.reduce(
				(min, col, i) => (col.totalHeight < cols[min].totalHeight ? i : min),
				0,
			)

			const aspect = clipAspects.get(clip.id)
			const rawHeight = aspect ? columnWidth / aspect : columnWidth
			const height = Math.max(100, Math.min(380, rawHeight))

			cols[shortestIdx].items.push({ clip, height, index })
			cols[shortestIdx].totalHeight += height + GAP
		})

		return cols
	}, [clips, clipAspects, columnWidth])

	const handleScroll = React.useCallback(
		(event: any) => {
			const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
			const paddingToBottom = 120
			const isClose =
				layoutMeasurement.height + contentOffset.y >=
				contentSize.height - paddingToBottom
			if (isClose && !nearBottom) {
				setNearBottom(true)
				onEndReached?.()
			} else if (!isClose && nearBottom) {
				setNearBottom(false)
			}
		},
		[nearBottom, onEndReached],
	)

	return (
		<ScrollView
			ref={scrollRef}
			style={{ flex: 1 }}
			contentContainerStyle={{
				paddingHorizontal: GAP,
				paddingTop: GAP,
				paddingBottom: isLoadingMore ? 0 : GAP,
			}}
			onScroll={handleScroll}
			scrollEventThrottle={400}
			showsVerticalScrollIndicator={false}
		>
			<View style={{ flexDirection: "row", gap: GAP }}>
				{columns.map((col, colIdx) => (
					<View key={`col-${colIdx}`} style={{ flex: 1 }}>
						{col.items.map((item) => (
							<MasonryTile
								key={item.clip.id}
								item={item}
								onSelect={onSelectClip}
								onLongPress={onLongPressClip}
							/>
						))}
					</View>
				))}
			</View>
			{isLoadingMore && (
				<View style={{ paddingVertical: 20, alignItems: "center" }}>
					<ActivityIndicator size="small" color={colors.primary} />
				</View>
			)}
		</ScrollView>
	)
}
