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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { TrendingClip } from '../../types/explore';

interface ClipCardProps {
  item: TrendingClip;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClipCard({ item, index }: ClipCardProps) {
  const { colors, metrics, typography } = useTheme();
  const scale = useSharedValue(1);
  const [loading, setLoading] = React.useState(true);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          borderRadius: metrics.radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        imageWrap: {
          aspectRatio: 1,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        },
        image: {
          width: '100%',
          height: '100%',
        },
        playOverlay: {
          position: 'absolute',
          width: metrics.avatar.md,
          height: metrics.avatar.md,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
        },
        loading: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
          padding: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(300)} style={styles.card}>
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 14, stiffness: 220 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        }}
        style={[styles.imageWrap, animatedStyle]}
      >
        <Image
          onLoadEnd={() => setLoading(false)}
          source={{ uri: item.thumbnail }}
          style={styles.image}
        />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.playOverlay}>
          <Ionicons color={colors.textInverse} name="play" size={metrics.icon.md} />
        </View>
      </AnimatedPressable>
      <Text numberOfLines={1} style={styles.title}>
        {item.title}
      </Text>
    </Animated.View>
  );
}
