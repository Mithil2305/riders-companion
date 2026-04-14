import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search riders or groups...' }: SearchBarProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginHorizontal: metrics.md,
          marginTop: metrics.sm,
          marginBottom: metrics.sm,
          minHeight: 46,
          borderRadius: 30,
          backgroundColor: colors.chatSearchBg,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.lg,
          gap: metrics.md,
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes['base'],
          paddingVertical: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      <Ionicons color={colors.icon} name="search" size={metrics.icon.md + 2} />
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        value={value}
      />
    </View>
  );
}