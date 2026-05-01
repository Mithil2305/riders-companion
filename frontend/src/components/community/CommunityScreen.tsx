import React from "react";
import {
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	View,
	type ListRenderItemInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
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
	const params = useLocalSearchParams<{ rideAction?: string }>();
	const { user: authUser } = useAuth();
	const { colors, metrics, typography } = useTheme();
	const [selectedLocation, setSelectedLocation] = React.useState("Chennai");
	const { activeRide, nearbyRides, myRides, refreshing, refreshCommunity } =
		useCommunityData(selectedLocation);

	const [showConfirmation, setShowConfirmation] = React.useState(false);

	React.useEffect(() => {
		if (params.rideAction === "created" || params.rideAction === "updated") {
			setShowConfirmation(true);
			const timer = setTimeout(() => {
				setShowConfirmation(false);
				router.replace("/community");
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [params.rideAction, router]);

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
				confirmationBanner: {
					marginHorizontal: metrics.md,
					marginBottom: metrics.md,
					backgroundColor: "#22C55E",
					borderRadius: 12,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				confirmationText: {
					color: "#FFFFFF",
					fontSize: typography.sizes.sm,
					fontWeight: "600",
					flex: 1,
				},
			}),
		[colors, metrics, typography],
	);

	const handleEdit = React.useCallback(
		(ride: RideItem) => {
			const rideType = ride.rideType ?? "group";
			router.push({
				pathname: "/ride-details",
				params: {
					editMode: "true",
					rideId: ride.id,
					rideType,
				},
			});
		},
		[router],
	);

	const handleDelete = React.useCallback(
		(rideId: string) => {
			Alert.alert(
				"Delete Ride",
				"Are you sure you want to delete this ride? This action cannot be undone.",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Delete",
						style: "destructive",
						onPress: async () => {
							try {
								await RideService.deleteRide(rideId);
								refreshCommunity();
							} catch {
								Alert.alert(
									"Error",
									"Failed to delete ride. Please try again.",
								);
							}
						},
					},
				],
			);
		},
		[refreshCommunity],
	);

	const renderSection = React.useCallback(
		({ item }: ListRenderItemInfo<SectionKey>) => {
			if (item === "nearby") {
				return (
					<View style={styles.sectionWrap}>
						<SectionHeader title="Nearby Rides" />
						{nearbyRides.length === 0 ? (
							<View style={styles.emptyStateWrap}>
								<Ionicons
									color={colors.borderDark}
									name="map-outline"
									size={48}
								/>
								<Text style={styles.emptyStateTitle}>
									No nearby rides right now.
								</Text>
								<Text style={styles.emptyStateSubtitle}>
									Be the first to start one!
								</Text>
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
								canManageRide={Boolean(
									ride.isOrganizer || ride.organizerId === authUser?.id,
								)}
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
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						))}
					</View>
				</View>
			);
		},
		[
			myRides,
			nearbyRides,
			styles,
			router,
			colors.borderDark,
			handleEdit,
			handleDelete,
			authUser?.id,
		],
	);

	return (
		<SafeAreaView
			edges={["left", "right", "top", "bottom"]}
			style={styles.container}
		>
			{showConfirmation && (
				<View style={styles.confirmationBanner}>
					<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
					<Text style={styles.confirmationText}>
						Ride {params.rideAction} successfully!
					</Text>
					<Ionicons name="close" size={18} color="#FFFFFF" />
				</View>
			)}

			<Header
				onBack={() => router.back()}
				selectedLocation={selectedLocation}
				onChangeLocation={setSelectedLocation}
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
