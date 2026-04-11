import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { colors, metrics, typography } = useTheme();
  const focused = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused.value ? 1.015 : 1, { damping: 16, stiffness: 180 }) }],
    borderColor: focused.value ? colors.primary : colors.border,
    shadowOpacity: withTiming(focused.value ? 0.28 : 0, { duration: 180 }),
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        searchWrap: {
          minHeight: metrics.inputHeight,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
          gap: metrics.sm,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowRadius: 20,
          elevation: 4,
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          paddingVertical: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <AnimatedView style={[styles.searchWrap, animatedStyle]}>
      <Ionicons color={colors.textTertiary} name="search-outline" size={metrics.icon.md} />
      <TextInput
        onBlur={() => {
          focused.value = 0;
        }}
        onChangeText={onChangeText}
        onFocus={() => {
          focused.value = 1;
        }}
        placeholder="Search riders, rooms, clips"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        value={value}
      />
    </AnimatedView>
  );
}
