import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';


interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { colors, metrics, resolvedMode, typography } = useTheme();
  const isDark = resolvedMode === 'dark';

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        searchWrap: {
          height: 46,
          borderRadius: 24,
          backgroundColor: isDark ? '#2B2525' : '#F2F2F2',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
          gap: metrics.sm,
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          paddingVertical: 0,
        },
      }),
    [colors, isDark, metrics, typography],
  );

  return (
    <View style={styles.searchWrap}>
      <Ionicons color={colors.primary} name="search-outline" size={metrics.icon.md} />
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
