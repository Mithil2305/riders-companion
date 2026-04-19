import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import { useTheme } from "../src/hooks/useTheme";

SplashScreen.preventAutoHideAsync().catch(() => {
	// Ignore if splash is already controlled by Expo runtime.
});

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ThemeProvider>
				<AuthProvider>
					<RootNavigator />
				</AuthProvider>
			</ThemeProvider>
		</GestureHandlerRootView>
	);
}

function RootNavigator() {
	const { colors, resolvedMode } = useTheme();
	const [showVideoSplash, setShowVideoSplash] = useState(true);
	const boomScale = useRef(new Animated.Value(1.24)).current;
	const boomOpacity = useRef(new Animated.Value(0.9)).current;
	const appEntryY = useRef(new Animated.Value(110)).current;
	const appEntryOpacity = useRef(new Animated.Value(0)).current;
	const hasStartedAppEntry = useRef(false);

	const hideNativeSplash = useCallback(async () => {
		try {
			await SplashScreen.hideAsync();
		} catch {
			// Ignore if native splash is already hidden.
		}
	}, []);

	const startAppEntryAnimation = useCallback(() => {
		if (hasStartedAppEntry.current) {
			return;
		}

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
			void hideNativeSplash();
			setShowVideoSplash(false);
			startAppEntryAnimation();
		}, 2400);

		return () => clearTimeout(fallbackTimer);
	}, [boomOpacity, boomScale, hideNativeSplash, startAppEntryAnimation]);

	return (
		<>
			<Animated.View
				style={{
					flex: 1,
					opacity: appEntryOpacity,
					transform: [{ translateY: appEntryY }],
				}}
			>
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="index" />
					<Stack.Screen name="onboarding" />
					<Stack.Screen name="(tabs)" />
					<Stack.Screen
						name="auth"
						options={{
							animation: "fade",
						}}
					/>
					<Stack.Screen name="setup/profile" />
					<Stack.Screen name="chats/index" />
					<Stack.Screen name="chats/[id]" />
					<Stack.Screen name="group-chat/[id]" />
					<Stack.Screen name="rider/[id]" />
					<Stack.Screen name="solo-ride/[id]" />
					<Stack.Screen name="ride-details" />
					<Stack.Screen
						name="settings"
						options={{
							presentation: "transparentModal",
							animation: "none",
						}}
					/>
					<Stack.Screen name="tracking" />
					<Stack.Screen name="community" />
					<Stack.Screen name="notifications" />
					<Stack.Screen name="status" />
					<Stack.Screen
						name="status-viewer"
						options={{
							animation: "fade",
							presentation: "fullScreenModal",
						}}
					/>
				</Stack>
				<StatusBar
					style={resolvedMode === "dark" ? "light" : "dark"}
					backgroundColor={colors.background}
				/>
			</Animated.View>
			{showVideoSplash ? (
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
						<Image
							source={require("../assets/logo.png")}
							style={styles.video}
							resizeMode="contain"
							onLoad={() => {
								void hideNativeSplash();
							}}
						/>
					</Animated.View>
				</View>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	videoSplashOverlay: {
		...StyleSheet.absoluteFillObject,
		zIndex: 100,
		backgroundColor: "#e8e8e8",
	},
	videoWrap: {
		flex: 1,
	},
	video: {
		width: "100%",
		height: "100%",
	},
});
