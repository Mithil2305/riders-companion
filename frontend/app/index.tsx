import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import Animated, {
  FadeInUp,
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/hooks/useTheme";
import { useAuth } from "../src/contexts/AuthContext";
import { withAlpha } from "../src/utils/color";

function StaggeredItem({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().damping(13)}>
      {children}
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const [fontsLoaded] = useFonts({
    Redseven: require("../assets/fonts/Redseven.otf"),
  });

  const { colors, metrics, typography } = useTheme();
  const { isAuthenticated, isRestoring } = useAuth();
  const router = useRouter();
  const buttonScale = useSharedValue(1);
  const logoScale = useSharedValue(0.76);
  const logoLift = useSharedValue(22);
  const logoTilt = useSharedValue(-4);
  const glowPulse = useSharedValue(0.82);
  const ctaPulse = useSharedValue(1);
  const ctaLaunchY = useSharedValue(-140);
  const ctaLaunchScale = useSharedValue(0.9);

  React.useEffect(() => {
    logoScale.value = withSequence(
      withSpring(1.2, { damping: 11, stiffness: 250 }),
      withSpring(1, { damping: 14, stiffness: 220 }),
    );
    logoLift.value = withSpring(0, { damping: 16, stiffness: 180 });
    logoTilt.value = withSequence(
      withTiming(1.4, { duration: 140, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }),
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 950, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.86, { duration: 950, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    ctaPulse.value = withDelay(
      550,
      withRepeat(
        withSequence(
          withTiming(1.02, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );

    ctaLaunchY.value = withDelay(
      420,
      withSequence(
        withTiming(22, { duration: 170, easing: Easing.in(Easing.cubic) }),
        withSpring(0, { damping: 13, stiffness: 240, mass: 0.85 }),
      ),
    );

    ctaLaunchScale.value = withDelay(
      420,
      withSequence(
        withTiming(1.04, { duration: 170, easing: Easing.in(Easing.cubic) }),
        withSpring(1, { damping: 14, stiffness: 230 }),
      ),
    );

    return () => {
      cancelAnimation(glowPulse);
      cancelAnimation(ctaPulse);
      cancelAnimation(logoScale);
      cancelAnimation(logoLift);
      cancelAnimation(logoTilt);
      cancelAnimation(ctaLaunchY);
      cancelAnimation(ctaLaunchScale);
    };
  }, [ctaLaunchScale, ctaLaunchY, ctaPulse, glowPulse, logoLift, logoScale, logoTilt]);

  // Skip onboarding if user is already authenticated
  React.useEffect(() => {
    if (!isRestoring && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isRestoring, isAuthenticated, router]);

  const logoBoomStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { translateY: logoLift.value },
      { rotateZ: `${logoTilt.value}deg` },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
    transform: [{ scale: glowPulse.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: ctaLaunchY.value },
      { scale: buttonScale.value * ctaPulse.value * ctaLaunchScale.value },
    ],
  }));

  const logoSize = Math.min(metrics.screenWidth * 0.58, 320);

  type OnboardingStyles = {
    container: ViewStyle;
    heroWrap: ViewStyle;
    logoOuter: ViewStyle;
    halo: ViewStyle;
    logo: ImageStyle;
    textContent: ViewStyle;
    mainTitle: TextStyle;
    headline: TextStyle;
    description: TextStyle;
    slogan: TextStyle;
    buttonDock: ViewStyle;
    buttonTapZone: ViewStyle;
    ctaButton: ViewStyle;
    ctaText: TextStyle;
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create<OnboardingStyles>({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: metrics.lg,
        },
        heroWrap: {
          flex: 1.9,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: metrics.sm,
        },
        logoOuter: {
          alignItems: "center",
          justifyContent: "center",
        },
        halo: {
          position: "absolute",
          width: logoSize * 0.9,
          height: logoSize * 0.9,
          borderRadius: metrics.radius.full,
          backgroundColor: withAlpha(colors.primary, 0.16),
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 5,
        },
        logo: {
          width: logoSize,
          height: logoSize,
          resizeMode: "contain",
        },
        textContent: {
          flex: 1.8,
          alignItems: "center",
        },
        mainTitle: {
          color: colors.textPrimary,
          textAlign: "center",
          fontFamily: "Redseven",
          fontSize: Math.min(metrics.screenWidth * 0.12, typography.sizes["xl"]),
          lineHeight: Math.min(metrics.screenWidth * 0.08, 52),
          letterSpacing: 1.6,
          marginTop: metrics.xs,
        },
        headline: {
          textAlign: "center",
          color: colors.primary,
          fontSize: Math.min(metrics.screenWidth * 0.07, typography.sizes["xl"]),
          fontWeight: "700",
          lineHeight: Math.min(metrics.screenWidth * 0.08, 36),
          marginTop: metrics.xs,
        },
        description: {
          textAlign: "center",
          color: colors.textSecondary,
          fontSize: typography.sizes.lg,
          lineHeight: 32,
          marginTop: metrics.xs,
          fontWeight: "500",
        },
        slogan: {
          textAlign: "center",
          color: colors.primary,
          fontSize: typography.sizes.lg,
          letterSpacing: 1.8,
          marginTop: metrics.xs,
          fontStyle: "italic",
          fontWeight: "600",
        },
        buttonDock: {
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-start",
          marginTop: metrics.md,
        },
        buttonTapZone: {
          borderRadius: 46,
        },
        ctaButton: {
          backgroundColor: colors.primary,
          minHeight: 54,
          width: 150,
          borderRadius: 44,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 9 },
          shadowOpacity: 0.18,
          shadowRadius: 18,
          elevation: 8,
        },
        ctaText: {
          color: colors.textInverse,
          fontSize: typography.sizes["xl"],
          fontWeight: "700",
          letterSpacing: 1,
        },
      }),
    [colors, logoSize, metrics, typography],
  );

  const onGetStarted = React.useCallback(() => {
    buttonScale.value = withSequence(
      withSpring(0.94, { damping: 14, stiffness: 280 }),
      withSpring(1, { damping: 14, stiffness: 260 }),
    );

    setTimeout(() => {
      router.replace("/auth/login");
    }, 170);
  }, [buttonScale, router]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.container}
    >
      <View style={styles.heroWrap}>
        <StaggeredItem delay={90}>
          <Animated.View style={[styles.logoOuter, logoBoomStyle]}>
            <Animated.View style={[styles.halo, haloStyle]} />
            <Image
              source={require("../assets/images/hero.png")}
              style={styles.logo}
            />
          </Animated.View>
        </StaggeredItem>
      </View>

      <View style={styles.textContent}>
        <StaggeredItem delay={150}>
          <Text style={styles.mainTitle}>RIDER&apos;S{"\n"}COMPANION</Text>
        </StaggeredItem>

        <StaggeredItem delay={220}>
          <Text style={styles.headline}>
            The Ultimate Riding{"\n"}Experience
          </Text>
        </StaggeredItem>

        <StaggeredItem delay={280}>
          <Text style={styles.description}>
            Solo journeys & group{"\n"}adventures with friends and{"\n"}family
          </Text>
        </StaggeredItem>

        <StaggeredItem delay={340}>
          <Text style={styles.slogan}>Together on Every Road</Text>
        </StaggeredItem>
      </View>

      <Animated.View style={styles.buttonDock}>
        <Pressable onPress={onGetStarted} style={styles.buttonTapZone}>
          <Animated.View style={[styles.ctaButton, buttonStyle]}>
            <Text style={styles.ctaText}>Get Started</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}
