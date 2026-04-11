import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { FeedPostItem } from '../../types/feed';
import { IconButton } from '../common';

interface FeedPostProps {
  item: FeedPostItem;
  index: number;
  liked: boolean;
  onToggleLike: (postId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FeedPost({ item, index, liked, onToggleLike }: FeedPostProps) {
  const { colors, metrics, typography } = useTheme();
  const [imageLoading, setImageLoading] = React.useState(true);

  const imageScale = useSharedValue(1);
  const likeScale = useSharedValue(1);
  const likeProgress = useSharedValue(liked ? 1 : 0);

  React.useEffect(() => {
    likeProgress.value = withTiming(liked ? 1 : 0, { duration: 220 });
  }, [likeProgress, liked]);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const likeIconAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      likeProgress.value,
      [0, 1],
      [colors.icon, colors.primary],
    );

    return {
      color,
    };
  });

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          overflow: 'hidden',
          marginBottom: metrics.md,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
        },
        userInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        avatar: {
          width: metrics.avatar.md,
          height: metrics.avatar.md,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
        },
        username: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        time: {
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
        },
        mediaWrap: {
          width: '100%',
          height: metrics.screenWidth * 0.86,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        },
        media: {
          width: '100%',
          height: '100%',
        },
        imageLoading: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        actionsRow: {
          paddingHorizontal: metrics.sm,
          paddingTop: metrics.sm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        leftActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.xs,
        },
        likeButtonFrame: {
          width: metrics.button.md.height,
          height: metrics.button.md.height,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        metaWrap: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
          gap: metrics.xs,
        },
        likes: {
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        caption: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          lineHeight: typography.sizes.sm * typography.lineHeights.normal,
        },
        captionUser: {
          color: colors.textPrimary,
          fontWeight: '700',
        },
        comments: {
          color: colors.textTertiary,
          fontSize: typography.sizes.sm,
        },
      }),
    [colors, metrics, typography],
  );

  const likeCount = liked ? item.likes + 1 : item.likes;

  return (
    <Animated.View entering={FadeInDown.delay(index * 90).duration(360)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.username}>{item.user}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
        <IconButton icon="ellipsis-horizontal" size={metrics.icon.sm} />
      </View>

      <AnimatedPressable
        onPressIn={() => {
          imageScale.value = withSpring(1.03, { damping: 14, stiffness: 200 });
        }}
        onPressOut={() => {
          imageScale.value = withSpring(1, { damping: 14, stiffness: 200 });
        }}
        style={styles.mediaWrap}
      >
        <Animated.Image
          onLoadEnd={() => setImageLoading(false)}
          source={{ uri: item.image }}
          style={[styles.media, imageAnimatedStyle]}
        />

        {imageLoading ? (
          <View style={styles.imageLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </AnimatedPressable>

      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <AnimatedPressable
            onPress={() => {
              onToggleLike(item.id);
            }}
            onPressIn={() => {
              likeScale.value = withSpring(0.82, { damping: 10, stiffness: 320 });
            }}
            onPressOut={() => {
              likeScale.value = withSpring(1.05, { damping: 10, stiffness: 320 }, () => {
                likeScale.value = withSpring(1, { damping: 12, stiffness: 260 });
              });
            }}
            style={[styles.likeButtonFrame, likeAnimatedStyle]}
          >
            <Animated.Text style={likeIconAnimatedStyle}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={metrics.icon.md} />
            </Animated.Text>
          </AnimatedPressable>
          <IconButton icon="chatbubble-outline" size={metrics.icon.md} />
          <IconButton icon="paper-plane-outline" size={metrics.icon.md} />
        </View>
        <IconButton icon="bookmark-outline" size={metrics.icon.md} />
      </View>

      <View style={styles.metaWrap}>
        <Text style={styles.likes}>{likeCount} bumps</Text>
        <Text numberOfLines={2} style={styles.caption}>
          <Text style={styles.captionUser}>{item.user} </Text>
          {item.caption}
        </Text>
        <Text style={styles.comments}>View all comments</Text>
      </View>
    </Animated.View>
  );
}
