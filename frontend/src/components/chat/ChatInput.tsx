import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}

export function ChatInput({ value, onChangeText, onSend }: ChatInputProps) {
  const { colors, metrics, typography } = useTheme();
  const focusScale = useSharedValue(1);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm,
          paddingBottom: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        fieldWrap: {
          flex: 1,
          minHeight: 48,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.chatComposerBg,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.sm,
        },
        iconTap: {
          width: metrics.icon.lg,
          height: metrics.icon.lg,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          marginHorizontal: metrics.xs,
          paddingVertical: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  const fieldAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: focusScale.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.fieldWrap, fieldAnimatedStyle]}>
        <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.iconTap}>
          <Ionicons color={colors.icon} name="happy-outline" size={metrics.icon.lg} />
        </Pressable>

        <TextInput
          onBlur={() => {
            focusScale.value = withTiming(1, { duration: 180 });
          }}
          onChangeText={onChangeText}
          onFocus={() => {
            focusScale.value = withTiming(1.02, { duration: 180 });
          }}
          onSubmitEditing={onSend}
          placeholder="Message..."
          placeholderTextColor={colors.textTertiary}
          returnKeyType="send"
          style={styles.input}
          value={value}
        />

        <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.iconTap}>
          <Ionicons color={colors.icon} name="images-outline" size={metrics.icon.lg} />
        </Pressable>
        <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.iconTap}>
          <Ionicons color={colors.icon} name="camera-outline" size={metrics.icon.lg} />
        </Pressable>
        <Pressable android_ripple={{ color: colors.overlayLight }} onPress={onSend} style={styles.iconTap}>
          <Ionicons color={colors.primary} name={value.trim() ? 'send' : 'mic-outline'} size={metrics.icon.lg} />
        </Pressable>
      </Animated.View>
    </View>
  );
}