import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState, SkeletonBlock } from '../../src/components/common';
import {
  EditProfileButton,
  GarageList,
  MilesTriumphCard,
  MomentsGrid,
  ProfileIdentity,
  ProfileSection,
  ProfileSectionTabs,
  ProfileStatKey,
  ProfileStatsRow,
} from '../../src/components/profile';
import { useProfileDashboardData } from '../../src/hooks/useProfileDashboardData';
import { useTheme } from '../../src/hooks/useTheme';

const MILESTONE_TARGET = 5000;

export default function ProfileScreen() {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();
  const { loading, user, bikes } = useProfileDashboardData();
  const [activeSection, setActiveSection] = React.useState<ProfileSection>('triumphs');
  const totalDistance = user.miles;
  const profileDisplayName = user.name.trim().length > 0 ? user.name : 'Rider';
  const profileDisplayUsername = user.username.startsWith('@') ? user.username : `@${user.username}`;
  const profileDisplayBio =
    user.bio.trim().length > 0
      ? user.bio
      : 'Set up your profile bio to share your riding style and favorite routes.';

  const stats: { key: ProfileStatKey; label: string; value: number }[] = [
    { key: 'moments', label: 'Moments', value: bikes.length + 1 },
    { key: 'trackers', label: 'Trackers', value: bikes.length },
    { key: 'tracking', label: 'Tracking', value: user.rides },
  ];

  const progressMiles = Math.min(totalDistance / MILESTONE_TARGET, 1);
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    progressValue.value = withTiming(progressMiles, { duration: 850 });
  }, [progressMiles, progressValue]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progressValue.value * 100)}%`,
  }));

  const momentImages = React.useMemo(() => {
    const sourceImages = [user.coverImage, ...bikes.map((bike) => bike.image)].filter((item) => item.length > 0);

    if (sourceImages.length === 0) {
      return [];
    }

    return Array.from({ length: 6 }, (_, index) => sourceImages[index % sourceImages.length]);
  }, [bikes, user.coverImage]);

  const handleStatPress = React.useCallback(
    (statKey: ProfileStatKey) => {
      if (statKey === 'trackers') {
        router.push('/tracking?tab=trackers');
        return;
      }

      if (statKey === 'tracking') {
        router.push('/tracking?tab=tracking');
      }
    },
    [router],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
          backgroundColor: colors.background,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.borderDark,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        headerTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
        },
        settingsButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        },
        scrollContent: {
          paddingBottom: metrics['3xl'],
        },
        content: {
        },
        sectionContent: {
          marginTop: metrics.lg,
          marginHorizontal: metrics.sm,
        },
        skeletonCover: {
          width: '100%',
          height: 205,
        },
        skeletonAvatar: {
          width: 104,
          height: 104,
          borderRadius: metrics.radius.full,
          alignSelf: 'center',
          marginTop: -52,
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
        <Animated.View entering={FadeInRight.duration(240)}>
          <MilesTriumphCard
            animatedProgressStyle={animatedProgressStyle}
            milestoneTarget={MILESTONE_TARGET}
            progressMiles={progressMiles}
            totalDistance={totalDistance}
          />
        </Animated.View>
      );
    }

    if (activeSection === 'moments') {
      return (
        <Animated.View entering={FadeInRight.duration(240)}>
          <MomentsGrid images={momentImages} />
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInRight.duration(240)}>
        {bikes.length === 0 ? (
          <EmptyState
            icon="speedometer-outline"
            subtitle="Start by adding your first ride to your garage."
            title="No bikes yet"
          />
        ) : (
          <GarageList
            bikes={bikes.map((bike) => ({
              id: bike.id,
              image: bike.image,
              model: `${bike.brand} ${bike.model} V${bike.year > 2021 ? 4 : 1}`,
            }))}
          />
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <SkeletonBlock style={{ width: 150, height: 28, borderRadius: metrics.radius.md }} />
          <SkeletonBlock style={{ width: 36, height: 36, borderRadius: metrics.radius.full }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
          <SkeletonBlock style={styles.skeletonCover} />
          <SkeletonBlock style={styles.skeletonAvatar} />
          <View style={styles.content}>
            <SkeletonBlock style={[styles.skeletonLine, { width: '48%', alignSelf: 'center' }]} />
            <SkeletonBlock style={[styles.skeletonLine, { width: '36%', alignSelf: 'center' }]} />
            <SkeletonBlock style={[styles.skeletonLine, { width: '72%', alignSelf: 'center' }]} />
            <SkeletonBlock style={{ height: 44, width: '68%', alignSelf: 'center', borderRadius: 24 }} />
            <SkeletonBlock style={{ height: 92, borderRadius: metrics.radius.xl, marginTop: metrics.xl }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons color={colors.primary} name="person-circle-outline" size={metrics.icon.md + 4} />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
          <Ionicons color={colors.textPrimary} name="settings-outline" size={metrics.icon.md + 2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
        <View style={styles.content}>
          <ProfileIdentity
            avatar={user.avatar}
            bio={profileDisplayBio}
            coverImage={user.coverImage}
            name={profileDisplayName}
            username={profileDisplayUsername}
          />

          <View style={{ marginTop: metrics.md }}>
            <EditProfileButton onPress={() => router.push('/setup/profile?mode=edit')} />
          </View>

          <ProfileStatsRow onPressStat={handleStatPress} stats={stats} />

          <ProfileSectionTabs activeSection={activeSection} onSelect={setActiveSection} />

          <Animated.View entering={FadeInDown.duration(220)} style={styles.sectionContent}>
            {renderSection()}
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
