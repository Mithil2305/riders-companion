import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface GroupChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function GroupChatInputBar({ value, onChange, onSend }: GroupChatInputBarProps) {
  const { colors, metrics, typography } = useTheme();

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
        plusTap: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.chatComposerBg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        field: {
          flex: 1,
          minHeight: 56,
          borderRadius: 22,
          backgroundColor: colors.chatComposerBg,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: metrics.md,
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes['base'],
        },
        sendTap: {
          width: 48,
          height: 48,
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          shadowColor: colors.shadow,
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 12,
          elevation: 6,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <Pressable accessibilityLabel="Add attachment" style={styles.plusTap}>
        <Ionicons color={colors.icon} name="add" size={28} />
      </Pressable>

      <View style={styles.field}>
        <TextInput
          onChangeText={onChange}
          onSubmitEditing={onSend}
          placeholder="Send a message..."
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={value}
        />
      </View>

      <Pressable accessibilityLabel="Send message" onPress={onSend} style={styles.sendTap}>
        <Ionicons color={colors.textInverse} name="send" size={28} />
      </Pressable>
    </View>
  );
}
