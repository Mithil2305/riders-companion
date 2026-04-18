import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export type ProfileSection = 'triumphs' | 'moments' | 'garage';

const sectionMap: Record<ProfileSection, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  triumphs: { label: 'Triumphs', icon: 'trophy-outline' },
  moments: { label: 'Moments', icon: 'grid-outline' },
  garage: { label: 'Garage', icon: 'home-outline' },
};

interface ProfileSectionTabsProps {
  activeSection: ProfileSection;
  onSelect: (section: ProfileSection) => void;
}

export function ProfileSectionTabs({ activeSection, onSelect }: ProfileSectionTabsProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        tabsWrap: {
          marginTop: metrics.xl,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderDark,
        },
        tabsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        tabButton: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: metrics.sm,
          gap: metrics.xs,
          flexDirection: 'row',
          borderBottomWidth: 3,
          borderBottomColor: 'transparent',
        },
        tabButtonActive: {
          borderBottomColor: colors.primary,
        },
        tabText: {
          fontSize: typography.sizes.sm,
          fontWeight: '500',
          color: colors.textSecondary,
        },
        tabTextActive: {
          color: colors.primary,
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.tabsWrap}>
      <View style={styles.tabsRow}>
        {(Object.keys(sectionMap) as ProfileSection[]).map((sectionKey) => (
          <Pressable
            key={sectionKey}
            onPress={() => onSelect(sectionKey)}
            style={[
              styles.tabButton,
              activeSection === sectionKey && styles.tabButtonActive,
            ]}
          >
            <Ionicons
              color={activeSection === sectionKey ? colors.primary : colors.textSecondary}
              name={sectionMap[sectionKey].icon}
              size={metrics.icon.md}
            />
            <Text style={[styles.tabText, activeSection === sectionKey && styles.tabTextActive]}>
              {sectionMap[sectionKey].label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
