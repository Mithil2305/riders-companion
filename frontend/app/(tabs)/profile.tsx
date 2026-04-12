import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState, SkeletonBlock } from '../../src/components/common';
import { useProfileDashboardData } from '../../src/hooks/useProfileDashboardData';
import { useTheme } from '../../src/hooks/useTheme';

type ProfileSection = 'triumphs' | 'moments' | 'garage';

const sectionMap: Record<ProfileSection, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  triumphs: { label: 'Triumphs', icon: 'trophy-outline' },
  moments: { label: 'Moments', icon: 'grid-outline' },
  garage: { label: 'Garage', icon: 'home-outline' },
};

const DISPLAY_NAME = 'John Rider';
const DISPLAY_USERNAME = '@johnrider';
const DISPLAY_BIO = 'Adventure seeker | Mountain lover | Group ride enthusiast';
const STATS = [
  { key: 'moments', label: 'Moments', value: 6 },
  { key: 'trackers', label: 'Trackers', value: 5 },
  { key: 'tracking', label: 'Tracking', value: 3 },
];
const TOTAL_DISTANCE = 2847;
const MILESTONE_TARGET = 5000;
type StatKey = 'moments' | 'trackers' | 'tracking';

function EditProfileButton({ onPress }: { onPress: () => void }) {
  const { colors, metrics, typography } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: metrics.button.md.height,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: metrics.sm,
          paddingHorizontal: metrics.md,
          alignSelf: 'center',
          backgroundColor: colors.primary,
        },
        text: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 14, stiffness: 260 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        }}
        style={styles.button}
      >
        <Ionicons color={colors.textInverse} name="pencil-outline" size={20} />
        <Text style={styles.text}>Edit Profile</Text>
      </Pressable>
    </Animated.View>
  );
}

function MomentsGrid({ images }: { images: string[] }) {
  const { colors, metrics } = useTheme();
  const [loadedState, setLoadedState] = React.useState<Record<string, boolean>>({});

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: metrics.sm,
          marginTop: metrics.sm,
        },
        tile: {
          width: '31.8%',
          aspectRatio: 1,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.surface,
        },
        image: {
          width: '100%',
          height: '100%',
        },
        placeholder: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.surface,
        },
      }),
    [colors, metrics],
  );

  return (
    <View style={styles.wrap}>
      {images.map((uri, index) => {
        const key = `${uri}-${index}`;

        return (
          <View key={key} style={styles.tile}>
            <Image
              onLoadEnd={() => setLoadedState((prev) => ({ ...prev, [key]: true }))}
              source={{ uri }}
              style={styles.image}
            />
            {!loadedState[key] && <Animated.View entering={FadeIn.duration(180)} style={styles.placeholder} />}
          </View>
        );
      })}
    </View>
  );
}

function GarageList({ bikes }: { bikes: { id: string; image: string; model: string }[] }) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        list: {
          gap: metrics.md,
          marginTop: metrics.sm,
        },
        card: {
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        image: {
          width: 76,
          height: 76,
          borderRadius: 12,
          backgroundColor: colors.surface,
        },
        content: {
          flex: 1,
          gap: metrics.xs,
        },
        nickname: {
          color: colors.primary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        model: {
          color: colors.textPrimary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        action: {
          width: 46,
          height: 46,
          borderRadius: 23,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
        },
        addCard: {
          minHeight: 86,
          borderRadius: 14,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: metrics.sm,
        },
        addText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
      }),
    [colors, metrics, typography],
  );

  const nicknameMap = ['Lightning Bolt', 'Thunder Beast'];

  return (
    <View style={styles.list}>
      {bikes.map((bike, index) => (
        <Pressable
          key={bike.id}
          style={({ pressed }) => [
            styles.card,
            pressed && {
              shadowColor: colors.shadow,
              shadowOpacity: 0.12,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        >
          <Image source={{ uri: bike.image }} style={styles.image} />
          <View style={styles.content}>
            <Text style={styles.nickname}>{`🏷️ ${nicknameMap[index] ?? bike.model}`}</Text>
            <Text style={styles.model}>{bike.model}</Text>
          </View>
          <Pressable style={styles.action}>
            <Ionicons color={colors.textInverse} name="newspaper-outline" size={22} />
          </Pressable>
        </Pressable>
      ))}

      <Pressable style={styles.addCard}>
        <Ionicons color={colors.textSecondary} name="file-tray-outline" size={30} />
        <Text style={styles.addText}>Add Vehicle</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();
  const { loading, user, bikes } = useProfileDashboardData();
  const [activeSection, setActiveSection] = React.useState<ProfileSection>('triumphs');

  const progressMiles = Math.min(TOTAL_DISTANCE / MILESTONE_TARGET, 1);
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

  const stats = STATS;

  const handleStatPress = React.useCallback(
    (statKey: StatKey) => {
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
        coverImage: {
          width: '100%',
          height: 160,
        },
        avatar: {
          width: 102,
          height: 102,
          borderRadius: 51,
          borderWidth: 4,
          borderColor: colors.textInverse,
          alignSelf: 'center',
          marginTop: -51,
          backgroundColor: colors.surface,
        },
        content: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
        },
        identityBlock: {
          alignItems: 'center',
          gap: metrics.sm,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
          textAlign: 'center',
          marginTop: metrics.md,
        },
        username: {
          color: colors.textSecondary,
          fontSize: typography.sizes.lg,
          textAlign: 'center',
        },
        bio: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
          lineHeight: typography.sizes.lg * 1.45,
          maxWidth: '88%',
        },
        statsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: metrics.xl,
        },
        statItem: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 56,
          borderRadius: metrics.radius.md,
        },
        statItemPressed: {
          backgroundColor: colors.surface,
        },
        statValue: {
          color: colors.textPrimary,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
        },
        statLabel: {
          marginTop: metrics.xs,
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
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
        sectionContent: {
          marginTop: metrics.lg,
        },
        card: {
          paddingHorizontal: 0,
          gap: metrics.md,
        },
        sectionTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
        },
        hugeValue: {
          color: colors.primary,
          fontSize: 40,
          fontWeight: '700',
          textAlign: 'center',
          marginTop: metrics.md,
        },
        subText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
        },
        progressTrack: {
          marginTop: metrics.lg,
          height: 9,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          width: '54%',
          alignSelf: 'center',
        },
        progressFill: {
          height: '100%',
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
        },
        progressCaption: {
          marginTop: metrics.sm,
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          textAlign: 'center',
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
        <Animated.View entering={FadeInRight.duration(240)} style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons color={colors.primary} name="trophy-outline" size={metrics.icon.md} />
            <Text style={styles.sectionTitle}>Miles Triumph</Text>
          </View>
          <Text style={styles.hugeValue}>{TOTAL_DISTANCE} KM</Text>
          <Text style={styles.subText}>Total Distance Traveled</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
          </View>
          <Text style={styles.progressCaption}>
            {Math.round(progressMiles * 100)}% to next milestone ({MILESTONE_TARGET} KM)
          </Text>
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
      <SafeAreaView edges={['left', 'right', 'top']} style={styles.container}>
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
        <Image source={{ uri: user.coverImage }} style={styles.coverImage} />
        <Image source={{ uri: user.avatar }} style={styles.avatar} />

        <View style={styles.content}>
          <View style={styles.identityBlock}>
            <Text style={styles.name}>{DISPLAY_NAME}</Text>
            <Text style={styles.username}>{DISPLAY_USERNAME}</Text>
            <Text style={styles.bio}>{DISPLAY_BIO}</Text>
          </View>

          <View style={{ marginTop: metrics.lg }}>
            <EditProfileButton onPress={() => router.push('/setup/profile')} />
          </View>

          <View style={styles.statsRow}>
            {stats.map((item) => (
              <Pressable
                key={item.key}
                disabled={item.key === 'moments'}
                onPress={() => handleStatPress(item.key as StatKey)}
                style={({ pressed }) => [
                  styles.statItem,
                  pressed && item.key !== 'moments' && styles.statItemPressed,
                ]}
              >
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.tabsWrap}>
            <View style={styles.tabsRow}>
              {(Object.keys(sectionMap) as ProfileSection[]).map((sectionKey) => (
                <Pressable
                  key={sectionKey}
                  onPress={() => setActiveSection(sectionKey)}
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
                  <Text
                    style={[styles.tabText, activeSection === sectionKey && styles.tabTextActive]}
                  >
                    {sectionMap[sectionKey].label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Animated.View entering={FadeInDown.duration(220)} style={styles.sectionContent}>
            {renderSection()}
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
