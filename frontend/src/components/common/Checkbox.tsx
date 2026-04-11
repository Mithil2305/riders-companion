import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Checkbox({ label, checked, onToggle }: CheckboxProps) {
  const { colors, metrics, typography } = useTheme();
  const scale = useSharedValue(checked ? 1 : 0);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          minHeight: 48,
          alignItems: 'center',
          flexDirection: 'row',
          gap: metrics.sm,
        },
        box: {
          width: 24,
          height: 24,
          borderRadius: metrics.radius.sm,
          borderWidth: 1.5,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        boxChecked: {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },
        checkmark: {
          color: colors.textInverse,
          fontSize: 14,
          fontWeight: '700',
        },
        label: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
      }),
    [colors, metrics, typography],
  );

  React.useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, { damping: 12, stiffness: 210 });
  }, [checked, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Pressable style={styles.container} onPress={onToggle}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        <AnimatedView style={iconStyle}>
          <Text style={styles.checkmark}>✓</Text>
        </AnimatedView>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
