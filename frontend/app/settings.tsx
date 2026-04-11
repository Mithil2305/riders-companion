import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemeToggleButton } from '../src/components/common';
import { useTheme } from '../src/hooks/useTheme';
import type { ThemeMode } from '../src/contexts/ThemeContext';

const themeModes: ThemeMode[] = ['system', 'light', 'dark'];

export default function SettingsScreen() {
  const { colors, metrics, typography, mode, setMode } = useTheme();
  const router = useRouter();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          padding: metrics.lg,
          gap: metrics.lg,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        titleWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '700',
        },
        card: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: metrics.md,
          gap: metrics.md,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
        modesRow: {
          flexDirection: 'row',
          gap: metrics.sm,
        },
        modeChip: {
          minHeight: 40,
          borderRadius: metrics.radius.full,
          paddingHorizontal: metrics.md,
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
        },
        modeChipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        modeLabel: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textTransform: 'capitalize',
          fontWeight: '600',
        },
        modeLabelActive: {
          color: colors.textInverse,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.primary} name="arrow-back" size={24} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Ionicons color={colors.primary} name="settings-outline" size={22} />
            <Text style={styles.title}>Settings</Text>
          </View>
          <ThemeToggleButton />
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>Appearance</Text>
          </View>
          <Text style={styles.subtitle}>Choose system, light, or dark mode.</Text>
          <View style={styles.modesRow}>
            {themeModes.map((themeMode) => (
              <Pressable
                key={themeMode}
                onPress={() => {
                  void setMode(themeMode);
                }}
                style={[styles.modeChip, mode === themeMode && styles.modeChipActive]}
              >
                <Text style={[styles.modeLabel, mode === themeMode && styles.modeLabelActive]}>{themeMode}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
