import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChangeText, onSend, disabled = false }: ChatInputProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.chatHeaderBackground,
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm + 2,
          paddingBottom: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        plusTap: {
          width: 44,
          height: 44,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.chatComposerButtonBg,
        },
        fieldWrap: {
          flex: 1,
          minHeight: 46,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.chatComposerBg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
        },
        iconTap: {
          width: metrics.icon.md,
          height: metrics.icon.md,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          marginRight: metrics.sm,
          paddingVertical: metrics.sm + 1,
        },
        sendTap: {
          width: 42,
          height: 42,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOpacity: 0.24,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 5,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.plusTap}>
        <Ionicons color={colors.icon} name="add" size={metrics.icon.md} />
      </Pressable>

      <View style={styles.fieldWrap}>
        <TextInput
          editable={!disabled}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
          placeholder="Message..."
          placeholderTextColor={colors.textTertiary}
          returnKeyType="send"
          style={styles.input}
          value={value}
        />

        <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.iconTap}>
          <Ionicons color={colors.icon} name="happy-outline" size={metrics.icon.md} />
        </Pressable>
      </View>

      <Pressable android_ripple={{ color: colors.overlayLight }} disabled={disabled} onPress={onSend} style={styles.sendTap}>
        <Ionicons color={colors.textInverse} name="send" size={metrics.icon.md} />
      </Pressable>
    </View>
  );
}