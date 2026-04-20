import React from "react";
import {
	Alert,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExploreGrid, SearchBar } from "../../src/components/explore";
import ClipService from "../../src/services/ClipService";
import { useExploreData } from "../../src/hooks/useExploreData";
import { useTabSwipeNavigation } from "../../src/hooks/useTabSwipeNavigation";
import { useTheme } from "../../src/hooks/useTheme";
import { TrendingClip } from "../../src/types/explore";

export default function ExploreScreen() {
  const { colors, metrics } = useTheme();
  const { query, setQuery, gridSections, hasMoreClips, isLoadingMore, isSearching, loadMoreClips } =
    useExploreData();

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
	);

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={styles.container}>
      <ExploreHeader isLoading={isLoadingMore || isSearching} />
      <View style={styles.searchWrap}>
        <SearchBar onChangeText={setQuery} value={query} />
      </View>

      <ExploreGrid
        hasMore={hasMoreClips}
        isLoadingMore={isLoadingMore}
        onEndReached={loadMoreClips}
        sections={gridSections}
      />
    </SafeAreaView>
  );
}
