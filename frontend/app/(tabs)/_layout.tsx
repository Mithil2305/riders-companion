import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/hooks/useTheme";

export default function TabLayout() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const bottomInset = Math.max(insets.bottom, 6);

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,
				tabBarHideOnKeyboard: true,
				tabBarStyle: {
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
					height: 56 + bottomInset,
					paddingTop: 6,
					paddingBottom: bottomInset,
				},
				tabBarActiveTintColor: colors.tabBarActive,
				tabBarInactiveTintColor: colors.tabBarInactive,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="home" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="explore"
				options={{
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="compass" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="reels"
				options={{
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="film" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="ride"
				options={{
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="location-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="person" size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
