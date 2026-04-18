import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface EditProfileButtonProps {
  onPress: () => void;
}

export function EditProfileButton({ onPress }: EditProfileButtonProps) {
  const { colors, metrics, typography } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: metrics.button.md.height,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: metrics.sm,
          paddingHorizontal: metrics.md,
          alignSelf: 'center',
          backgroundColor: colors.primary,
        },
        text: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 14, stiffness: 260 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        }}
        style={styles.button}
      >
        <Ionicons color={colors.textInverse} name="pencil-outline" size={20} />
        <Text style={styles.text}>Edit Profile</Text>
      </Pressable>
    </Animated.View>
  );
}
