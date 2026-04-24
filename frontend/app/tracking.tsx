import React from "react";
import {
	FlatList,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInLeft, FadeInRight } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { EmptyState, SkeletonBlock } from "../src/components/common";
import { TabSwitcher, UserListItem } from "../src/components/followers";
import { TrackingTabKey, useTrackingData } from "../src/hooks/useTrackingData";
import { TrackerUser } from "../src/types/profile";
import { useTheme } from "../src/hooks/useTheme";

function parseInitialTab(value: string | string[] | undefined): TrackingTabKey {
	if (value === "following" || value === "tracking") {
		return "following";
	}

	if (value === "followers" || value === "trackers") {
		return "followers";
	}

	return "followers";
}

export default function TrackingScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const { tab } = useLocalSearchParams<{ tab?: string | string[] }>();
	const initialTab = React.useMemo(() => parseInitialTab(tab), [tab]);
	const {
		loading,
		refreshing,
		activeTab,
		followers,
		following,
		setActiveTab,
		toggleFollowState,
		refreshTracking,
	} = useTrackingData(initialTab);
	const previousTab = React.useRef<TrackingTabKey>(initialTab);

	const currentData = activeTab === "followers" ? followers : following;
	const currentScreenTitle =
		activeTab === "followers" ? "Trackers" : "Tracking";
	const entering =
		previousTab.current === "followers"
			? FadeInRight.duration(220)
			: FadeInLeft.duration(220);
	previousTab.current = activeTab;

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				safeArea: {
					flex: 1,
					backgroundColor: colors.background,
				},
				container: {
					flex: 1,
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
					gap: metrics.md,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				titleWrap: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes["2xl"],
					fontWeight: "700",
				},
				listContent: {
					paddingTop: metrics.sm,
					paddingBottom: metrics["3xl"],
					gap: metrics.sm,
				},
				skeletonRow: {
					borderRadius: metrics.radius.xl,
					height: 76,
					marginBottom: metrics.sm,
				},
			}),
		[colors, metrics, typography],
	);

	const renderItem = React.useCallback(
		({ item, index }: { item: TrackerUser; index: number }) => (
			<UserListItem
				index={index}
				onToggleFollow={toggleFollowState}
				user={item}
			/>
		),
		[toggleFollowState],
	);

	if (loading) {
		return (
			<SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
				<View style={styles.container}>
					<View style={styles.header}>
						<Pressable onPress={() => router.back()}>
							<Ionicons
								color={colors.primary}
								name="arrow-back"
								size={metrics.icon.md}
							/>
						</Pressable>
						<View style={styles.titleWrap}>
							<Ionicons
								color={colors.primary}
								name="people-outline"
								size={metrics.icon.md}
							/>
							<Text style={styles.title}>{currentScreenTitle}</Text>
						</View>
						<View style={{ width: metrics.icon.md }} />
					</View>
					<SkeletonBlock style={styles.skeletonRow} />
					<SkeletonBlock style={styles.skeletonRow} />
					<SkeletonBlock style={styles.skeletonRow} />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()}>
						<Ionicons
							color={colors.primary}
							name="arrow-back"
							size={metrics.icon.md}
						/>
					</Pressable>
					<View style={styles.titleWrap}>
						<Ionicons
							color={colors.primary}
							name="people-outline"
							size={metrics.icon.md}
						/>
						<Text style={styles.title}>{currentScreenTitle}</Text>
					</View>
					<View style={{ width: metrics.icon.md }} />
				</View>

				<TabSwitcher
					activeTab={activeTab}
					followersCount={followers.length}
					followingCount={following.length}
					onTabChange={setActiveTab}
				/>

				<Animated.View entering={entering} key={activeTab} style={{ flex: 1 }}>
					<FlatList
						ListEmptyComponent={
							<EmptyState
								icon={
									activeTab === "followers"
										? "people-outline"
										: "person-add-outline"
								}
								subtitle={
									activeTab === "followers"
										? "No trackers yet. Share your next ride to attract riders."
										: "You are not tracking anyone yet."
								}
								title={
									activeTab === "followers" ? "No trackers" : "No tracking yet"
								}
							/>
						}
						contentContainerStyle={styles.listContent}
						data={currentData}
						keyExtractor={(item) => item.id}
						refreshControl={
							<RefreshControl
								colors={[colors.primary]}
								onRefresh={refreshTracking}
								progressBackgroundColor={colors.surface}
								refreshing={refreshing}
								tintColor={colors.primary}
							/>
						}
						renderItem={renderItem}
						showsVerticalScrollIndicator={false}
					/>
				</Animated.View>
			</View>
		</SafeAreaView>
	);
}
