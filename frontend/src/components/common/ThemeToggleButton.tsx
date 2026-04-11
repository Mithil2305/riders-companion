import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggleButton() {
  const { resolvedMode, colors, toggleMode } = useTheme();

  return (
    <Pressable
      onPress={() => {
        void toggleMode();
      }}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.surface }, pressed && styles.pressed]}
    >
      <Ionicons
        color={colors.primary}
        name={resolvedMode === 'dark' ? 'sunny-outline' : 'moon-outline'}
        size={20}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
