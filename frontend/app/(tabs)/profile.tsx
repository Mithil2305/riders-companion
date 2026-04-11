import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/common';
import { useTheme } from '../../src/hooks/useTheme';

export default function ProfileScreen() {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        topBar: {
          position: 'absolute',
          top: metrics.md + 20,
          right: metrics.md,
          zIndex: 10,
          shadowColor: colors.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.8,
          borderWidth: 2,
          borderRadius: metrics.radius.full,
          borderColor: colors.primary,
          shadowRadius: 4,
        },
        settingsButton: {
          width: metrics.button.md.height,
          height: metrics.button.md.height,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroImage: {
          width: '100%',
          height: 220,
        },
        content: {
          marginTop: -44,
          borderTopLeftRadius: metrics.radius.xl,
          borderTopRightRadius: metrics.radius.xl,
          backgroundColor: colors.background,
          padding: metrics.lg,
          gap: metrics.md,
        },
        avatar: {
          width: 90,
          height: 90,
          borderRadius: 45,
          borderWidth: 4,
          borderColor: colors.background,
          alignSelf: 'center',
          marginTop: -55,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes['3xl'],
          fontWeight: '700',
          textAlign: 'center',
        },
        handle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.xl,
          textAlign: 'center',
        },
        bio: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          textAlign: 'center',
        },
        statRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.lg,
        },
        statCard: {
          alignItems: 'center',
          gap: metrics.xs,
        },
        statNumber: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '700',
        },
        statLabel: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
        },
        section: {
          borderRadius: metrics.radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          padding: metrics.md,
          gap: metrics.sm,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.xl,
          fontWeight: '700',
        },
        sectionDesc: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={['left', 'right' , 'top']} style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            router.push('/settings');
          }}
          style={styles.settingsButton}
        >
          <Ionicons color={colors.primary} name="settings-outline" size={metrics.icon.md} />
        </Pressable>
      </View>
      <ScrollView style={styles.container}>
        <Image source={require('../../assets/images/hero.png')} style={styles.heroImage} />
        <View style={styles.content}>
        <Image source={require('../../assets/stickers/online-training.png')} style={styles.avatar} />
        <Text style={styles.name}>John Rider</Text>
        <Text style={styles.handle}>@johnrider</Text>
        <Text style={styles.bio}>Adventure seeker | Mountain lover | Group ride enthusiast</Text>

        <PrimaryButton onPress={() => {}} title="Edit Profile" />

        <View style={styles.statRow}>
          {[
            ['6', 'Moments'],
            ['5', 'Trackers'],
            ['3', 'Tracking'],
          ].map(([number, label]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statNumber}>{number}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons color={colors.primary} name="trophy-outline" size={20} />
              <Text style={styles.sectionTitle}>Miles Triumph</Text>
            </View>
            <Text style={styles.sectionDesc}>2847 KM total distance traveled. 57% to next milestone.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
