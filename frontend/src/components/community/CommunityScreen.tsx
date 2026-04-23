import React from "react";
import {
	FlatList,
	RefreshControl,
	ScrollView,
	StyleSheet,
	View,
	type ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useCommunityData } from "../../hooks/useCommunityData";
import type { RideItem } from "../../types/community";
import RideService from "../../services/RideService";
import { ActiveRideCard } from "./ActiveRideCard";
import { Header } from "./Header";
import { RideCard } from "./RideCard";
import { SectionHeader } from "./SectionHeader";
import { SuggestedGroupCard } from "./SuggestedGroupCard";

type SectionKey = "suggested" | "nearby" | "myRides";

const sectionOrder: SectionKey[] = ["suggested", "nearby", "myRides"];

export function CommunityScreen() {
	const router = useRouter();
	const { colors, metrics } = useTheme();
	const {
		activeRide,
		suggestedGroups,
		nearbyRides,
		myRides,
		refreshing,
		refreshCommunity,
	} = useCommunityData();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				listContent: {
					paddingTop: metrics.lg,
					paddingBottom: metrics["3xl"],
					gap: metrics.lg,
				},
				sectionWrap: {
					paddingHorizontal: metrics.md,
				},
				rideListWrap: {
					gap: metrics.md,
				},
				suggestedRail: {
					marginHorizontal: -metrics.md,
					paddingLeft: metrics.md,
					paddingRight: metrics.md,
				},
			}),
		[colors, metrics],
	);

	const renderSection = React.useCallback(
		({ item }: ListRenderItemInfo<SectionKey>) => {
			if (item === "suggested") {
				return (
					<View style={styles.sectionWrap}>
						<SectionHeader
							actionLabel="VIEW ALL"
							onPressAction={() => {}}
							title="Suggested Groups"
						/>
						<ScrollView
							contentContainerStyle={styles.suggestedRail}
							horizontal
							showsHorizontalScrollIndicator={false}
						>
							{suggestedGroups.map((group) => (
								<SuggestedGroupCard
									item={group}
									key={group.id}
									onPress={() => {}}
								/>
							))}
						</ScrollView>
					</View>
				);
			}

			if (item === "nearby") {
				return (
					<View style={styles.sectionWrap}>
						<SectionHeader title="Nearby Rides" />
						<View style={styles.rideListWrap}>
							{nearbyRides.map((ride: RideItem) => (
								<RideCard
									item={ride}
									key={ride.id}
									mode="nearby"
									onPrimaryAction={async (rideId) => {
										try {
											await RideService.joinRide(rideId);
										} catch {
											// Keep UI stable; hook refresh picks updates on next load.
										}
									}}
								/>
							))}
						</View>
					</View>
				);
			}

			return (
				<View style={styles.sectionWrap}>
					<SectionHeader title="My Rides" />
					<View style={styles.rideListWrap}>
						{myRides.map((ride: RideItem) => (
							<RideCard
								item={ride}
								key={ride.id}
								mode="myRides"
								onPrimaryAction={(rideId) => {
									router.push(
										ride.status === "completed"
											? {
													pathname: `/group-chat/${rideId}`,
													params: { status: "ended" },
												}
											: `/group-chat/${rideId}`,
									);
								}}
							/>
						))}
					</View>
				</View>
			);
		},
		[myRides, nearbyRides, styles, suggestedGroups],
	);

	return (
		<SafeAreaView
			edges={["left", "right", "top", "bottom"]}
			style={styles.container}
		>
			<Header
				onBack={() => router.back()}
				onStartRide={() => router.push("/(tabs)/ride")}
			/>

			<FlatList
				ListHeaderComponent={
					activeRide ? (
						<ActiveRideCard
							data={activeRide}
							onOpenRide={() => router.push(`/group-chat/${activeRide.id}`)}
						/>
					) : null
				}
				contentContainerStyle={styles.listContent}
				data={sectionOrder}
				keyExtractor={(item) => item}
				refreshControl={
					<RefreshControl
						colors={[colors.primary]}
						onRefresh={refreshCommunity}
						progressBackgroundColor={colors.surface}
						refreshing={refreshing}
						tintColor={colors.primary}
					/>
				}
				renderItem={renderSection}
				showsVerticalScrollIndicator={false}
			/>
		</SafeAreaView>
	);
}
