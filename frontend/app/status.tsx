import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../src/hooks/useTheme';

export default function StatusScreen() {
  const router = useRouter();
  const { colors, metrics, typography } = useTheme();

  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderDark,
        },
        backTap: {
          marginRight: metrics.sm,
          padding: metrics.xs,
        },
        headerTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        body: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: metrics.xl,
          gap: metrics.lg,
        },
        iconWrap: {
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.primary,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '800',
          textAlign: 'center',
          letterSpacing: 0.5,
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          textAlign: 'center',
          lineHeight: 24,
          maxWidth: 280,
        },
        badge: {
          backgroundColor: colors.primary,
          paddingHorizontal: metrics.lg,
          paddingVertical: metrics.sm,
          borderRadius: metrics.radius.full,
        },
        badgeText: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <Animated.View entering={FadeInUp.delay(50).duration(250)}>
          <Ionicons
            color={colors.textPrimary}
            name="arrow-back"
            onPress={() => router.back()}
            size={metrics.icon.md}
            style={styles.backTap}
          />
        </Animated.View>
        <Text style={styles.headerTitle}>Stories</Text>
      </View>

      <View style={styles.body}>
        <Animated.View entering={FadeInUp.delay(100).springify().damping(14)}>
          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <Ionicons
              color={colors.primary}
              name="sparkles"
              size={52}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify().damping(14)}>
          <Text style={styles.title}>Coming Soon! 🚀</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify().damping(14)}>
          <Text style={styles.subtitle}>
            Stories are being crafted with love. Share your ride moments with
            friends — launching very soon!
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify().damping(14)}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>In Development</Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
