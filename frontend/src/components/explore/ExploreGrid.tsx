import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

type BlockLayout = 'hero' | 'two-up' | 'three-up' | 'left-stack' | 'right-stack';

interface MosaicBlock {
  id: string;
  layout: BlockLayout;
  items: TrendingClip[];
}

const LAYOUT_SEQUENCE: BlockLayout[] = ['hero', 'left-stack', 'two-up', 'right-stack', 'three-up'];

function clipsNeeded(layout: BlockLayout) {
  if (layout === 'hero') {
    return 1;
  }
  if (layout === 'two-up') {
    return 2;
  }
  return 3;
}

function stableHash(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildMosaicBlocks(clips: TrendingClip[]): MosaicBlock[] {
  const blocks: MosaicBlock[] = [];
  let clipIndex = 0;
  let blockIndex = 0;

  while (clipIndex < clips.length) {
    const clip = clips[clipIndex];
    const randomSeed = `${clip.id}-${blockIndex}`;
    const randomIndex = stableHash(randomSeed) % LAYOUT_SEQUENCE.length;

    let layout = LAYOUT_SEQUENCE[randomIndex];
    let needed = clipsNeeded(layout);

    if (clipIndex + needed > clips.length) {
      if (clips.length - clipIndex >= 2) {
        layout = 'two-up';
        needed = 2;
      } else {
        layout = 'hero';
        needed = 1;
      }
    }

    const items = clips.slice(clipIndex, clipIndex + needed);
    blocks.push({
      id: `mosaic-${blockIndex}-${items.map((item) => item.id).join('-')}`,
      layout,
      items,
    });

    clipIndex += needed;
    blockIndex += 1;
  }

  return blocks;
}

interface TileProps {
  clip: TrendingClip;
  onPressClip: (clipId: string) => void;
  height: number;
  width?: any;
  marginRight?: number;
  marginBottom?: number;
}

function ExploreTile({
  clip,
  onPressClip,
  height,
  width = '100%',
  marginRight = 0,
  marginBottom = 0,
}: TileProps) {
  const { colors, metrics, typography } = useTheme();
  

  return (
    <Pressable
      onPress={() => onPressClip(clip.id)}
      style={{
        width,
        height,
        marginRight,
        marginBottom,
        overflow: 'hidden',
        backgroundColor: colors.surface,
      }}
    >
      <Image source={{ uri: clip.thumbnail }} style={stylesShared.media} />

      {clip.mediaType === 'video' ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: metrics.radius.sm,
            gap: 2,
          }}
        >
          <Ionicons color="#f8fafc" name="play" size={11} />
          <Text
            style={{
              color: '#f8fafc',
              fontSize: typography.sizes.xs,
              fontWeight: '700',
            }}
          >
            VIDEO
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const stylesShared = StyleSheet.create({
  media: {
    width: '100%',
    height: '100%',
  },
});

export function ExploreGrid({ clips, onEndReached, hasMore, isLoadingMore, onPressClip }: ExploreGridProps) {
  const { colors, metrics } = useTheme();
  const prefetched = React.useRef(new Set<string>());

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        list: {
          backgroundColor: colors.background,
          paddingHorizontal: metrics.xs,
          paddingBottom: metrics.lg,
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
    [colors.background, metrics.lg, metrics.md, metrics.xs],
  );

  const blocks = React.useMemo(() => buildMosaicBlocks(clips), [clips]);

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

  const renderBlock = React.useCallback(
    ({ item, index }: { item: MosaicBlock; index: number }) => {
      const gap = 1;
      const heroHeight = 258;
      const rowHeight = 186;
      const stackTallHeight = 236;
      const stackSmallHeight = (stackTallHeight - gap) / 2;

      prefetchClipImages(index * 2 + 1);

      if (item.layout === 'hero') {
        const clip = item.items[0];
        return (
          <View style={{ marginBottom: gap }}>
            <ExploreTile
              clip={clip}
              height={heroHeight}
              onPressClip={onPressClip}
            />
          </View>
        );
      }

      if (item.layout === 'two-up') {
        const left = item.items[0];
        const right = item.items[1];
        return (
          <View style={{ flexDirection: 'row', marginBottom: gap }}>
            <ExploreTile
              clip={left}
              height={rowHeight}
              marginRight={gap}
              onPressClip={onPressClip}
              width="50%"
            />
            <ExploreTile
              clip={right}
              height={rowHeight}
              onPressClip={onPressClip}
              width="50%"
            />
          </View>
        );
      }

      if (item.layout === 'three-up') {
        return (
          <View style={{ flexDirection: 'row', marginBottom: gap }}>
            {item.items.map((clip, itemIndex) => (
              <ExploreTile
                clip={clip}
                height={156}
                key={clip.id}
                marginRight={itemIndex < item.items.length - 1 ? gap : 0}
                onPressClip={onPressClip}
                width="33.333%"
              />
            ))}
          </View>
        );
      }

      const left = item.items[0];
      const topRight = item.items[1];
      const bottomRight = item.items[2];
      const isLeftStack = item.layout === 'left-stack';

      const leftTile = (
        <ExploreTile
          clip={left}
          height={stackTallHeight}
          marginRight={isLeftStack ? gap : 0}
          onPressClip={onPressClip}
          width="50%"
        />
      );

      const rightColumn = (
        <View style={{ width: '50%' }}>
          <ExploreTile
            clip={topRight}
            height={stackSmallHeight}
            marginBottom={gap}
            marginRight={isLeftStack ? 0 : gap}
            onPressClip={onPressClip}
            width="100%"
          />
          <ExploreTile
            clip={bottomRight}
            height={stackSmallHeight}
            marginRight={isLeftStack ? 0 : gap}
            onPressClip={onPressClip}
            width="100%"
          />
        </View>
      );

      return (
        <View style={{ flexDirection: 'row', marginBottom: gap }}>
          {isLeftStack ? (
            <>
              {leftTile}
              {rightColumn}
            </>
          ) : (
            <>
              {rightColumn}
              {leftTile}
            </>
          )}
        </View>
      );
    },
    [onPressClip, prefetchClipImages],
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
      style={{ flex: 1 }}
      contentContainerStyle={styles.list}
      data={blocks}
      keyExtractor={(item) => item.id}
      ListFooterComponent={footer}
      onEndReached={() => {
        if (hasMore && !isLoadingMore) {
          onEndReached();
        }
      }}
      onEndReachedThreshold={0.5}
      renderItem={renderBlock}
      showsVerticalScrollIndicator={false}
      windowSize={5}
    />
  );
}
