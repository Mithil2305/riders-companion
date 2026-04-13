import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExploreGrid, ExploreHeader, SearchBar } from '../../src/components/explore';
import { useExploreData } from '../../src/hooks/useExploreData';
import { useTheme } from '../../src/hooks/useTheme';

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
      }),
    [colors.background, metrics.md, metrics.sm],
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
