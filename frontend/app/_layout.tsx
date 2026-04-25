import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";

// Contexts & Hooks
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { PlaybackSettingsProvider } from "../src/contexts/PlaybackSettingsContext";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { UploadProvider } from "../src/contexts/UploadContext";
import { useTheme } from "../src/hooks/useTheme";

SplashScreen.preventAutoHideAsync().catch(() => {
	// Ignore if splash is already controlled by Expo runtime.
});

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider>
					<PlaybackSettingsProvider>
						<AuthProvider>
							<UploadProvider>
								<RootNavigator />
							</UploadProvider>
						</AuthProvider>
					</PlaybackSettingsProvider>
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

function RootNavigator() {
	const { colors, resolvedMode } = useTheme();
	const { isAuthenticated } = useAuth();
	const [showVideoSplash, setShowVideoSplash] = useState(true);
	
	// Animation Refs
	const boomScale = useRef(new Animated.Value(1.24)).current;
	const boomOpacity = useRef(new Animated.Value(0.9)).current;
	const appEntryY = useRef(new Animated.Value(110)).current;
	const appEntryOpacity = useRef(new Animated.Value(0)).current;
	const hasStartedAppEntry = useRef(false);
	const splashVideoPlayer = useVideoPlayer(require("../assets/logo.mp4"), (player) => {
		player.loop = false;
		player.muted = true;
	});

	const hideNativeSplash = useCallback(async () => {
		try {
			await SplashScreen.hideAsync();
		} catch {
			// Ignore if native splash is already hidden.
		}
	}, []);

	const startAppEntryAnimation = useCallback(() => {
		if (hasStartedAppEntry.current) return;
		hasStartedAppEntry.current = true;

		Animated.parallel([
			Animated.timing(appEntryOpacity, {
				toValue: 1,
				duration: 130,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.sequence([
				Animated.timing(appEntryY, {
					toValue: -18,
					duration: 250,
					easing: Easing.out(Easing.cubic),
					useNativeDriver: true,
				}),
				Animated.spring(appEntryY, {
					toValue: 0,
					damping: 14,
					stiffness: 260,
					mass: 0.9,
					useNativeDriver: true,
				}),
			]),
		]).start();
	}, [appEntryOpacity, appEntryY]);

	useEffect(() => {
		if (!isAuthenticated || Constants.appOwnership === "expo") return;

		let cancelled = false;
		const setupPushNotifications = async () => {
			const { initializePushNotifications } = await import("../src/services/PushNotificationService");
			if (!cancelled) await initializePushNotifications();
		};

		void setupPushNotifications();
		return () => { cancelled = true; };
	}, [isAuthenticated]);

	const finishVideoSplash = useCallback(() => {
		setShowVideoSplash(false);
		startAppEntryAnimation();
	}, [startAppEntryAnimation]);

	useEffect(() => {
		const subscription = splashVideoPlayer.addListener("playToEnd", () => {
			finishVideoSplash();
		});

		return () => {
			subscription.remove();
		};
	}, [finishVideoSplash, splashVideoPlayer]);

	useEffect(() => {
		if (showVideoSplash) {
			splashVideoPlayer.play();
			return;
		}

		splashVideoPlayer.pause();
	}, [showVideoSplash, splashVideoPlayer]);

	useEffect(() => {
		if (showVideoSplash) {
			return;
		}

		void hideNativeSplash();
	}, [hideNativeSplash, showVideoSplash]);

	useEffect(() => {
		Animated.parallel([
			Animated.timing(boomScale, {
				toValue: 1,
				duration: 360,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.timing(boomOpacity, {
				toValue: 1,
				duration: 260,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
		]).start();

		const fallbackTimer = setTimeout(() => {
			setShowVideoSplash(false);
			startAppEntryAnimation();
		}, 5000);

		return () => clearTimeout(fallbackTimer);
	}, [boomOpacity, boomScale, startAppEntryAnimation]);

	return (
		<>
			<Animated.View
				style={{
					flex: 1,
					opacity: appEntryOpacity,
					transform: [{ translateY: appEntryY }],
				}}
			>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="index" />
					<Stack.Screen name="onboarding" />
					<Stack.Screen name="(tabs)" />
					<Stack.Screen
						name="create"
						options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
					/>
					<Stack.Screen name="auth" options={{ animation: "fade" }} />
					<Stack.Screen name="setup/profile" />
					<Stack.Screen name="chats/index" />
					<Stack.Screen name="chats/[id]" />
					<Stack.Screen name="group-chat/[id]" />
					<Stack.Screen name="rider/[id]" />
					<Stack.Screen name="post/[postId]" />
					<Stack.Screen name="solo-ride/[id]" />
					<Stack.Screen name="ride-details" />
					<Stack.Screen
						name="settings"
						options={{ presentation: "transparentModal", animation: "none" }}
					/>
					<Stack.Screen name="tracking" />
					<Stack.Screen name="community" />
					<Stack.Screen name="notifications" />
					<Stack.Screen name="status" />
					<Stack.Screen
						name="status-viewer"
						options={{ animation: "fade", presentation: "fullScreenModal" }}
					/>
				</Stack>
				<StatusBar
					style={resolvedMode === "dark" ? "light" : "dark"}
					backgroundColor={colors.background}
				/>
			</Animated.View>

			{showVideoSplash && (
				<View style={styles.videoSplashOverlay}>
					<Animated.View
						style={[
							styles.videoWrap,
							{
								opacity: boomOpacity,
								transform: [{ scale: boomScale }],
							},
						]}
					>
						<VideoView
							contentFit="cover"
							fullscreenOptions={{ enable: false }}
							nativeControls={false}
							onFirstFrameRender={() => {
								void hideNativeSplash();
							}}
							player={splashVideoPlayer}
							style={styles.video}
						/>
					</Animated.View>
				</View>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	videoSplashOverlay: {
		...StyleSheet.absoluteFillObject,
		zIndex: 100,
		backgroundColor: "#000000", // Usually black looks better for video backgrounds
	},
	videoWrap: {
		flex: 1,
	},
	video: {
		width: "100%",
		height: "100%",
	},
});
