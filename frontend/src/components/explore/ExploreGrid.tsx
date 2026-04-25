import React from "react"
import {
	ActivityIndicator,
	FlatList,
	Image,
	StyleSheet,
	View,
} from "react-native"
import { ExploreGridSection, TrendingClip } from "../../types/explore"
import { useTheme } from "../../hooks/useTheme"
import { LargeImageCard } from "./LargeImageCard"
import { SmallImageGrid } from "./SmallImageGrid"
import { MasonryGrid } from "./MasonryGrid"

interface ExploreGridProps {
	sections?: ExploreGridSection[]
	clips?: TrendingClip[]
	clipAspects?: Map<string, number>
	onEndReached: () => void
	hasMore: boolean
	isLoadingMore: boolean
	onSelectClip?: (clip: TrendingClip) => void
	onLongPressClip?: (clip: TrendingClip) => void
}

const PREFETCH_AHEAD = 2

export function ExploreGrid({
	sections,
	clips,
	clipAspects,
	onEndReached,
	hasMore,
	isLoadingMore,
	onSelectClip,
	onLongPressClip,
}: ExploreGridProps) {
	const { colors, metrics } = useTheme()
	const prefetched = React.useRef(new Set<string>())

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				list: {
					flex: 1,
					backgroundColor: colors.background,
				},
				footer: {
					height: 66,
					alignItems: "center",
					justifyContent: "center",
				},
				footerPad: {
					height: metrics.md,
				},
			}),
		[colors.background, metrics.md],
	)

	// Fallback to legacy section-based layout
	const prefetchSectionImages = React.useCallback(
		(startIndex: number) => {
			if (!Array.isArray(sections) || sections.length === 0) {
				return
			}

			for (let i = startIndex; i <= startIndex + PREFETCH_AHEAD; i += 1) {
				const section = sections[i]
				if (
					!section ||
					!section.heroTop ||
					!section.smallLeft ||
					!section.smallRight
				) {
					continue
				}

				;[
					section.heroTop.thumbnail,
					section.smallLeft.thumbnail,
					section.smallRight.thumbnail,
					section.heroBottom?.thumbnail,
				].forEach((uri) => {
					if (!uri) {
						return
					}
					if (prefetched.current.has(uri)) {
						return
					}
					prefetched.current.add(uri)
					void Image.prefetch(uri)
				})
			}
		},
		[sections],
	)

	React.useEffect(() => {
		prefetchSectionImages(0)
	}, [prefetchSectionImages])

	const renderSection = React.useCallback(
		({ item, index }: { item: ExploreGridSection; index: number }) => {
			prefetchSectionImages(index + 1)

			return (
				<View key={item.id}>
					{item.layout === "small-large-small" ? (
						<>
							<SmallImageGrid
								leftUri={item.smallLeft.thumbnail}
								rightUri={item.smallRight.thumbnail}
								leftClip={item.smallLeft}
								rightClip={item.smallRight}
								onSelectClip={onSelectClip}
								onLongPressClip={onLongPressClip}
							/>
							<LargeImageCard
								uri={item.heroTop.thumbnail}
								index={index}
								clip={item.heroTop}
								onSelectClip={onSelectClip}
								onLongPressClip={onLongPressClip}
							/>
							{item.heroBottom ? (
								<SmallImageGrid
									leftUri={item.heroBottom.thumbnail}
									rightUri={item.smallLeft.thumbnail}
									leftClip={item.heroBottom}
									rightClip={item.smallLeft}
									onSelectClip={onSelectClip}
									onLongPressClip={onLongPressClip}
								/>
							) : null}
						</>
					) : (
						<>
							<LargeImageCard
								uri={item.heroTop.thumbnail}
								index={index}
								clip={item.heroTop}
								onSelectClip={onSelectClip}
								onLongPressClip={onLongPressClip}
							/>
							<SmallImageGrid
								leftUri={item.smallLeft.thumbnail}
								rightUri={item.smallRight.thumbnail}
								leftClip={item.smallLeft}
								rightClip={item.smallRight}
								onSelectClip={onSelectClip}
								onLongPressClip={onLongPressClip}
							/>
							{item.heroBottom ? (
								<LargeImageCard
									uri={item.heroBottom.thumbnail}
									index={index + 1}
									clip={item.heroBottom}
									onSelectClip={onSelectClip}
									onLongPressClip={onLongPressClip}
								/>
							) : null}
						</>
					)}
				</View>
			)
		},
		[onLongPressClip, onSelectClip, prefetchSectionImages],
	)

	const footer = isLoadingMore ? (
		<View style={styles.footer}>
			<ActivityIndicator size="small" color="#999" />
		</View>
	) : (
		<View style={styles.footerPad} />
	)

	if (clips && clipAspects && clips.length > 0) {
		return (
			<MasonryGrid
				clips={clips}
				clipAspects={clipAspects}
				onEndReached={onEndReached}
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
				onSelectClip={onSelectClip}
				onLongPressClip={onLongPressClip}
			/>
		)
	}

	return (
		<FlatList
			style={styles.list}
			data={sections}
			keyExtractor={(item) => item.id}
			ListFooterComponent={footer}
			onEndReached={() => {
				if (hasMore && !isLoadingMore) {
					onEndReached()
				}
			}}
			onEndReachedThreshold={0.5}
			renderItem={renderSection}
			showsVerticalScrollIndicator={false}
			windowSize={5}
		/>
	)
}
