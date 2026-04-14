import React, { useEffect } from "react";
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

	useEffect(() => {
		SplashScreen.hideAsync().catch(() => {
			// Ignore if native splash is already hidden.
		});
	}, []);

	return (
		<>
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
				<Stack.Screen name="room/index" />
				<Stack.Screen name="room/[id]" />
				<Stack.Screen name="group-room/[id]" />
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
		</>
	);
}
