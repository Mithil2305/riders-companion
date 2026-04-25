import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  active?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({
  icon,
  onPress,
  active = false,
  size,
  style,
}: IconButtonProps) {
  const { colors, metrics } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        button: {
          width: metrics.button.md.height,
          height: metrics.button.md.height,
          borderRadius: metrics.radius.full,
          backgroundColor: active ? colors.primary : colors.surface,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [active, colors, metrics],
  );

  return (
    <AnimatedPressable
      android_ripple={{ color: colors.overlayLight }}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 12, stiffness: 240 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 240 });
      }}
      style={[styles.button, style, animatedStyle]}
    >
      <Ionicons
        color={active ? colors.textInverse : colors.icon}
        name={icon}
        size={size ?? metrics.icon.md}
      />
    </AnimatedPressable>
  );
}
