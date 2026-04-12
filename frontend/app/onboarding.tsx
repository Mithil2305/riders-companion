import React from 'react';
import { Image, Pressable, StyleSheet, Text, type ImageSourcePropType, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../src/components/common';
import { useTheme } from '../src/hooks/useTheme';
import { lightTheme } from '../src/theme/light';
import { markOnboardingSeen } from '../src/utils/deviceFlags';

type Slide = {
  key: 'track' | 'together' | 'safe';
  title: string;
  subtitle: string;
  detail: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const slides: Slide[] = [
  {
    key: 'track',
    title: 'Track Your Ride',
    subtitle: 'Track every ride in real-time',
    detail: 'See speed, distance and live location.',
    icon: 'navigate',
  },
  {
    key: 'together',
    title: 'Ride Together',
    subtitle: 'Join rooms and ride with friends',
    detail: 'Stay connected with live chat and tracking.',
    icon: 'people',
  },
  {
    key: 'safe',
    title: 'Secure and Private',
    subtitle: 'Smart security features',
    detail: 'Safeguard your data with end-to-end encryption and secure authentication.',
    icon: 'shield-checkmark',
  },
];

const slideGifs: Record<Slide['key'], ImageSourcePropType> = {
  track: require('../assets/gif/track.gif'),
  together: require('../assets/gif/together.gif'),
  safe: require('../assets/gif/safe.gif'),
};

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

export default function OnboardingScreen() {
  const { metrics, typography } = useTheme();
  const colors = lightTheme.colors;
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const pulse = useSharedValue(0.25);
  const drift = useSharedValue(0);

  const isDark = false;

  React.useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true);
    drift.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true);

    // Mark as seen as soon as onboarding is opened so it only appears once per device.
    void markOnboardingSeen();
  }, [drift, pulse]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
          paddingHorizontal: metrics.lg,
          paddingTop: metrics.lg,
          paddingBottom: metrics.lg,
          justifyContent: 'space-between',
        },
        progressTop: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: metrics.sm,
        },
        slider: {
          gap: metrics.xl,
          width: '100%',
        },
        card: {
          width: width - metrics.lg * 2,
          borderRadius: 24,
          padding: metrics.md,
          borderWidth: 1,
          borderColor: withAlpha(colors.borderDark, 0.9),
          backgroundColor: withAlpha(colors.surface, isDark ? 0.66 : 0.84),
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.24 : 0.12,
          shadowRadius: 18,
          elevation: 4,
          gap: metrics.md,
        },
        mediaWrap: {
          height: 230,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: withAlpha(colors.primary, isDark ? 0.55 : 0.24),
          backgroundColor: withAlpha(colors.card, isDark ? 0.72 : 0.88),
        },
        mediaGradient: {
          ...StyleSheet.absoluteFillObject,
        },
        mediaGlow: {
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: metrics.radius.full,
          backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1),
        },
        mediaImage: {
          width: 210,
          height: 170,
        },
        badge: {
          position: 'absolute',
          top: metrics.md,
          right: metrics.md,
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: withAlpha(colors.primary, 0.84),
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '700',
        },
        subtitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '600',
        },
        detail: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
        },
        dotsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: metrics.sm,
          marginTop: metrics.md,
        },
        dot: {
          width: 9,
          height: 9,
          borderRadius: metrics.radius.full,
          backgroundColor: withAlpha(colors.textSecondary, 0.34),
        },
        activeDot: {
          width: 26,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
        },
        ctaWrap: {
          gap: metrics.sm,
        },
        skipBtn: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 42,
        },
        skipText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '600',
        },
      }),
    [colors, isDark, metrics, typography, width],
  );

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.3,
    transform: [{ scale: 0.9 + pulse.value * 0.1 }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    width: `${40 + drift.value * 42}%`,
    opacity: 0.5 + pulse.value * 0.3,
  }));

  const fenceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + pulse.value * 0.1 }],
    opacity: 0.28 + pulse.value * 0.2,
  }));

  const moveTo = (next: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    setIndex(clamped);
  };

  const onPrimaryPress = () => {
    if (index === slides.length - 1) {
      router.replace('/auth/login');
      return;
    }

    moveTo(index + 1);
  };

  const onSkip = () => {
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.slider}>
          <View>
            <View style={styles.card}>
              <View style={styles.mediaWrap}>
                <Image source={slideGifs[slides[index].key]} style={styles.mediaImage} />
                <View style={styles.badge}>
                  <Ionicons color={colors.buttonPrimaryText} name={slides[index].icon} size={18} />
                </View>

                {slides[index].key === 'track' ? (
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        bottom: metrics.md,
                        left: metrics.md,
                        height: 4,
                        borderRadius: metrics.radius.full,
                        backgroundColor: colors.primary,
                      },
                      lineStyle,
                    ]}
                  />
                ) : null}

                {slides[index].key === 'together' ? (
                  <>
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          top: 96,
                          left: 64,
                          width: 82,
                          height: 2,
                          backgroundColor: withAlpha(colors.primary, 0.8),
                        },
                        lineStyle,
                      ]}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 90,
                        left: 54,
                        width: 14,
                        height: 14,
                        borderRadius: metrics.radius.full,
                        backgroundColor: colors.primary,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 90,
                        right: 58,
                        width: 14,
                        height: 14,
                        borderRadius: metrics.radius.full,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </>
                ) : null}

                {slides[index].key === 'safe' ? (
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        bottom: metrics.md,
                        width: 92,
                        height: 92,
                        borderRadius: metrics.radius.full,
                        borderWidth: 2,
                        borderColor: colors.primary,
                      },
                      fenceStyle,
                    ]}
                  />
                ) : null}
              </View>

              <Text style={styles.title}>{slides[index].title}</Text>
              <Text style={styles.subtitle}>{slides[index].subtitle}</Text>
              <Text style={styles.detail}>{slides[index].detail}</Text>
            </View>
          </View>

          <View style={styles.dotsRow}>
            {slides.map((slide, dotIndex) => (
              <Pressable key={slide.key} onPress={() => moveTo(dotIndex)} style={[styles.dot, dotIndex === index && styles.activeDot]} />
            ))}
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <PrimaryButton onPress={onPrimaryPress} title="Get Started" />
          <Pressable onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
