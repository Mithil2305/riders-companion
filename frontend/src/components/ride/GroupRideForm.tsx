import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	StyleSheet,
	TextInput,
	Pressable,
	Text,
	ScrollView,
	ActivityIndicator,
	FlatList,
	Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useLocation } from '../../hooks/useLocation';
import ProfileService from '../../services/ProfileService';
import TrackerService from '../../services/TrackerService';
import { useRideLocationSuggestions } from '../../hooks/useRideLocationSuggestions';

export interface CoRider {
	id: string;
	name: string;
	username?: string;
	avatar?: string;
	isTracking?: boolean;
	isFollowing?: boolean;
}

interface GroupRideFormLevel1Props {
	onProceed: (startingPoint: string, endingPoint: string) => void;
	isLoading?: boolean;
}

interface GroupRideFormLevel2Props {
	startingPoint: string;
	endingPoint: string;
	onSubmit: (startingPoint: string, endingPoint: string, selectedRiders: CoRider[]) => void;
	isLoading?: boolean;
}

export function GroupRideFormLevel1({
	onProceed,
	isLoading = false,
}: GroupRideFormLevel1Props) {
	const { colors, typography, metrics } = useTheme();
	const [startingPoint, setStartingPoint] = useState('');
	const [endingPoint, setEndingPoint] = useState('');
	const [skipStartingLookup, setSkipStartingLookup] = useState(false);
	const [skipEndingLookup, setSkipEndingLookup] = useState(false);
	const [activeStartingQuery, setActiveStartingQuery] = useState('');
	const [activeEndingQuery, setActiveEndingQuery] = useState('');
	const [applyCurrentLocation, setApplyCurrentLocation] = useState(false);

	const {
		location,
		loading: isLocationLoading,
		getCurrentLocation,
	} = useLocation({ autoRequest: false });
	const { suggestions: startingSuggestions, isSearching: isStartingSearching } =
		useRideLocationSuggestions(activeStartingQuery);
	const { suggestions: endingSuggestions, isSearching: isEndingSearching } =
		useRideLocationSuggestions(activeEndingQuery);

	useEffect(() => {
		if (!applyCurrentLocation || !location) {
			return;
		}

		const label = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
		setSkipStartingLookup(true);
		setStartingPoint(label);
		setActiveStartingQuery('');
		setApplyCurrentLocation(false);
	}, [applyCurrentLocation, location]);

	useEffect(() => {
		if (skipStartingLookup) {
			setSkipStartingLookup(false);
			return;
		}

		setActiveStartingQuery(startingPoint);
	}, [skipStartingLookup, startingPoint]);

	useEffect(() => {
		if (skipEndingLookup) {
			setSkipEndingLookup(false);
			return;
		}

		setActiveEndingQuery(endingPoint);
	}, [endingPoint, skipEndingLookup]);

	const handleProceed = () => {
		if (startingPoint.trim() && endingPoint.trim()) {
			onProceed(startingPoint, endingPoint);
		}
	};

	const handleUseCurrentLocation = async () => {
		setApplyCurrentLocation(true);
		await getCurrentLocation();
	};

	const handleSelectStartingSuggestion = (value: string) => {
		setSkipStartingLookup(true);
		setStartingPoint(value);
		setActiveStartingQuery('');
	};

	const handleSelectEndingSuggestion = (value: string) => {
		setSkipEndingLookup(true);
		setEndingPoint(value);
		setActiveEndingQuery('');
	};

	const isValid = startingPoint.trim() && endingPoint.trim();

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
		label: {
			fontSize: typography.sizes.sm,
			fontWeight: typography.weights.medium as any,
			color: colors.textPrimary,
			marginBottom: 6,
		},
		labelRow: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
		},
		locationAction: {
			color: colors.primary,
			fontSize: typography.sizes.xs,
			fontWeight: typography.weights.medium as any,
		},
		input: {
			height: 54,
			paddingHorizontal: metrics.md,
			borderRadius: 12,
			backgroundColor: colors.surfaceMuted,
			color: colors.textPrimary,
			fontSize: typography.sizes.base,
			borderWidth: 0,
		},
		suggestionWrap: {
			marginTop: 8,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.surface,
			overflow: 'hidden',
		},
		suggestionRow: {
			paddingHorizontal: metrics.md,
			paddingVertical: 11,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
		},
		suggestionText: {
			color: colors.textPrimary,
			fontSize: typography.sizes.sm,
		},
		loadingRow: {
			paddingTop: 10,
			alignItems: 'center',
		},
		submitButton: {
			height: 56,
			borderRadius: 14,
			backgroundColor: colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
			marginTop: 24,
			opacity: isValid ? 1 : 0.6,
		},
		submitButtonText: {
			fontSize: typography.sizes.base,
			fontWeight: typography.weights.bold as any,
			color: colors.white,
		},
		disabledButton: {
			opacity: 0.6,
		},
	});

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<View>
				<View style={styles.labelRow}>
					<Text style={styles.label}>Starting point</Text>
					<Pressable
						onPress={() => {
							void handleUseCurrentLocation();
						}}
						disabled={isLoading || isLocationLoading}
					>
						<Text style={styles.locationAction}>
							{isLocationLoading ? 'Fetching location...' : 'Use current location'}
						</Text>
					</Pressable>
				</View>
				<TextInput
					style={styles.input}
					placeholder="Enter Starting Point"
					placeholderTextColor={colors.textTertiary}
					value={startingPoint}
					onChangeText={(value) => {
						setStartingPoint(value);
					}}
					editable={!isLoading}
				/>
				{isStartingSearching ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} size="small" />
					</View>
				) : null}
				{startingSuggestions.length > 0 ? (
					<View style={styles.suggestionWrap}>
						{startingSuggestions.map((item, index) => (
							<Pressable
								key={`${item}-${index}`}
								onPress={() => handleSelectStartingSuggestion(item)}
								style={styles.suggestionRow}
							>
								<Text style={styles.suggestionText}>{item}</Text>
							</Pressable>
						))}
					</View>
				) : null}
			</View>

			<View style={{ marginTop: 18 }}>
				<Text style={styles.label}>Ending point</Text>
				<TextInput
					style={styles.input}
					placeholder="Enter Ending Point"
					placeholderTextColor={colors.textTertiary}
					value={endingPoint}
					onChangeText={(value) => {
						setEndingPoint(value);
					}}
					editable={!isLoading}
				/>
				{isEndingSearching ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} size="small" />
					</View>
				) : null}
				{endingSuggestions.length > 0 ? (
					<View style={styles.suggestionWrap}>
						{endingSuggestions.map((item, index) => (
							<Pressable
								key={`${item}-${index}`}
								onPress={() => handleSelectEndingSuggestion(item)}
								style={styles.suggestionRow}
							>
								<Text style={styles.suggestionText}>{item}</Text>
							</Pressable>
						))}
					</View>
				) : null}
			</View>

			<Pressable
				style={[styles.submitButton, !isValid && styles.disabledButton]}
				onPress={handleProceed}
				disabled={!isValid || isLoading}
				hitSlop={8}
			>
				{isLoading ? (
					<ActivityIndicator color={colors.white} />
				) : (
					<Text style={styles.submitButtonText}>Send to co-riders</Text>
				)}
			</Pressable>
		</ScrollView>
	);
}

// Level 2: Co-rider Selection
export function GroupRideFormLevel2({
	startingPoint,
	endingPoint,
	onSubmit,
	isLoading = false,
}: GroupRideFormLevel2Props) {
	const { colors, typography, metrics } = useTheme();
	const [searchQuery, setSearchQuery] = useState('');
	const [baseRiders, setBaseRiders] = useState<CoRider[]>([]);
	const [coRidersList, setCoRidersList] = useState<CoRider[]>([]);
	const [selectedRiders, setSelectedRiders] = useState<CoRider[]>([]);
	const [isLoadingRiders, setIsLoadingRiders] = useState(true);
	const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

	const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=11';

	const toTrackerRider = (value: unknown): CoRider | null => {
		if (!value || typeof value !== 'object') {
			return null;
		}

		const item = value as {
			id?: unknown;
			name?: unknown;
			avatar?: unknown;
			isFollowing?: unknown;
		};

		if (typeof item.id !== 'string' || item.id.trim().length === 0) {
			return null;
		}

		return {
			id: item.id,
			name:
				typeof item.name === 'string' && item.name.trim().length > 0
					? item.name
					: 'Rider',
			avatar:
				typeof item.avatar === 'string' && item.avatar.trim().length > 0
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
						name: user.name || user.username || 'Rider',
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
					Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)),
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
				`${rider.name} ${rider.username || ''}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase()),
			),
		[coRidersList, searchQuery],
	);

	const toggleRiderSelection = (rider: CoRider) => {
		setSelectedRiders((prev) => {
			const isSelected = prev.some((r) => r.id === rider.id);
			if (isSelected) {
				return prev.filter((r) => r.id !== rider.id);
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
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
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
			flexDirection: 'row',
			alignItems: 'center',
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
			flexDirection: 'row',
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
			alignItems: 'center',
		},
		emptyStateText: {
			fontSize: typography.sizes.base,
			color: colors.textSecondary,
		},
		loadingRow: {
			paddingVertical: 24,
			alignItems: 'center',
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
						<Ionicons
							name="arrow-forward"
							size={30}
							color={colors.primary}
						/>
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
					<Text style={styles.searchHint}>
						Tracking = you follow them, Tracker = they follow you
					</Text>
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
									<Image source={{ uri: item.avatar }} style={styles.riderAvatar} />
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
