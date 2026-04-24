import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Story } from '../../types/feed';

interface StoryItemProps {
  item: Story;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StoryItem({ item }: StoryItemProps) {
  const { colors, metrics, typography } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: metrics.avatar.lg + metrics.md,
          alignItems: 'center',
          gap: metrics.xs,
        },
        ring: {
          width: metrics.avatar.lg,
          height: metrics.avatar.lg,
          borderRadius: metrics.radius.full,
          borderWidth: 2,
          borderColor: item.isAdd ? colors.primary : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        avatar: {
          width: metrics.avatar.md + metrics.sm,
          height: metrics.avatar.md + metrics.sm,
          borderRadius: metrics.radius.full,
        },
        addCircle: {
          width: metrics.avatar.md + metrics.sm,
          height: metrics.avatar.md + metrics.sm,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
        },
        name: {
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
          fontWeight: '600',
        },
      }),
    [colors, item.isAdd, metrics, typography],
  );

  return (
    <AnimatedPressable
      onPress={() => {
        Alert.alert('Stories — Coming Soon! 🚀', 'This feature is still being built. Stay tuned!');
      }}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 12, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={[styles.root, animatedStyle]}
    >
      <View style={styles.ring}>
        {item.isAdd ? (
          <View style={styles.addCircle}>
            <Ionicons color={colors.textInverse} name="add" size={metrics.icon.md} />
          </View>
        ) : (
          <Image
            source={{ uri: item.avatar ?? 'https://i.pravatar.cc/150?img=9' }}
            style={styles.avatar}
          />
        )}
      </View>
      <Text numberOfLines={1} style={styles.name}>
        {item.name}
      </Text>
    </AnimatedPressable>
  );
}
