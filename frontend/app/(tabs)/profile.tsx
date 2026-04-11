import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState, PrimaryButton, SkeletonBlock } from '../../src/components/common';
import { BadgeItem, BikeCard, ProfileHeader, StatsCard } from '../../src/components/profile';
import { useProfileDashboardData } from '../../src/hooks/useProfileDashboardData';
import { useTheme } from '../../src/hooks/useTheme';

type ProfileSection = 'triumphs' | 'badges' | 'garage';

const sectionMap: Record<ProfileSection, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  triumphs: { label: 'Triumphs', icon: 'trophy-outline' },
  badges: { label: 'Badges', icon: 'ribbon-outline' },
  garage: { label: 'Garage', icon: 'speedometer-outline' },
};

export default function ProfileScreen() {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();
  const { loading, user, badges, bikes } = useProfileDashboardData();
  const [activeSection, setActiveSection] = React.useState<ProfileSection>('triumphs');

  const targetMiles = 2000;
  const progressMiles = Math.min(user.miles / targetMiles, 1);

  const stats = React.useMemo(
    () => [
      { key: 'miles', label: 'Total Miles', value: user.miles },
      { key: 'avgSpeed', label: 'Avg Speed', value: user.avgSpeed },
      { key: 'rides', label: 'Total Rides', value: user.rides },
    ],
    [user.avgSpeed, user.miles, user.rides],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          paddingBottom: metrics['3xl'],
        },
        topBar: {
          position: 'absolute',
          top: metrics.md + 20,
          right: metrics.md,
          zIndex: 20,
          flexDirection: 'row',
          gap: metrics.sm,
        },
        titleBar: {
          position: 'absolute',
          top: metrics.md + 28,
          left: metrics.md,
          zIndex: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.xs,
        },
        titleText: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '700',
        },
        iconButton: {
          width: 48,
          height: 48,
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
          marginTop: -40,
          borderTopLeftRadius: metrics.radius.xl,
          borderTopRightRadius: metrics.radius.xl,
          backgroundColor: colors.background,
          paddingHorizontal: metrics.md,
          paddingTop: metrics.lg,
          gap: metrics.md,
        },
        trackerRow: {
          flexDirection: 'row',
          gap: metrics.sm,
        },
        trackerButton: {
          flex: 1,
          minHeight: 48,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: metrics.xs,
        },
        trackerText: {
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        sectionTabs: {
          flexDirection: 'row',
          gap: metrics.sm,
        },
        sectionTab: {
          flex: 1,
          minHeight: 48,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: metrics.xs,
        },
        sectionTabActive: {
          borderColor: colors.primary,
          backgroundColor: colors.surface,
        },
        sectionTabLabel: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        sectionTabLabelActive: {
          color: colors.primary,
        },
        card: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: metrics.md,
          gap: metrics.md,
        },
        sectionTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.xl,
          fontWeight: '700',
        },
        hugeValue: {
          color: colors.primary,
          fontSize: typography.sizes['5xl'],
          fontWeight: '700',
          textAlign: 'center',
        },
        subText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          textAlign: 'center',
        },
        progressTrack: {
          height: 10,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        },
        progressFill: {
          height: '100%',
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
        },
        progressCaption: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
        },
        badgeGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: metrics.sm,
        },
        bikeList: {
          gap: metrics.sm,
        },
        addVehicle: {
          minHeight: 52,
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.border,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: metrics.sm,
          marginTop: metrics.xs,
        },
        addVehicleText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        skeletonHero: {
          width: '100%',
          height: 220,
          borderRadius: metrics.radius.lg,
        },
        skeletonAvatar: {
          width: metrics.avatar.xl + metrics.sm,
          height: metrics.avatar.xl + metrics.sm,
          borderRadius: metrics.radius.full,
          alignSelf: 'center',
          marginTop: -46,
        },
        skeletonLine: {
          height: 16,
          borderRadius: metrics.radius.md,
          marginTop: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  const renderSection = () => {
    if (activeSection === 'triumphs') {
      return (
        <Animated.View entering={FadeInDown.duration(250)} style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons color={colors.primary} name="trophy-outline" size={metrics.icon.md} />
            <Text style={styles.sectionTitle}>Miles Triumph</Text>
          </View>
          <Text style={styles.hugeValue}>{user.miles} KM</Text>
          <Text style={styles.subText}>Total Distance Traveled</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progressMiles * 100)}%` }]} />
          </View>
          <Text style={styles.progressCaption}>
            {Math.round(progressMiles * 100)}% to next milestone ({targetMiles} KM)
          </Text>
        </Animated.View>
      );
    }

    if (activeSection === 'badges') {
      return (
        <Animated.View entering={FadeInDown.duration(250)} style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons color={colors.primary} name="ribbon-outline" size={metrics.icon.md} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          <View style={styles.badgeGrid}>
            {badges.map((badge, index) => (
              <BadgeItem badge={badge} index={index} key={badge.id} />
            ))}
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.duration(250)} style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons color={colors.primary} name="speedometer-outline" size={metrics.icon.md} />
          <Text style={styles.sectionTitle}>Garage</Text>
        </View>
        {bikes.length === 0 ? (
          <EmptyState
            icon="speedometer-outline"
            subtitle="Start by adding your first ride to your garage."
            title="No bikes yet"
          />
        ) : (
          <View style={styles.bikeList}>
            {bikes.map((bike) => (
              <BikeCard
                bike={{
                  id: bike.id,
                  brand: bike.brand,
                  model: bike.model,
                  year: String(bike.year),
                  image: bike.image,
                }}
                key={bike.id}
              />
            ))}
          </View>
        )}
        <Pressable style={styles.addVehicle}>
          <Ionicons color={colors.textSecondary} name="add-circle-outline" size={metrics.icon.md} />
          <Text style={styles.addVehicleText}>Add Vehicle</Text>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['left', 'right', 'top']} style={styles.container}>
        <View style={styles.topBar}>
          <SkeletonBlock style={{ width: 48, height: 48, borderRadius: metrics.radius.full }} />
          <SkeletonBlock style={{ width: 48, height: 48, borderRadius: metrics.radius.full }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
          <SkeletonBlock style={styles.skeletonHero} />
          <View style={styles.content}>
            <SkeletonBlock style={styles.skeletonAvatar} />
            <SkeletonBlock style={[styles.skeletonLine, { width: '48%', alignSelf: 'center' }]} />
            <SkeletonBlock style={[styles.skeletonLine, { width: '36%', alignSelf: 'center' }]} />
            <SkeletonBlock style={[styles.skeletonLine, { width: '72%', alignSelf: 'center' }]} />
            <SkeletonBlock style={{ height: 54, borderRadius: metrics.radius.xl }} />
            <SkeletonBlock style={{ height: 114, borderRadius: metrics.radius.xl }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
          <Ionicons color={colors.primary} name="notifications-outline" size={metrics.icon.md} />
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} style={styles.iconButton}>
          <Ionicons color={colors.primary} name="settings-outline" size={metrics.icon.md} />
        </Pressable>
      </View>

      <View style={styles.titleBar}>
        <Ionicons color={colors.primary} name="person-circle-outline" size={metrics.icon.md} />
        <Text style={styles.titleText}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
        <Image source={{ uri: user.coverImage }} style={styles.heroImage} />
        <View style={styles.content}>
          <ProfileHeader user={user} />

          <PrimaryButton onPress={() => router.push('/setup/profile')} title="Edit Profile" />

          <StatsCard stats={stats} />

          <View style={styles.trackerRow}>
            <Pressable
              onPress={() => router.push('/tracking?tab=followers')}
              style={styles.trackerButton}
            >
              <Ionicons color={colors.primary} name="people-outline" size={metrics.icon.sm + 2} />
              <Text style={styles.trackerText}>Trackers</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/tracking?tab=following')}
              style={styles.trackerButton}
            >
              <Ionicons color={colors.primary} name="person-add-outline" size={metrics.icon.sm + 2} />
              <Text style={styles.trackerText}>Tracking</Text>
            </Pressable>
          </View>

          <View style={styles.sectionTabs}>
            {(Object.keys(sectionMap) as ProfileSection[]).map((sectionKey) => (
              <Pressable
                key={sectionKey}
                onPress={() => setActiveSection(sectionKey)}
                style={[
                  styles.sectionTab,
                  activeSection === sectionKey && styles.sectionTabActive,
                ]}
              >
                <Ionicons
                  color={activeSection === sectionKey ? colors.primary : colors.textSecondary}
                  name={sectionMap[sectionKey].icon}
                  size={metrics.icon.sm + 2}
                />
                <Text
                  style={[
                    styles.sectionTabLabel,
                    activeSection === sectionKey && styles.sectionTabLabelActive,
                  ]}
                >
                  {sectionMap[sectionKey].label}
                </Text>
              </Pressable>
            ))}
          </View>

          {renderSection()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
