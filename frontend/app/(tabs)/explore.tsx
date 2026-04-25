import React from "react"
import {
	Alert,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { ExploreGrid, SearchBar, SearchSuggestions } from "../../src/components/explore"
import ClipService from "../../src/services/ClipService"
import FeedService from "../../src/services/FeedService"
import { useExploreData } from "../../src/hooks/useExploreData"
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation"
import { useTheme } from "../../src/hooks/useTheme"
import { TrendingClip } from "../../src/types/explore"

export default function ExploreScreen() {
	const { colors, metrics, typography } = useTheme()
	const {
		query,
		setQuery,
		clips,
		clipAspects,
		searchResults,
		isSearchLoading,
		hasMoreClips,
		isLoadingMore,
		loadMoreClips,
	} = useExploreData()
	const { animatedStyle: swipeAnimatedStyle, swipeHandlers } =
		useTabSwipeNavigation("explore")
	const [detailVisible, setDetailVisible] = React.useState(false)
	const [selectedClipId, setSelectedClipId] = React.useState<string | null>(
		null,
	)
	const [searchFocused, setSearchFocused] = React.useState(false)

	const selectedIndex = React.useMemo(
		() => clips.findIndex((clip) => clip.id === selectedClipId),
		[clips, selectedClipId],
	)

	const relatedClips = React.useMemo(() => {
		if (selectedIndex < 0) {
			return clips
		}

		const current = clips[selectedIndex]
		const rest = clips.filter((clip) => clip.id !== current.id)
		return [current, ...rest]
	}, [clips, selectedIndex])

	const openClipDetail = React.useCallback((clip: TrendingClip) => {
		setSelectedClipId(clip.id)
		setDetailVisible(true)
	}, [])

	const handleClipLongPress = React.useCallback(async (clip: TrendingClip) => {
		const realId = clip.id.replace(/^(post-|clip-)/, "")
		Alert.alert("Post actions", "Choose an action for this post.", [
			{
				text: "Like",
				onPress: async () => {
					try {
						if (clip.likedByMe) {
							if (clip.type === "post") {
								await FeedService.unlikePost(realId)
							} else {
								await ClipService.unlikeClip(realId)
							}
						} else {
							if (clip.type === "post") {
								await FeedService.likePost(realId)
							} else {
								await ClipService.likeClip(realId)
							}
						}
					} catch {
						Alert.alert("Action failed", "Unable to update like right now.")
					}
				},
			},
			{
				text: "Share to friends",
				onPress: () => {
					Alert.alert(
						"Shared",
						"This post was shared to your platform friends feed.",
					)
				},
			},
			{
				text: "Cancel",
				style: "cancel",
			},
		])
	}, [])

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				searchWrap: {
					paddingHorizontal: metrics.md,
					paddingBottom: metrics.sm,
					zIndex: 10,
				},
				suggestionsWrap: {
					flex: 1,
					backgroundColor: colors.background,
				},
				detailBackdrop: {
					flex: 1,
					backgroundColor: colors.background,
					paddingTop: metrics.md,
				},
				detailHeader: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: metrics.md,
					paddingBottom: metrics.sm,
				},
				detailTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				detailList: {
					paddingHorizontal: metrics.md,
					gap: metrics.lg,
					paddingBottom: metrics["3xl"],
				},
				detailCard: {
					borderRadius: metrics.radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.card,
					padding: metrics.md,
					gap: metrics.sm,
				},
				media: {
					width: "100%",
					aspectRatio: 1,
					borderRadius: metrics.radius.md,
					backgroundColor: colors.surface,
				},
				creator: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				caption: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					lineHeight: typography.sizes.sm * 1.45,
				},
			}),
		[colors, metrics, typography],
	)

	const showSuggestions = query.length > 0 || searchFocused

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<Animated.View style={[styles.container, swipeAnimatedStyle]} {...swipeHandlers}>
				<View style={styles.searchWrap}>
					<SearchBar
						value={query}
						onChangeText={setQuery}
						onFocus={() => setSearchFocused(true)}
						onBlur={() => {
							setTimeout(() => setSearchFocused(false), 150)
						}}
					/>
				</View>

				{showSuggestions ? (
					<View style={styles.suggestionsWrap}>
						<SearchSuggestions
							results={searchResults}
							isLoading={isSearchLoading}
							query={query}
							onClose={() => {
								setSearchFocused(false)
							}}
						/>
					</View>
				) : (
					<ExploreGrid
						clips={clips}
						clipAspects={clipAspects}
						onEndReached={loadMoreClips}
						hasMore={hasMoreClips}
						isLoadingMore={isLoadingMore}
						onSelectClip={openClipDetail}
						onLongPressClip={handleClipLongPress}
					/>
				)}
			</Animated.View>

			<Modal
				animationType="slide"
				onRequestClose={() => setDetailVisible(false)}
				visible={detailVisible}
			>
				<View style={styles.detailBackdrop}>
					<Pressable
						style={styles.detailHeader}
						onPress={() => setDetailVisible(false)}
					>
						<Ionicons
							name="chevron-back"
							size={28}
							color={colors.textPrimary}
						/>
						<Text style={styles.detailTitle}>Post</Text>
						<View style={{ width: 28 }} />
					</Pressable>

					<ScrollView contentContainerStyle={styles.detailList}>
						{relatedClips.map((clip: TrendingClip) => (
							<View key={clip.id} style={styles.detailCard}>
								<Image
									source={{ uri: clip.thumbnail }}
									style={styles.media}
									resizeMode="cover"
								/>
								<Text style={styles.creator}>
									@{clip.creatorUsername}
								</Text>
								<Text style={styles.caption}>{clip.title}</Text>
							</View>
						))}
					</ScrollView>
				</View>
			</Modal>
		</SafeAreaView>
	)
}
