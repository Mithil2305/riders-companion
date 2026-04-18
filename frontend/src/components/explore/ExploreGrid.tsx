import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { TrendingClip } from '../../types/explore';
import { useTheme } from '../../hooks/useTheme';

interface ExploreGridProps {
  clips: TrendingClip[];
  onEndReached: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onPressClip: (clipId: string) => void;
}

const PREFETCH_AHEAD = 2;

function getItemHeight(index: number) {
  const pattern = [132, 168, 204, 156, 184, 148];
  return pattern[index % pattern.length];
}

export function ExploreGrid({ clips, onEndReached, hasMore, isLoadingMore, onPressClip }: ExploreGridProps) {
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

  const prefetchClipImages = React.useCallback((startIndex: number) => {
    for (let i = startIndex; i <= startIndex + PREFETCH_AHEAD * 6; i += 1) {
      const clip = clips[i];
      if (!clip) {
        continue;
      }

      const uri = clip.thumbnail;
      if (prefetched.current.has(uri)) {
        continue;
      }

      prefetched.current.add(uri);
      void Image.prefetch(uri);
    }
  }, [clips]);

  React.useEffect(() => {
    prefetchClipImages(0);
  }, [prefetchClipImages]);

  const renderClip = React.useCallback(
    ({ item, index }: { item: TrendingClip; index: number }) => {
      prefetchClipImages(index + 1);

      return (
        <Pressable
          onPress={() => onPressClip(item.id)}
          style={{
            width: '33.333%',
            paddingHorizontal: 2,
            paddingVertical: 2,
          }}
        >
          <Image
            source={{ uri: item.thumbnail }}
            style={{
              width: '100%',
              height: getItemHeight(index),
              borderRadius: metrics.radius.md,
              backgroundColor: colors.surface,
            }}
          />
        </Pressable>
      );
    },
    [colors.surface, metrics.radius.md, onPressClip, prefetchClipImages],
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
      data={clips}
      keyExtractor={(item) => item.id}
      ListFooterComponent={footer}
      numColumns={3}
      onEndReached={() => {
        if (hasMore && !isLoadingMore) {
          onEndReached();
        }
      }}
      onEndReachedThreshold={0.5}
      renderItem={renderClip}
      showsVerticalScrollIndicator={false}
      windowSize={5}
    />
  );
}
