import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../src/hooks/useTheme';
import { lightTheme } from '../src/theme/light';
import { hasSeenOnboarding } from '../src/utils/deviceFlags';

function withAlpha(color: string, alpha: number) {
  if (!color.startsWith('#') || (color.length !== 7 && color.length !== 9)) {
    return color;
  }

  const hex = color.slice(1, 7);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function SplashScreen() {
  const { metrics, typography } = useTheme();
  const colors = lightTheme.colors;
  const router = useRouter();
  const overlayOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const logoShift = useSharedValue(-12);
  const fogShift = useSharedValue(0);
  const bikeShake = useSharedValue(0);
  const progress = useSharedValue(0);
  const pulse = useSharedValue(0.2);

  const isDark = false;

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        backgroundGradient: {
          ...StyleSheet.absoluteFillObject,
        },
        fogLayer: {
          position: 'absolute',
          width: metrics.screenWidth * 1.15,
          height: 150,
          borderRadius: metrics.radius.full,
          backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.12),
          top: metrics.screenHeight * 0.23,
          left: -metrics.md,
        },
        fogLayerSecondary: {
          top: metrics.screenHeight * 0.32,
          left: metrics.md,
          backgroundColor: withAlpha(colors.primary, isDark ? 0.12 : 0.08),
        },
        content: {
          flex: 1,
          paddingHorizontal: metrics.lg,
          justifyContent: 'space-between',
          paddingTop: metrics['2xl'],
          paddingBottom: metrics.lg,
        },
        heroWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          gap: metrics.md,
          marginTop: metrics.xl,
        },
        radialGlow: {
          position: 'absolute',
          width: 290,
          height: 290,
          borderRadius: metrics.radius.full,
          backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.1),
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isDark ? 0.42 : 0.2,
          shadowRadius: 36,
        },
        bikeCard: {
          width: 260,
          height: 210,
          borderRadius: metrics.radius.xl,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: withAlpha(colors.surface, isDark ? 0.72 : 0.9),
          borderWidth: 1,
          borderColor: withAlpha(colors.borderDark, isDark ? 0.8 : 1),
          overflow: 'hidden',
        },
        wheelShadow: {
          position: 'absolute',
          bottom: metrics.md,
          width: 170,
          height: 18,
          borderRadius: metrics.radius.full,
          backgroundColor: withAlpha(colors.shadow, isDark ? 0.25 : 0.14),
        },
        bikeAnimation: {
          width: 220,
          height: 170,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['4xl'],
          fontWeight: '700',
          letterSpacing: 1.4,
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          letterSpacing: 0.5,
        },
        footer: {
          gap: metrics.sm,
        },
        progressTrack: {
          width: '100%',
          height: 4,
          borderRadius: metrics.radius.full,
          overflow: 'hidden',
          backgroundColor: colors.spinnerTrack,
        },
        progressFill: {
          height: '100%',
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 12,
          elevation: 4,
        },
      }),
    [colors, isDark, metrics, typography],
  );

  React.useEffect(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    overlayOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) });
    logoOpacity.value = withDelay(220, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    logoScale.value = withDelay(220, withTiming(1, { duration: 850, easing: Easing.out(Easing.exp) }));
    logoShift.value = withDelay(120, withTiming(0, { duration: 980, easing: Easing.out(Easing.exp) }));
    fogShift.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true);
    bikeShake.value = withDelay(
      180,
      withSequence(
        withTiming(-2, { duration: 46 }),
        withTiming(2, { duration: 46 }),
        withTiming(-1, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      ),
    );
    progress.value = withTiming(1, { duration: 4200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    pulse.value = withRepeat(withTiming(1, { duration: 860, easing: Easing.inOut(Easing.quad) }), -1, true);

    const timer = setTimeout(() => {
      const routeAfterSplash = async () => {
        try {
          const seenOnboarding = await hasSeenOnboarding();

          if (seenOnboarding) {
            router.replace('/auth/login');
            return;
          }

          router.replace('/onboarding');
        } catch {
          router.replace('/onboarding');
        }
      };

      void routeAfterSplash();
    }, 4500);

    return () => clearTimeout(timer);
  }, [bikeShake, fogShift, logoOpacity, logoScale, logoShift, overlayOpacity, progress, pulse, router]);

  const fogStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -24 + fogShift.value * 48 }],
    opacity: 0.55 + fogShift.value * 0.2,
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoShift.value }, { translateX: bikeShake.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.max(8, progress.value * 100)}%`,
    opacity: 0.7 + pulse.value * 0.25,
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const gradientColors: [string, string, string] = isDark
    ? [colors.background, withAlpha(colors.primary, 0.14), colors.background]
    : [withAlpha(colors.background, 0.9), colors.surface, colors.background];

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <Animated.View style={[styles.backgroundGradient, gradientStyle]}>
        <LinearGradient
          colors={gradientColors}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.backgroundGradient}
        />
      </Animated.View>

      <Animated.View style={[styles.fogLayer, fogStyle]} />
      <Animated.View style={[styles.fogLayer, styles.fogLayerSecondary, fogStyle]} />

      <View style={styles.content}>
        <Animated.View style={[styles.heroWrap, heroStyle]}>
          <View style={styles.radialGlow} />
          <View style={styles.bikeCard}>
            <View style={styles.wheelShadow} />
            <Image source={require('../assets/gif/rider.gif')} style={styles.bikeAnimation} />
          </View>

          <Text style={styles.title}>RIDER</Text>
          <Text style={styles.subtitle}>Ride. Track. Stay Safe.</Text>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
