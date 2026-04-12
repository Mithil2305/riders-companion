import React from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, View } from 'react-native';
import { ExploreGridSection } from '../../types/explore';
import { useTheme } from '../../hooks/useTheme';
import { LargeImageCard } from './LargeImageCard';
import { SmallImageGrid } from './SmallImageGrid';

interface ExploreGridProps {
  sections: ExploreGridSection[];
  onEndReached: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const PREFETCH_AHEAD = 2;

export function ExploreGrid({ sections, onEndReached, hasMore, isLoadingMore }: ExploreGridProps) {
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
          alignItems: 'center',
          justifyContent: 'center',
        },
        footerPad: {
          height: metrics.md,
        },
      }),
    [colors.background, metrics.md],
  );

  const prefetchSectionImages = React.useCallback((startIndex: number) => {
    for (let i = startIndex; i <= startIndex + PREFETCH_AHEAD; i += 1) {
      const section = sections[i];
      if (!section) {
        continue;
      }

      [
        section.heroTop.thumbnail,
        section.smallLeft.thumbnail,
        section.smallRight.thumbnail,
        section.heroBottom?.thumbnail,
      ].forEach(
        (uri) => {
          if (!uri) {
            return;
          }
          if (prefetched.current.has(uri)) {
            return;
          }
          prefetched.current.add(uri);
          void Image.prefetch(uri);
        },
      );
    }
  }, [sections]);

  React.useEffect(() => {
    prefetchSectionImages(0);
  }, [prefetchSectionImages]);

  const renderSection = React.useCallback(
    ({ item, index }: { item: ExploreGridSection; index: number }) => {
      prefetchSectionImages(index + 1);

      return (
        <View>
          {item.layout === 'small-large-small' ? (
            <>
              <SmallImageGrid
                leftUri={item.smallLeft.thumbnail}
                rightUri={item.smallRight.thumbnail}
              />
              <LargeImageCard index={index * 3 + 1} uri={item.heroTop.thumbnail} />
              {item.heroBottom ? (
                <SmallImageGrid
                  leftUri={item.heroBottom.thumbnail}
                  rightUri={item.smallLeft.thumbnail}
                />
              ) : null}
            </>
          ) : (
            <>
              <LargeImageCard index={index * 3} uri={item.heroTop.thumbnail} />
              <SmallImageGrid leftUri={item.smallLeft.thumbnail} rightUri={item.smallRight.thumbnail} />
              {item.heroBottom ? (
                <LargeImageCard index={index * 3 + 2} uri={item.heroBottom.thumbnail} />
              ) : null}
            </>
          )}
        </View>
      );
    },
    [prefetchSectionImages],
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
