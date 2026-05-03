<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from "react";
=======
<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
=======
import React, { useEffect, useMemo, useState } from "react";
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
import {
	ActivityIndicator,
	FlatList,
	Image,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
<<<<<<< HEAD
=======
<<<<<<< HEAD
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import ProfileService from '../../services/ProfileService';
import TrackerService from '../../services/TrackerService';
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import ProfileService from "../../services/ProfileService";
import TrackerService from "../../services/TrackerService";
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

export interface CoRider {
	id: string;
	name: string;
	username?: string;
	avatar?: string;
	isTracking?: boolean;
	isFollowing?: boolean;
}

interface GroupRideFormLevel3Props {
	startingPoint: string;
	endingPoint: string;
<<<<<<< HEAD
=======
<<<<<<< HEAD
	onSubmit: (startingPoint: string, endingPoint: string, selectedRiders: CoRider[]) => void;
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	onSubmit: (
		startingPoint: string,
		endingPoint: string,
		selectedRiders: CoRider[],
	) => void;
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	isLoading?: boolean;
}

export function GroupRideFormLevel3({
	startingPoint,
	endingPoint,
	onSubmit,
	isLoading = false,
}: GroupRideFormLevel3Props) {
	const { colors, typography, metrics } = useTheme();
<<<<<<< HEAD
	const [searchQuery, setSearchQuery] = useState("");
=======
<<<<<<< HEAD
	const [searchQuery, setSearchQuery] = useState('');
=======
	const [searchQuery, setSearchQuery] = useState("");
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	const [baseRiders, setBaseRiders] = useState<CoRider[]>([]);
	const [coRidersList, setCoRidersList] = useState<CoRider[]>([]);
	const [selectedRiders, setSelectedRiders] = useState<CoRider[]>([]);
	const [isLoadingRiders, setIsLoadingRiders] = useState(true);
	const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

<<<<<<< HEAD
	const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=11";

	const toTrackerRider = (value: unknown): CoRider | null => {
		if (!value || typeof value !== "object") {
=======
<<<<<<< HEAD
	const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=11';

	const toTrackerRider = (value: unknown): CoRider | null => {
		if (!value || typeof value !== 'object') {
=======
	const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=11";

	const toTrackerRider = (value: unknown): CoRider | null => {
		if (!value || typeof value !== "object") {
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
			return null;
		}

		const item = value as {
			id?: unknown;
			name?: unknown;
			avatar?: unknown;
			isFollowing?: unknown;
		};

<<<<<<< HEAD
		if (typeof item.id !== "string" || item.id.trim().length === 0) {
=======
<<<<<<< HEAD
		if (typeof item.id !== 'string' || item.id.trim().length === 0) {
=======
		if (typeof item.id !== "string" || item.id.trim().length === 0) {
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
			return null;
		}

		return {
			id: item.id,
			name:
<<<<<<< HEAD
				typeof item.name === "string" && item.name.trim().length > 0
=======
<<<<<<< HEAD
				typeof item.name === 'string' && item.name.trim().length > 0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
					? item.name
					: "Rider",
			avatar:
<<<<<<< HEAD
				typeof item.avatar === "string" && item.avatar.trim().length > 0
=======
				typeof item.avatar === 'string' && item.avatar.trim().length > 0
=======
				typeof item.name === "string" && item.name.trim().length > 0
					? item.name
					: "Rider",
			avatar:
				typeof item.avatar === "string" && item.avatar.trim().length > 0
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
					? item.avatar
					: FALLBACK_AVATAR,
			isFollowing: Boolean(item.isFollowing),
		};
	};

	useEffect(() => {
		let mounted = true;

		const load = async () => {
			setIsLoadingRiders(true);
			try {
				const profile = await ProfileService.getMyProfile();
				const riderId = profile.profile.id;

				const [followersData, followingData] = await Promise.all([
					TrackerService.getFollowers(riderId),
					TrackerService.getFollowing(riderId),
				]);

				const mapById = new Map<string, CoRider>();

				followersData.followers
					.map(toTrackerRider)
					.filter((item): item is CoRider => item != null)
					.forEach((item) => {
						mapById.set(item.id, {
							...item,
							isFollowing: true,
						});
					});

				followingData.following
					.map(toTrackerRider)
					.filter((item): item is CoRider => item != null)
					.forEach((item) => {
						const existing = mapById.get(item.id);
						mapById.set(item.id, {
							...existing,
							...item,
							isTracking: true,
							isFollowing: existing?.isFollowing ?? item.isFollowing,
						});
					});

				const riders = Array.from(mapById.values()).sort((a, b) =>
					a.name.localeCompare(b.name),
				);

				if (!mounted) {
					return;
				}

				setBaseRiders(riders);
				setCoRidersList(riders);
			} catch {
				if (!mounted) {
					return;
				}

				setBaseRiders([]);
				setCoRidersList([]);
			} finally {
				if (mounted) {
					setIsLoadingRiders(false);
				}
			}
		};

		void load();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		const normalizedQuery = searchQuery.trim();
		if (normalizedQuery.length === 0) {
			setIsSearchingGlobal(false);
			setCoRidersList(baseRiders);
			return;
		}

		let mounted = true;
		const timer = setTimeout(async () => {
			setIsSearchingGlobal(true);
			try {
				const result = await ProfileService.searchRiders(normalizedQuery);
				if (!mounted) {
					return;
				}

				const merged = new Map<string, CoRider>();
				baseRiders.forEach((item) => merged.set(item.id, item));

				result.users.forEach((user) => {
					const existing = merged.get(user.id);
					merged.set(user.id, {
						id: user.id,
<<<<<<< HEAD
						name: user.name || user.username || "Rider",
=======
<<<<<<< HEAD
						name: user.name || user.username || 'Rider',
=======
						name: user.name || user.username || "Rider",
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
						username: user.username,
						avatar:
							user.profileImageUrl && user.profileImageUrl.trim().length > 0
								? user.profileImageUrl
								: existing?.avatar || FALLBACK_AVATAR,
						isTracking: existing?.isTracking,
						isFollowing: existing?.isFollowing,
					});
				});

				setCoRidersList(
<<<<<<< HEAD
					Array.from(merged.values()).sort((a, b) =>
						a.name.localeCompare(b.name),
					),
=======
<<<<<<< HEAD
					Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)),
=======
					Array.from(merged.values()).sort((a, b) =>
						a.name.localeCompare(b.name),
					),
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
				);
			} catch {
				if (mounted) {
					setIsSearchingGlobal(false);
				}
				return;
			} finally {
				if (mounted) {
					setIsSearchingGlobal(false);
				}
			}
		}, 320);

		return () => {
			mounted = false;
			clearTimeout(timer);
		};
	}, [baseRiders, searchQuery]);

	const filteredRiders = useMemo(
		() =>
			coRidersList.filter((rider) =>
<<<<<<< HEAD
				`${rider.name} ${rider.username || ""}`
=======
<<<<<<< HEAD
				`${rider.name} ${rider.username || ''}`
=======
				`${rider.name} ${rider.username || ""}`
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
					.toLowerCase()
					.includes(searchQuery.toLowerCase()),
			),
		[coRidersList, searchQuery],
	);

	const toggleRiderSelection = (rider: CoRider) => {
		setSelectedRiders((prev) => {
			const isSelected = prev.some((item) => item.id === rider.id);
			if (isSelected) {
				return prev.filter((item) => item.id !== rider.id);
			}

			return [...prev, rider];
		});
	};

	const handleSubmit = () => {
		onSubmit(startingPoint, endingPoint, selectedRiders);
	};

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		content: {
			paddingHorizontal: metrics.md,
			paddingTop: metrics.md,
			paddingBottom: metrics.lg,
		},
		titleRow: {
<<<<<<< HEAD
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
=======
<<<<<<< HEAD
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
=======
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
			marginTop: 6,
			marginBottom: 16,
		},
		title: {
			fontSize: typography.sizes.lg,
			fontWeight: typography.weights.medium as any,
			color: colors.textPrimary,
		},
		arrowButton: {
			padding: 4,
		},
		searchContainer: {
			marginBottom: 16,
		},
		searchInput: {
			height: 50,
			paddingHorizontal: metrics.md,
			borderRadius: 12,
			backgroundColor: colors.surfaceMuted,
			color: colors.textPrimary,
			fontSize: typography.sizes.base,
			borderWidth: 0,
		},
		listContainer: {
			paddingBottom: 8,
		},
		riderItem: {
<<<<<<< HEAD
			flexDirection: "row",
			alignItems: "center",
=======
<<<<<<< HEAD
			flexDirection: 'row',
			alignItems: 'center',
=======
			flexDirection: "row",
			alignItems: "center",
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
			height: 64,
			paddingHorizontal: 16,
			marginBottom: 12,
			borderRadius: 14,
			backgroundColor: colors.surfaceMuted,
		},
		riderItemSelected: {
			backgroundColor: colors.overlayLight,
		},
		riderAvatar: {
			width: 44,
			height: 44,
			borderRadius: 22,
			marginRight: 14,
			backgroundColor: colors.border,
		},
		riderInfo: {
			flex: 1,
		},
		riderName: {
			fontSize: typography.sizes.base,
			fontWeight: typography.weights.medium as any,
			color: colors.textPrimary,
		},
		riderNameSelected: {
			color: colors.primaryDark,
		},
		badgeRow: {
<<<<<<< HEAD
			flexDirection: "row",
=======
<<<<<<< HEAD
			flexDirection: 'row',
=======
			flexDirection: "row",
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
			marginTop: 4,
			gap: 6,
		},
		badge: {
			paddingHorizontal: 8,
			paddingVertical: 3,
			borderRadius: 10,
			backgroundColor: colors.overlayLight,
		},
		badgeText: {
			fontSize: typography.sizes.xs,
			fontWeight: typography.weights.medium as any,
			color: colors.primaryDark,
		},
		emptyState: {
			paddingVertical: 24,
<<<<<<< HEAD
			alignItems: "center",
=======
<<<<<<< HEAD
			alignItems: 'center',
=======
			alignItems: "center",
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		},
		emptyStateText: {
			fontSize: typography.sizes.base,
			color: colors.textSecondary,
		},
		loadingRow: {
			paddingVertical: 24,
<<<<<<< HEAD
			alignItems: "center",
=======
<<<<<<< HEAD
			alignItems: 'center',
=======
			alignItems: "center",
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
		},
		searchHint: {
			fontSize: typography.sizes.xs,
			color: colors.textSecondary,
			marginBottom: 10,
		},
	});

	const isValid = selectedRiders.length > 0;

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<View style={styles.titleRow}>
					<Text style={styles.title}>Select the co-riders</Text>
					<Pressable
						style={[styles.arrowButton, !isValid ? { opacity: 0.5 } : null]}
						onPress={handleSubmit}
						disabled={!isValid || isLoading}
						hitSlop={8}
					>
<<<<<<< HEAD
						<Ionicons name="arrow-forward" size={30} color={colors.primary} />
=======
<<<<<<< HEAD
						<Ionicons
							name="arrow-forward"
							size={30}
							color={colors.primary}
						/>
=======
						<Ionicons name="arrow-forward" size={30} color={colors.primary} />
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
					</Pressable>
				</View>

				<View style={styles.searchContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search followers, following, or any rider"
						placeholderTextColor={colors.textTertiary}
						value={searchQuery}
						onChangeText={setSearchQuery}
						editable={!isLoading}
					/>
<<<<<<< HEAD
=======
<<<<<<< HEAD
					<Text style={styles.searchHint}>
						Tracking = you follow them, Tracker = they follow you
					</Text>
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
				</View>

				{isLoadingRiders || isSearchingGlobal ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} size="small" />
					</View>
				) : filteredRiders.length > 0 ? (
					<FlatList
						data={filteredRiders}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContainer}
						renderItem={({ item }) => {
							const isSelected = selectedRiders.some((r) => r.id === item.id);
							return (
								<Pressable
									style={[
										styles.riderItem,
										isSelected && styles.riderItemSelected,
									]}
									onPress={() => toggleRiderSelection(item)}
									hitSlop={8}
								>
<<<<<<< HEAD
=======
<<<<<<< HEAD
									<Image source={{ uri: item.avatar }} style={styles.riderAvatar} />
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
									<Image
										source={{ uri: item.avatar }}
										style={styles.riderAvatar}
									/>
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
									<View style={styles.riderInfo}>
										<Text
											style={[
												styles.riderName,
												isSelected && styles.riderNameSelected,
											]}
										>
											{item.name}
										</Text>
										{item.username ? (
<<<<<<< HEAD
											<Text style={styles.emptyStateText}>
												@{item.username}
											</Text>
										) : null}
										<View style={styles.badgeRow} />
=======
<<<<<<< HEAD
											<Text style={styles.emptyStateText}>@{item.username}</Text>
										) : null}
										<View style={styles.badgeRow}>
											{item.isTracking ? (
												<View style={styles.badge}>
													<Text style={styles.badgeText}>Tracking</Text>
												</View>
											) : null}
											{item.isFollowing ? (
												<View style={styles.badge}>
													<Text style={styles.badgeText}>Tracker</Text>
												</View>
											) : null}
										</View>
=======
											<Text style={styles.emptyStateText}>
												@{item.username}
											</Text>
										) : null}
										<View style={styles.badgeRow} />
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
									</View>
								</Pressable>
							);
						}}
						showsVerticalScrollIndicator={false}
					/>
				) : (
					<View style={styles.emptyState}>
						<Text style={styles.emptyStateText}>No riders found</Text>
					</View>
				)}
			</View>
		</View>
	);
}
