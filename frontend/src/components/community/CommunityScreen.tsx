import React from "react";
import {
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	View,
	type ListRenderItemInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

type SectionKey = "nearby" | "myRides";

const sectionOrder: SectionKey[] = ["nearby", "myRides"];

export function CommunityScreen() {
	const router = useRouter();
	const { colors, metrics, typography } = useTheme();
	const {
		activeRide,
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
				emptyStateWrap: {
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: metrics["3xl"],
					paddingHorizontal: metrics.xl,
					gap: metrics.sm,
				},
				emptyStateTitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.lg,
					fontWeight: "600",
					marginTop: metrics.sm,
				},
				emptyStateSubtitle: {
					color: colors.textTertiary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
				},
			}),
		[colors, metrics, typography],
	);

	const renderSection = React.useCallback(
		({ item }: ListRenderItemInfo<SectionKey>) => {
			if (item === "nearby") {
				return (
					<View style={styles.sectionWrap}>
						<SectionHeader title="Nearby Rides" />
						{nearbyRides.length === 0 ? (
							<View style={styles.emptyStateWrap}>
								<Ionicons color={colors.borderDark} name="map-outline" size={48} />
								<Text style={styles.emptyStateTitle}>No nearby rides right now.</Text>
								<Text style={styles.emptyStateSubtitle}>Be the first to start one!</Text>
							</View>
						) : (
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
						)}
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
		[myRides, nearbyRides, styles, router, colors.borderDark],
	);

	return (
		<SafeAreaView
			edges={["left", "right", "top", "bottom"]}
			style={styles.container}
		>
			<Header
				onBack={() => router.back()}
				onStartRide={() =>
					router.push({
						pathname: "/ride-details",
						params: { rideType: "group" },
					})
				}
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
