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
<<<<<<< HEAD
						<Ionicons name="search" size={size} color={color} />
=======
<<<<<<< HEAD
						<Ionicons name="compass" size={size} color={color} />
=======
						<Ionicons name="search" size={size} color={color} />
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
					),
				}}
			/>
			<Tabs.Screen
				name="clips"
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
