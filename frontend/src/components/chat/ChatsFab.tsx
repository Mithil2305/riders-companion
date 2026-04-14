import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ChatsFabProps {
  onPress?: () => void;
}

export function ChatsFab({ onPress }: ChatsFabProps) {
  const { colors, metrics, resolvedMode } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          right: metrics.lg,
          bottom: metrics['2xl'] + metrics.md,
          width: 54,
          height: 54,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.shadow,
          shadowOpacity: resolvedMode === 'dark' ? 0.3 : 0.18,
          shadowRadius: 16,
          shadowOffset: {
            width: 0,
            height: 10,
          },
          elevation: 8,
        },
      }),
    [colors, metrics, resolvedMode],
  );

  return (
    <Pressable android_ripple={{ color: colors.overlayLight }} onPress={onPress} style={styles.container}>
      <MaterialCommunityIcons color={colors.textInverse} name="chat-plus" size={metrics.icon.lg} />
    </Pressable>
  );
}
