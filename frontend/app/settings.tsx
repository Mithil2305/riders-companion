import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import type { ThemeMode } from '../src/contexts/ThemeContext';
import { useSettingsOptions } from '../src/hooks/useSettingsOptions';
import { SettingsItem, ToggleSwitch } from '../src/components/settings';

const themeModes: ThemeMode[] = ['system', 'light', 'dark'];

export default function SettingsScreen() {
  const { colors, metrics, typography, mode, setMode } = useTheme();
  const router = useRouter();
  const {
    locationVisibility,
    accountItems,
    privacyItems,
    securityItems,
    actionItems,
    toggleLocationVisibility,
  } = useSettingsOptions();

  const handleSettingsItemPress = React.useCallback(
    (id: string) => {
      if (id === 'editProfile') {
        router.push('/setup/profile');
        return;
      }

      if (id === 'notificationPrefs') {
        router.push('/notifications');
      }
    },
    [router],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          paddingHorizontal: metrics.md,
        },
        content: {
          gap: metrics.lg,
          paddingTop: metrics.md,
          paddingBottom: metrics['3xl'],
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
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
        sectionWrap: {
          gap: metrics.sm,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        sectionCard: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: metrics.sm,
          gap: metrics.sm,
        },
        modeRow: {
          flexDirection: 'row',
          gap: metrics.sm,
          flexWrap: 'wrap',
        },
        modeChip: {
          minHeight: 48,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: metrics.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        modeChipActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },
        modeLabel: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
          textTransform: 'capitalize',
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Ionicons color={colors.primary} name="arrow-back" size={metrics.icon.md} />
            </Pressable>
            <View style={styles.titleWrap}>
              <Ionicons color={colors.primary} name="settings-outline" size={metrics.icon.md} />
              <Text style={styles.title}>Settings</Text>
            </View>
            <View style={{ width: metrics.icon.md }} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(280)} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.sectionCard}>
              <View style={styles.modeRow}>
                {themeModes.map((themeMode) => (
                  <Pressable
                    key={themeMode}
                    onPress={() => {
                      void setMode(themeMode);
                    }}
                    style={[styles.modeChip, mode === themeMode && styles.modeChipActive]}
                  >
                    <Text style={[styles.modeLabel, mode === themeMode && styles.modeLabelActive]}>
                      {themeMode}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(280)} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionCard}>
              {accountItems.map((item, index) => (
                <SettingsItem
                  icon={item.icon}
                  index={index}
                  key={item.id}
                  onPress={() => handleSettingsItemPress(item.id)}
                  subtitle={item.subtitle}
                  title={item.title}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(130).duration(280)} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.sectionCard}>
              {privacyItems.map((item, index) => (
                <SettingsItem
                  icon={item.icon}
                  index={index}
                  key={item.id}
                  rightContent={
                    <ToggleSwitch onToggle={toggleLocationVisibility} value={locationVisibility.value} />
                  }
                  subtitle={locationVisibility.subtitle}
                  title={locationVisibility.title}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(280)} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.sectionCard}>
              {securityItems.map((item, index) => (
                <SettingsItem
                  icon={item.icon}
                  index={index}
                  key={item.id}
                  subtitle={item.subtitle}
                  title={item.title}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(280)} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.sectionCard}>
              {actionItems.map((item, index) => (
                <SettingsItem
                  danger={Boolean(item.danger)}
                  icon={item.icon}
                  index={index}
                  key={item.id}
                  subtitle={item.subtitle}
                  title={item.title}
                />
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
