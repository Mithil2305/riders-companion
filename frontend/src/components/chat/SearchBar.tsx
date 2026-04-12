import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginHorizontal: metrics.md,
          marginTop: metrics.md,
          marginBottom: metrics.md,
          minHeight: 44,
          borderRadius: 24,
          backgroundColor: colors.chatSearchBg,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
          gap: metrics.sm,
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
    <View style={styles.root}>
      <Ionicons color={colors.icon} name="search" size={metrics.icon.md + 2} />
      <TextInput
        onChangeText={onChangeText}
        placeholder="Search"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        value={value}
      />
    </View>
  );
}