import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface SmallImageGridProps {
  leftUri: string;
  rightUri: string;
  onPressLeft?: () => void;
  onPressRight?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedImage = Animated.createAnimatedComponent(Image);

interface TileProps {
  uri: string;
  onPress?: () => void;
}

function SmallTile({ uri, onPress }: TileProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);
  const [loading, setLoading] = React.useState(true);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        tile: {
          flex: 1,
          height: 150,
          overflow: 'hidden',
          backgroundColor: colors.surface,
        },
        image: {
          width: '100%',
          height: '100%',
        },
        skeleton: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.surface,
          opacity: 0.85,
        }
      }),
    [colors.surface],
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 220 });
      }}
      style={[styles.tile, pressStyle]}
    >
      <AnimatedImage
        onLoadEnd={() => {
          setLoading(false);
          imageOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
        }}
        source={{ uri }}
        style={[styles.image, imageStyle]}
      />

      {loading ? <View style={styles.skeleton} /> : null}

    </AnimatedPressable>
  );
}

export function SmallImageGrid({
  leftUri,
  rightUri,
  onPressLeft,
  onPressRight,
}: SmallImageGridProps) {
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          width: '100%',
          flexDirection: 'row',
          gap: 3,
          marginVertical: 3,
        },
      }),
    [],
  );

  return (
    <View style={styles.row}>
      <SmallTile onPress={onPressLeft} uri={leftUri} />
      <SmallTile onPress={onPressRight} uri={rightUri} />
    </View>
  );
}
