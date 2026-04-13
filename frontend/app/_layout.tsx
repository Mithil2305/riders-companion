import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { useTheme } from '../src/hooks/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash is already controlled by Expo runtime.
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { colors, resolvedMode } = useTheme();
  const [showVideoSplash, setShowVideoSplash] = useState(true);
  const introScale = useRef(new Animated.Value(1.22)).current;
  const introOpacity = useRef(new Animated.Value(0.9)).current;

  const hideNativeSplash = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Ignore if native splash is already hidden.
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(introScale, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [introOpacity, introScale]);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      hideNativeSplash();
      setShowVideoSplash(false);
    }, 7000);

    return () => clearTimeout(fallbackTimer);
  }, [hideNativeSplash]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }

    if (status.didJustFinish) {
      setShowVideoSplash(false);
    }
  }, []);

  const handleVideoReady = useCallback(() => {
    hideNativeSplash();
  }, [hideNativeSplash]);

  const handleVideoError = useCallback(() => {
    hideNativeSplash();
    setShowVideoSplash(false);
  }, [hideNativeSplash]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="room" />
        <Stack.Screen name="group-room" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'transparentModal',
            animation: 'none',
          }}
        />
        <Stack.Screen name="tracking" />
        <Stack.Screen name="community" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="status" />
        <Stack.Screen
          name="status-viewer"
          options={{
            animation: 'fade',
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
      {showVideoSplash && (
        <View style={styles.videoSplashContainer}>
          <Animated.View
            style={[
              styles.videoWrapper,
              {
                opacity: introOpacity,
                transform: [{ scale: introScale }],
              },
            ]}
          >
            <Video
              source={require('../assets/logo.mp4')}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping={false}
              isMuted
              rate={1.08}
              onReadyForDisplay={handleVideoReady}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onError={handleVideoError}
            />
          </Animated.View>
        </View>
      )}
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
    </>
  );
}

const styles = StyleSheet.create({
  videoSplashContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#e8e8e8',
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
