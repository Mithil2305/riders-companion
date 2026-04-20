import React from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	StyleSheet,
	View,
} from "react-native";
import { ExploreGridSection, TrendingClip } from "../../types/explore";
import { useTheme } from "../../hooks/useTheme";
import { LargeImageCard } from "./LargeImageCard";
import { SmallImageGrid } from "./SmallImageGrid";

interface ExploreGridProps {
	sections: ExploreGridSection[];
	onEndReached: () => void;
	hasMore: boolean;
	isLoadingMore: boolean;
	onSelectClip?: (clip: TrendingClip) => void;
	onLongPressClip?: (clip: TrendingClip) => void;
}

const PREFETCH_AHEAD = 2;

export function ExploreGrid({
	sections,
	onEndReached,
	hasMore,
	isLoadingMore,
	onSelectClip,
	onLongPressClip,
}: ExploreGridProps) {
	const { colors, metrics } = useTheme();
	const prefetched = React.useRef(new Set<string>());

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
	);

	const prefetchSectionImages = React.useCallback(
		(startIndex: number) => {
			if (!Array.isArray(sections) || sections.length === 0) {
				return;
			}

			for (let i = startIndex; i <= startIndex + PREFETCH_AHEAD; i += 1) {
				const section = sections[i];
				if (
					!section ||
					!section.heroTop ||
					!section.smallLeft ||
					!section.smallRight
				) {
					continue;
				}

				[
					section.heroTop.thumbnail,
					section.smallLeft.thumbnail,
					section.smallRight.thumbnail,
					section.heroBottom?.thumbnail,
				].forEach((uri) => {
					if (!uri) {
						return;
					}
					if (prefetched.current.has(uri)) {
						return;
					}
					prefetched.current.add(uri);
					void Image.prefetch(uri);
				});
			}
		},
		[sections],
	);

	React.useEffect(() => {
		prefetchSectionImages(0);
	}, [prefetchSectionImages]);

	const renderSection = React.useCallback(
		({ item, index }: { item: ExploreGridSection; index: number }) => {
			prefetchSectionImages(index + 1);

			return (
				<View>
					{item.layout === "small-large-small" ? (
						<>
							<SmallImageGrid
								leftClip={item.smallLeft}
								leftUri={item.smallLeft.thumbnail}
								onLongPressClip={onLongPressClip}
								onSelectClip={onSelectClip}
								rightClip={item.smallRight}
								rightUri={item.smallRight.thumbnail}
							/>
							<LargeImageCard
								clip={item.heroTop}
								index={index * 3 + 1}
								onLongPressClip={onLongPressClip}
								onSelectClip={onSelectClip}
								uri={item.heroTop.thumbnail}
							/>
							{item.heroBottom ? (
								<SmallImageGrid
									leftClip={item.heroBottom}
									leftUri={item.heroBottom.thumbnail}
									onLongPressClip={onLongPressClip}
									onSelectClip={onSelectClip}
									rightClip={item.smallLeft}
									rightUri={item.smallLeft.thumbnail}
								/>
							) : null}
						</>
					) : (
						<>
							<LargeImageCard
								clip={item.heroTop}
								index={index * 3}
								onLongPressClip={onLongPressClip}
								onSelectClip={onSelectClip}
								uri={item.heroTop.thumbnail}
							/>
							<SmallImageGrid
								leftClip={item.smallLeft}
								leftUri={item.smallLeft.thumbnail}
								onLongPressClip={onLongPressClip}
								onSelectClip={onSelectClip}
								rightClip={item.smallRight}
								rightUri={item.smallRight.thumbnail}
							/>
							{item.heroBottom ? (
								<LargeImageCard
									clip={item.heroBottom}
									index={index * 3 + 2}
									onLongPressClip={onLongPressClip}
									onSelectClip={onSelectClip}
									uri={item.heroBottom.thumbnail}
								/>
							) : null}
						</>
					)}
				</View>
			);
		},
		[onLongPressClip, onSelectClip, prefetchSectionImages],
	);

	const footer = isLoadingMore ? (
		<View style={styles.footer}>
			<ActivityIndicator color={colors.spinnerHead} size="small" />
		</View>
	) : (
		<View style={styles.footerPad} />
	);

	return (
		<FlatList
			contentContainerStyle={styles.list}
			data={sections}
			keyExtractor={(item) => item.id}
			ListFooterComponent={footer}
			onEndReached={() => {
				if (hasMore && !isLoadingMore) {
					onEndReached();
				}
			}}
			onEndReachedThreshold={0.5}
			renderItem={renderSection}
			showsVerticalScrollIndicator={false}
			windowSize={5}
		/>
	);
}
